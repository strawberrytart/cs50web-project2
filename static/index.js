document.addEventListener('DOMContentLoaded', () => {
    //Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    let currentRoom = "Lounge";
    joinRoom("Lounge");

    socket.on('connect', ()=>{

        console.log("I am connected");//automatically send to an event in the server called message
    });


    socket.on("display-message", data=>{
        const p=document.createElement('p');
        const span_timestamp=document.createElement('span');
        const br=document.createElement('br');
        span_timestamp.innerHTML=data.time_stamp;
        p.innerHTML=data.msg+ br.outerHTML+ span_timestamp.outerHTML;
        document.querySelector('#display-message-section').append(p);
    });

    document.querySelector('#send-message').disabled = true;
    document.querySelector('#user-message').onkeyup = () => {
        if (document.querySelector('#user-message').value.length > 0)
            document.querySelector('#send-message').disabled = false;
        else
            document.querySelector('#send-message').disabled = true;
    };


    document.querySelector('#send-message').onclick= ()=>{
        msg=document.querySelector('#user-message').value;
        socket.emit('receive_message', {'msg':msg, 'room': currentRoom});
        document.querySelector('#user-message').value='';

    };

    document.querySelector('#create-room').onclick=()=> {
        let room=document.querySelector('#user-room').value;
        socket.emit('create_room', {'new_room':room});
        document.querySelector('#user-message').value='';
    }

    
    socket.on("add_room", data=>{
        if (data.success){
            const li=document.createElement('li');
            li.innerHTML=data.new_room;
            li.className='select-room'
            document.querySelector('#rooms').append(li)
            leaveRoom(currentRoom);
            joinRoom(data.new_room);
            currentRoom=data.new_room;
            console.log(currentRoom);
        }
        else {
            alert(`${data.new_room} has already been created.`);
        }
    });

    const parent=document.getElementById('rooms');

    parent.addEventListener('click', event=>{
        if (event.target && event.target.nodeName=="LI"){
            let newRoom=event.target.innerHTML;
            if (newRoom==currentRoom){
                msg=`You are already in ${currentRoom} room.`
                printSysMsg(msg);
            }
            else{
                leaveRoom(currentRoom)
                joinRoom(newRoom);
                currentRoom=newRoom;
            }
        }
    });

    /*
    document.querySelectorAll('.select-room').forEach(room => {
        room.onclick=() => {
            let newRoom=room.innerHTML;
            if (newRoom==currentRoom){
                msg=`You are already in ${currentRoom} room.`
                printSysMsg(msg);
            }
            else{
                leaveRoom(currentRoom);
                joinRoom(newRoom);
                currentRoom=newRoom;
            }
        }
    });
    */
    

    function leaveRoom(room){
        socket.emit('leave', {'room':room});
    };

    function joinRoom(room){
        socket.emit('join', {'room':room});
        document.querySelector('#display-message-section').innerHTML='';
        document.querySelector('#user-message').focus();
    };

    function printSysMsg(msg) {
        const p=document.createElement('p');
        p.innerHTML=msg;
        document.querySelector('#display-message-section').append(p);
    };
});

