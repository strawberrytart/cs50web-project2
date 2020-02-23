document.addEventListener('DOMContentLoaded', () => { 

    //Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    socket.on('connect', ()=>{
        console.log("I am connected");
    });
    /*
    if (localStorage.getItem('room')){
        var currentRoom = localStorage.getItem('room');
    }
    else{
        var currentRoom="Lounge";
    };*/

    var currentRoom;
    // Check if user has registered before.
    if (!localStorage.getItem('username')){
        var modal = document.querySelector(".nugget");
        toggleModal();
        document.querySelector('#username-modal').focus();
        // Guest registers username
        document.querySelector('#create-username').onclick=() =>{
            username=document.querySelector('#username-modal').value.trim();
            socket.emit('username-creation', {'username':username})
        }

        socket.on("verify-username", data=>{
            if (!data.success){
                alert(`${data.username} is taken.`)
            }
            else{
                toggleModal();
                localStorage.setItem('username',data.username)
                joinRoom("Lounge");
                currentRoom="Lounge";
            }
        });
    }
    //User has logged in before.
    else{
        let last_room=localStorage.getItem('room')
        joinRoom(last_room);
        currentRoom=last_room;
    }

    //Display messages on the message section
    socket.on("display-message", data=>{

        if (data.flag){
            document.querySelector('.msg').remove()
        }
        const p=document.createElement('p');
        const span_timestamp=document.createElement('span');
        const br=document.createElement('br');
        const span_username=document.createElement('span')
        span_timestamp.innerHTML=data.time_stamp;
        span_username.innerHTML=data.username;
        p.className='msg'
        p.innerHTML=span_username.outerHTML+br.outerHTML+data.msg+ br.outerHTML+ span_timestamp.outerHTML;
        document.querySelector('#display-message-section').append(p);
    });

    socket.on("system-message",data=>{
        printSysMsg(data.msg)
    });

    // Send message
    document.querySelector('#send-message').onclick= ()=>{
        msg=document.querySelector('#user-message').value.trim();
        socket.emit('receive_message', {'msg':msg, 'room': currentRoom,'username':localStorage.getItem('username')});
        document.querySelector('#user-message').value='';
    };

    // User creates room
    document.querySelector('#create-room').onclick=()=> {
        let room=document.querySelector('#user-room').value.trim();
        socket.emit('create_room', {'new_room':room});
        document.querySelector('#user-room').value='';
    }

    // Dynamically adding room to room list 
    socket.on("add_room", data=>{
        if (!data.success){
            alert(`${data.new_room} has already been created.`)
        }
        else {
            socket.emit('update-room-list', {'channel':data.new_room});
        }
    });

    socket.on("final-update", data=>{
        const li=document.createElement('li');
        li.innerHTML=data.new_room;
        li.className='select-room';
        document.querySelector('#rooms').append(li);
    });

    // Immediately joins the newly created room
    socket.on("change-room", data=>{
        leaveRoom(currentRoom);
        joinRoom(data.new_room);
        currentRoom=data.new_room;
    });

    // Event delegation for dynamic unordered list of rooms. Switching between rooms
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
                console.log(currentRoom);
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
    
    socket.on("load-message", data=>{
    for (var i=0; i< data.msg_obj.length; i++){
        const p=document.createElement('p');
        const span_timestamp=document.createElement('span');
        const br=document.createElement('br');
        const span_username=document.createElement('span');
        span_username.innerHTML=data.msg_obj[i]['username'];
        span_timestamp.innerHTML=data.msg_obj[i]['time_stamp'];
        p.className='msg'
        p.innerHTML=span_username.outerHTML+br.outerHTML+data.msg_obj[i]['msg']+ br.outerHTML+ span_timestamp.outerHTML;

        document.querySelector('#display-message-section').append(p);

        }
    });

    function leaveRoom(room){
        socket.emit('leave', {'room':room, 'username':localStorage.getItem('username')});
    };

    function joinRoom(room){
        socket.emit('join', {'room':room, 'username':localStorage.getItem('username')});
        localStorage.setItem('room',room)
        document.querySelector('#display-message-section').innerHTML='';
        document.querySelector('#user-message').focus();
        load(room)
    };

    function printSysMsg(msg) {
        const p=document.createElement('p');
        p.innerHTML=msg;
        document.querySelector('#display-message-section').append(p);
    };

    function load(room){
        socket.emit('load',{'room':room});
    };

    function toggleModal() {
        modal.classList.toggle("show-nugget");
    }

});



