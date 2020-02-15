import os
from time import localtime, strftime
from flask import Flask, render_template, jsonify,request
from flask_socketio import SocketIO, emit, send, join_room, leave_room

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

rooms=['lounge', 'news','games','coding']

@app.route("/")
def index():
    return render_template("index.html", rooms=rooms)

@socketio.on("receive_message")
def handle_message(data):

    print(f"\n\n{data}\n\n")
    load={'msg':data['msg'], 'time_stamp':strftime("%b-%d %H:%M", localtime()), 'room':data['room']}
    emit("display-message", load, room=data['room'])

@socketio.on("create_room")
def create_room(data):

    print(f"\n\n{data['new_room']}\n\n")
    
    success=False
    if data['new_room'] in rooms:
        print(f"{data['new_room']} has already been created.")
    else:
        rooms.append(data['new_room'])
        print(f"Successfully added {data['new_room']} as a new room.")
        success=True
    emit("add_room", {'success':success, 'new_room':data['new_room']}, broadcast=True)

@socketio.on('join')
def on_join(data):
    join_room(data['room'])
    emit("display-message",{'msg':"User has joined the "+data['room']+" room.", 'time_stamp':strftime("%b-%d %H:%M", localtime())}, room=data['room'])

@socketio.on('leave')
def on_leave(data):

    leave_room(data['room'])
    emit("display-message",{'msg':"User has left the "+data['room']+" room.", 'time_stamp':strftime("%b-%d %H:%M", localtime())}, room=data['room'])

if __name__ == "__main__":
    socketio.run(app, debug=True)