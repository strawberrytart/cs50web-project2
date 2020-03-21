document.addEventListener('DOMContentLoaded', () => { 

    //Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    socket.on('connect', ()=>{
        console.log("I am connected");
    });
    var currentRoom;
    var DirectWindow;
    var UnReadMessages;
    // Check if user has registered before.
    if (!localStorage.getItem('username')){
        var modal = document.querySelector(".nugget");
        toggleModal();
        document.querySelector('#username-modal').focus();
        // Guest registers username
        document.querySelector('#create-username').onclick=() =>{
            username=document.querySelector('#username-modal').value.trim();
            color=hsv_to_rgb();
            document.querySelector('#username-modal').innerHTML="";
            socket.emit('username-creation', {'username':username, 'color':color});
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
                load_dm_user();
            }
        });
    }
    //User has logged in before.
    else{
        DirectWindow=localStorage.getItem('DirectWindow');
        if (DirectWindow=='true'){
            recipient=localStorage.getItem('directMessage');
            joinDirectMessage(recipient);
            load_dm_user();
        }
        else{
            let last_room=localStorage.getItem('room');
            joinRoom(last_room);
            currentRoom=last_room;
            load_dm_user();

        };
    };

    //Display messages on the message section
    socket.on("display-message", data=>{

        if (data.flag){
            document.querySelector('.messages').remove()
        } 

        if (data.username==localStorage.getItem('username')){
            console.log('Place message blue and right.');
            var outer_div=document.createElement('div');
            var inner_div=document.createElement('div');
            let msg=document.createElement('p');
            let time_stamp=document.createElement('span');
            msg.classList.add('msg');
            time_stamp.classList.add('timestamp');
            msg.innerHTML=data.msg;
            time_stamp.innerHTML=data.time_stamp;
            inner_div.innerHTML=msg.outerHTML+time_stamp.outerHTML;
            inner_div.classList.add('message');
            outer_div.innerHTML=inner_div.outerHTML;
            outer_div.classList.add('mine', 'messages');
        }
        else{
            console.log('Place message grey and left.');
            var outer_div=document.createElement('div');
            var inner_div=document.createElement('div');
            let msg=document.createElement('p');
            let name=document.createElement('p');
            let time_stamp=document.createElement('span');
            msg.classList.add('msg');
            name.classList.add('name');
            time_stamp.classList.add('timestamp');
            msg.innerHTML=data.msg;
            time_stamp.innerHTML=data.time_stamp;
            name.innerHTML=data.username;
            console.log(data.color);
            name.style.color=data.color;
            inner_div.innerHTML=name.outerHTML+msg.outerHTML+time_stamp.outerHTML;
            inner_div.classList.add('message');
            outer_div.innerHTML=inner_div.outerHTML;
            outer_div.classList.add('yours', 'messages');
        };
        console.log(outer_div);
        document.querySelector('#display-message-section').append(outer_div);
        scrollToBottom('content');
    });

    socket.on("display-dm-message", data=>{
        if (data.sender==localStorage.getItem('username')){
            console.log(data.sender+" is the sender.");
            loadDirectMessages(data.msg,data.sender,data.recipient);
        }
        else{
            DirectWindow=localStorage.getItem('DirectWindow');
            if (DirectWindow=='true'){
                console.log('DirectWindow is opened.')
                if (localStorage.getItem('directMessage')==data.sender){
                    loadDirectMessages(data.msg,data.sender,data.recipient);
                }
                else{
                    UnReadMessages=localStorage
                    let ul=document.querySelector('#direct-message-active-users');
                    items=ul.getElementsByTagName('li');
                    for (var i=0; i<items.length; ++i){
                        if (items[i].innerHTML==data.sender){
                            items[i].style.backgroundColor='blue';
                            UnReadMessages.push(data.sender);
                            localStorage.setItem('UnreadMessages', JSON.stringify(UnReadMessages));
                            console.log('stored unread messages.')
                        };
                    };
                    console.log('Change list to blue.');
                };
            }
            else if (DirectWindow=='false'){
                console.log('DirectWindow is closed.');
                console.log('Change list to blue.');
                let ul=document.querySelector('#direct-message-active-users');
                items=ul.getElementsByTagName('li');
                for (var i=0; i<items.length; ++i){
                    if (items[i].innerHTML==data.sender){
                        items[i].style.backgroundColor='blue';
                    };
                };
            };        
        };
    });

    //Display message badge
    socket.on('display-badge',data=>{
        let ul=document.querySelector('#direct-message-active-users');
        items=ul.getElementsByTagName('li');
        console.log(data.count)
        for (var i=0; i<items.length; ++i){
            if (items[i].innerHTML==data.sender){
                span="<span class=\"badge badge-light\">"+data.count+"</span>";
                items[i].innerHTML=data.sender+span;
            };
        };
        console.log('Change list to blue.');
    });


    //Updates the active user bar
    socket.on("active-user-bar",data =>{
        if (!data.action){
            console.log(data.action);
            const x=document.querySelector('#active-user');
            console.log(x);
            const li=document.getElementById(data.user);
            console.log(li);
            x.removeChild(li)
            console.log('Removed a user');
        }
        else {
            document.querySelector('#active-user').innerHTML='';
            for (var i=0; i<data.activeuser_obj.length; i++){
                const li=document.createElement('li');
                li.innerHTML=data.activeuser_obj[i];
                li.id=`${data.activeuser_obj[i]}`;
                document.querySelector('#active-user').append(li);
            }
            console.log('Loaded active users.')
        };
    });

    // Send message
    document.querySelector('#send-message').onclick= ()=>{
        msg=document.querySelector('#user-message').value.trim();
        DirectWindow=localStorage.getItem('DirectWindow');
        if (DirectWindow=='true'){
            payload={'msg':msg, 'room': currentRoom,'sender':localStorage.getItem('username'),'DirectWindow': DirectWindow, 'recipient':localStorage.getItem('directMessage')}
            socket.emit('receive_direct_message', payload)
        }
        else if (DirectWindow=='false'){
            socket.emit('receive_message', {'msg':msg, 'room': currentRoom,'username':localStorage.getItem('username'),'DirectWindow': DirectWindow});
        }
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
            console.log(newRoom)
            if (newRoom==currentRoom){
                msg=`You are already in ${currentRoom} room.`
                console.log(msg)
                document.querySelector('#sidebar').classList.remove('active');
                document.querySelector('.overlay').classList.remove('active');
            }
            else{
                leaveRoom(currentRoom);
                joinRoom(newRoom);
                currentRoom=newRoom;
                console.log(currentRoom);
                document.querySelector('#sidebar').classList.remove('active');
                document.querySelector('.overlay').classList.remove('active');
            }
        }
    });
 
    socket.on("load-message", data=>{
        sender=localStorage.getItem('username');
        for (var i=0; i< data.msg_obj.length; i++){
            if ((data.msg_obj[i]['username'])==sender){
                console.log('Place message blue and right.');
                var outer_div=document.createElement('div');
                var inner_div=document.createElement('div');
                let msg=document.createElement('p');
                let time_stamp=document.createElement('span');
                msg.classList.add('msg');
                time_stamp.classList.add('timestamp');
                msg.innerHTML=data.msg_obj[i]['msg'];
                time_stamp.innerHTML=data.msg_obj[i]['time_stamp'];
                inner_div.innerHTML=msg.outerHTML+time_stamp.outerHTML;
                inner_div.classList.add('message');
                outer_div.innerHTML=inner_div.outerHTML;
                outer_div.classList.add('mine', 'messages');
            }
            else{
                console.log('Place message grey and left.');
                var outer_div=document.createElement('div');
                var inner_div=document.createElement('div');
                let msg=document.createElement('p');
                let name=document.createElement('p');
                let time_stamp=document.createElement('span');
                msg.classList.add('msg');
                name.classList.add('name');
                time_stamp.classList.add('timestamp');
                msg.innerHTML=data.msg_obj[i]['msg'];
                time_stamp.innerHTML=data.msg_obj[i]['time_stamp'];;
                name.innerHTML=data.msg_obj[i]['username'];
                name.style.color=data.msg_obj[i]['color'];
                inner_div.innerHTML=name.outerHTML+msg.outerHTML+time_stamp.outerHTML;
                inner_div.classList.add('message');
                outer_div.innerHTML=inner_div.outerHTML;
                outer_div.classList.add('yours', 'messages');
            };
            document.querySelector('#display-message-section').append(outer_div);
            scrollToBottom('content');
        };
    });

    //Direct Messages
    socket.on("load_dm",data=>{
        document.querySelector('#direct-message-active-users').innerHTML='';
        for (var i=0; i< data.length; i++){
            const li=document.createElement('li');
            li.innerHTML=data[i]
            if (data[i]==localStorage.getItem('username')){
                li.innerHTML=data[i]+' (you)'
            }
            document.querySelector('#direct-message-active-users').append(li);
        };
        console.log('Loaded dm users.')
    });

    
    const a=document.getElementById('direct-message-active-users');
    a.addEventListener('click', event=>{
        if (event.target && event.target.nodeName=="LI"){
            var recipient=event.target.innerHTML;
            if (recipient.indexOf(localStorage.getItem('username'))!==-1){
                recipient=recipient.split(" ")[0]
            }
            console.log(recipient+' was clicked.')
            console.log(event.target);
            leaveRoom(currentRoom);
            joinDirectMessage(recipient); 
            event.target.style.backgroundColor=null;
            document.querySelector('#sidebar').classList.remove('active');
            document.querySelector('.overlay').classList.remove('active');   
        };
    });

    socket.on('new_direct_message', data=>{
        if (data.sender==localStorage.getItem('username')){
            console.log(data.sender+" is the sender.");
            localStorage.setItem('room',data.room);
            currentRoom=data.room;
            DirectWindow=true;
            localStorage.setItem('directMessage',data.recipient);// initialize receiver 
            localStorage.setItem('DirectWindow', 'true');
            loadDirectMessages(data.dms, data.sender, data.recipient);
            document.querySelector('#active-user').innerHTML='';
        }
        else{
            console.log("receiver doesnt have dm on yet.")
        };
    });


    //Logout
    document.querySelector('#logout').onclick=() =>{//when user clicks on logout
        username=localStorage.getItem('username');//get the user who is trying to logout
        document.querySelector('#display-message-section').innerHTML='';//clear display message area
        document.querySelector('#active-user').innerHTML='';//clear active user bar 
        leaveRoom(currentRoom)//leave the current room
        socket.emit('logout', {'username':username});//emit to an event in server called logout in order to remove session
        localStorage.clear();//clear all localStorage info
        modal = document.querySelector(".nugget");
        document.querySelector('#infobar').classList.remove('active');
        toggleModal();
        document.querySelector('#username-modal').focus();
    }

    //Functions
    function scrollToBottom (id) {
        var div = document.getElementById(id);
        div.scrollTop = div.scrollHeight - div.clientHeight;
        console.log('Scrolled to bottom');
     }

    function loadDirectMessages(messages,sender,recipient){
        document.querySelector('#display-message-section').innerHTML='';
        aList=messages[sender][recipient];
        sender=localStorage.getItem('username');
        for (var i=0; i< aList.length; i++){
            console.log(aList[i]);
            if ((aList[i].username)==sender){
                console.log('Place message on right and blue');
                var outer_div=document.createElement('div');
                var inner_div=document.createElement('div');
                let msg=document.createElement('p');
                let time_stamp=document.createElement('span');
                msg.classList.add('msg');
                time_stamp.classList.add('timestamp');
                msg.innerHTML=aList[i]['msg'];
                time_stamp.innerHTML=aList[i]['time_stamp'];
                inner_div.innerHTML=msg.outerHTML+time_stamp.outerHTML;
                inner_div.classList.add('message');
                outer_div.innerHTML=inner_div.outerHTML;
                outer_div.classList.add('mine', 'messages');
            }
            else{
                console.log('Place message on left and grey');
                var outer_div=document.createElement('div');
                var inner_div=document.createElement('div');
                let msg=document.createElement('p');
                let time_stamp=document.createElement('span');
                msg.classList.add('msg');
                time_stamp.classList.add('timestamp');
                msg.innerHTML=aList[i]['msg'];
                time_stamp.innerHTML=aList[i]['time_stamp'];
                inner_div.innerHTML=msg.outerHTML+time_stamp.outerHTML;
                inner_div.classList.add('message');
                outer_div.innerHTML=inner_div.outerHTML;
                outer_div.classList.add('yours', 'messages');
            };
            document.querySelector('#display-message-section').append(outer_div);
            scrollToBottom('content');
        };
    };


    function leaveRoom(room){
        socket.emit('leave', {'room':room, 'username':localStorage.getItem('username')});
    };

    //joins a new room
    function joinRoom(room){
        document.querySelector('#display-message-section').innerHTML='';
        socket.emit('join', {'room':room, 'username':localStorage.getItem('username')});
        localStorage.setItem('room',room);
        document.querySelector('#currentRoom').innerHTML=room;
        load(room);
        document.querySelector('#user-message').focus();
        localStorage.setItem('DirectWindow','false')
    };

    function load_dm_user(){
        socket.emit('load_dm_users')
    }


    function load(room){
        socket.emit('load',{'room':room});
    };

    function toggleModal() {
        modal.classList.toggle("show-nugget");
    };

    function joinDirectMessage(recipient){
        document.querySelector('#display-message-section').innerHTML='';
        socket.emit('joinDirectMessage',{'recipient':recipient, 'sender':localStorage.getItem('username')})
        document.querySelector('#user-message').focus();
        document.querySelector('#currentRoom').innerHTML=recipient;
    };

    function hsv_to_rgb(){
        golden_ratio_conjugate=0.618033988749895;
        var h=(Math.random()+golden_ratio_conjugate)%1;
        var s=0.5;
        var v=0.95;
        var hi = Math.floor(h * 6);
        var f = h * 6 - hi;
        var p = v * (1 - s);
        var q = v * (1 - f * s);
        var t = v * (1 - (1 - f) * s);
        var r = 255;
        var g = 255;
        var b = 255;
        
        switch (hi) {
            case 0:
            r = v;
            g = t;
            b = p;
            break;
            case 1:
            r = q;
            g = v;
            b = p;
            break;
            case 2:
            r = p;
            g = v;
            b = t;
            break;
            case 3:
            r = p;
            g = q;
            b = v;
            break;
            case 4:
            r = t;
            g = p;
            b = v;
            break;
            case 5:
            r = v;
            g = p;
            b = q;
            break;
        }
        
        color=[Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
        return `rgb(${color[0].toString()},${color[1].toString()},${color[2].toString()})`;
    };
});