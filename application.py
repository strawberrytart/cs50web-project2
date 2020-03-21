import os
from time import localtime, strftime
from datetime import timedelta
from flask import Flask, render_template, jsonify,request, session, app
from flask_socketio import SocketIO, emit, send, join_room, leave_room
from flask_session import Session

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# Configure session to use filesystem
app.config["SESSION_PERMANENT"] = False
app.config['PERMANENT_SESSION_LIFETIME'] =  timedelta(minutes=5)
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

rooms={"Lounge":[], "Games":[], "Coding":[]}
active_users={"Lounge":[], "Games":[], "Coding":[]}
username={}
limit=10
directMessages={}
directMessageBadge={}
active_dm_users={}


@app.route("/")
def index():
    return render_template("index.html", rooms=rooms.keys())

@socketio.on("receive_message")
def handle_message(data):
    flag=False
    if len(rooms[data["room"]]) >=limit:
        rooms[data["room"]].pop(0)
        flag=True
    color=username[data['username']]['color']
    rooms[data["room"]].append({'msg':data['msg'],'username':data['username'],'time_stamp':strftime("%b-%d %H:%M", localtime()),'color':color})
    print(f'\n{rooms[data["room"]]}\n')
    load={'msg':data['msg'], 'time_stamp':strftime("%b-%d %H:%M", localtime()), 'room':data['room'], 'flag':flag, 'username':data['username'], 'color':color}
    emit("display-message", load, room=data['room'])

@socketio.on('receive_direct_message')
def handle_direct_message(data):
    flag=False
    if len(directMessages[data['recipient']][data['sender']]) >=limit:
        directMessages[data['recipient']][data['sender']].pop(0)
        flag=True
    if len(directMessages[data['sender']][data['recipient']])>=limit:
        directMessages[data['sender']][data['recipient']].pop(0)
        flag=True
    message={'msg':data['msg'],'username':data['sender'],'time_stamp':strftime("%b-%d %H:%M", localtime())}
    if data['recipient']==data['sender']:
        directMessages[data['sender']][data['recipient']].append(message)
    else:
        directMessages[data['recipient']][data['sender']].append(message)
        directMessages[data['sender']][data['recipient']].append(message)
    print(f'\n\n{directMessages}\n\n')
    print('The room is '+data['room'])
    load={'msg':directMessages,'room':data['room'], 'flag':flag, 'sender':data['sender'], 'recipient':data['recipient']}
    emit("display-dm-message", load, room=data['room'])


@socketio.on("create_room")
def create_room(data):

    print(f"\n\n{data['new_room']}\n\n")
    
    success=False
    if data['new_room'] in rooms:
        print(f"{data['new_room']} has already been created.")
    else:
        rooms[data['new_room']]=[]
        active_users[data['new_room']]=[]
        print(f"Successfully added {data['new_room']} as a new room.")
        print(f"\n\n{rooms}\n\n")
        success=True
    emit("add_room", {'success':success, 'new_room':data['new_room']})


@socketio.on('update-room-list')
def update_room_list(data):
    room=data['channel']
    emit("final-update", {'new_room':room}, broadcast=True)
    emit("change-room", {'new_room':room})

# Join a room
@socketio.on('join')
def on_join(data):
    join_room(data['room'])
    action=True
    if data['username'] not in active_users[data['room']]:
        active_users[data['room']].append(data['username'])
    print(f"{data['username']} has joined {data['room']}: {active_users[data['room']]}")
    emit("active-user-bar",{'activeuser_obj':active_users[data['room']],'action':action}, room=data['room'])

# Leave a room
@socketio.on('leave')
def on_leave(data):
    leave_room(data['room']) #leave room
    action=False #flag for active user bar in client side
    active_users[data['room']].remove(data['username']) #remove user from the active user bar
    print(f"{data['username']} has left {data['room']}: {active_users[data['room']]}")
    emit("active-user-bar",{'user': data['username'], 'action':action}, room=data['room'])

@socketio.on('load')
def on_load(data):
    print(rooms[data['room']])
    emit("load-message",{'msg_obj':rooms[data['room']]})

#Creates username
@socketio.on('username-creation')
def create_username(data):
    success=False
    if data['username'] in username:
        print("Username is taken!")
    else:
        username[data['username']]={'request.sid':request.sid, 'color':data['color']}
        session["username"]=data['username']
        success=True
        print(f"Username {data['username']} successfully added.")
        print(session)
        print(username)
    emit("verify-username", {'username':data['username'], 'success':success})

#Logout
@socketio.on('logout')
def on_logout(data):
    session.pop('username',None)#remove username from session dict, return None if username not found
    print("Removed user from session")
    username.pop(data['username'], None)#remove user from username dict
    print("Removed user from user dicionary")

@socketio.on('return')
def on_return(data):
    join_room(data['room'])
    action=True
    emit("active-user-bar",{'activeuser_obj':active_users[data['room']],'action':action}, room=data['room'])

#Direct Messages 
@socketio.on('load_dm_users')
def load_dm_users():
    user_list=list(username.keys())
    emit('load_dm', user_list, broadcast=True) #broadcast set to True. All users will be notified when new users join.

@socketio.on('joinDirectMessage')
def joinDirectMessage(data):
    if data['sender']==data['recipient']:
        room=username[data['sender']]['request.sid']
    else:
        room=data['sender']+data['recipient']
    print(f"{room} was created.")
    print(f"\n\n Recipient: {data['recipient']}, Sender: {data['sender']}\n\n")
    if data['recipient'] not in directMessages:
        directMessages[data['recipient']]={}
    if data['sender'] not in directMessages:
        directMessages[data['sender']]={}
    if data['sender'] not in directMessages[data['recipient']]:
        directMessages[data['recipient']][data['sender']]=[]
    if data['recipient'] not in directMessages[data['sender']]:
        directMessages[data['sender']][data['recipient']]=[]
    print(f'DirectMessage{directMessages}')
    if data['recipient']==data['sender']:
        print('recipient and sender is the same yo.')
        join_room(room)
    else:
        #Recipient joins room 
        join_room(room, sid=username[data['recipient']]['request.sid'])
        #Sender joins room 
        join_room(room, sid=request.sid)
    print(f"{username[data['recipient']]} and {username[data['sender']]} have joined room.")
    emit('new_direct_message',{'dms':directMessages,'sender':data['sender'],'recipient':data['recipient'],'room':room},room=room)

if __name__ == "__main__":
    socketio.run(app, debug=True)