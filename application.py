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
username={}
limit=10


@app.route("/")
def index():
    return render_template("index.html", rooms=rooms.keys())

@socketio.on("receive_message")
def handle_message(data):
    flag=False
    if len(rooms[data["room"]]) >=limit:
        rooms[data["room"]].pop(0)
        flag=True
    rooms[data["room"]].append({'msg':data['msg'],'username':data['username'],'time_stamp':strftime("%b-%d %H:%M", localtime())})

    print(f'\n\n{rooms[data["room"]]} \n\n')
    load={'msg':data['msg'], 'time_stamp':strftime("%b-%d %H:%M", localtime()), 'room':data['room'], 'flag':flag, 'username':data['username']}
    emit("display-message", load, room=data['room'])

@socketio.on("create_room")
def create_room(data):

    print(f"\n\n{data['new_room']}\n\n")
    
    success=False
    if data['new_room'] in rooms:
        print(f"{data['new_room']} has already been created.")
    else:
        rooms[data['new_room']]=[]
        print(f"Successfully added {data['new_room']} as a new room.")
        print(f"\n\n{rooms}\n\n")
        success=True
    emit("add_room", {'success':success, 'new_room':data['new_room']})


@socketio.on('update-room-list')
def update_room_list(data):
    room=data['channel']
    emit("final-update", {'new_room':room}, broadcast=True)
    emit("change-room", {'new_room':room})

@socketio.on('join')
def on_join(data):
    join_room(data['room'])
    emit("system-message",{'msg':data['username']+ " has joined the "+data['room']+" room.", 'time_stamp':strftime("%b-%d %H:%M", localtime())}, room=data['room'])

@socketio.on('leave')
def on_leave(data):

    leave_room(data['room'])
    emit("system-message",{'msg': data['username']+" has left the "+data['room']+" room.", 'time_stamp':strftime("%b-%d %H:%M", localtime())}, room=data['room'])

@socketio.on('load')
def on_load(data):
    print(rooms[data['room']])
    emit("load-message",{'msg_obj':rooms[data['room']]})

@socketio.on('username-creation')
def create_username(data):
    success=False
    if data['username'] in username:
        print("Username is taken!")
    else:
        username[data['username']]=[]
        session["username"]=data['username']
        success=True
        print(f"Username {data['username']} successfully added.")
        print(session)
        print(username)
    emit("verify-username", {'username':data['username'], 'success':success})


if __name__ == "__main__":
    socketio.run(app, debug=True)