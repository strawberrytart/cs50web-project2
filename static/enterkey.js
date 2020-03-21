document.addEventListener('DOMContentLoaded', () => {
    
    let msg=document.querySelector('#user-message');
    msg.addEventListener('keyup', event=>{
        event.preventDefault();
        if (event.keyCode===13){
            document.querySelector('#send-message').click();
            document.querySelector('#send-message').disabled = true;
        }
    });

    let room=document.querySelector('#user-room');
    room.addEventListener('keyup', event=>{
        event.preventDefault();
        if (event.keyCode===13){
            document.querySelector('#create-room').click();
            document.querySelector('#create-room').disabled = true;
        }
    });
    
    let username=document.querySelector('#username-modal');
    username.addEventListener('keyup', event=>{
        event.preventDefault();
        if (event.keyCode===13){
            document.querySelector('#create-username').click();
            document.querySelector('#create-username').disabled = true;
        }
    });

    //Prevent creating rooms with empty strings
    document.querySelector('#user-room').onkeyup = () => {
        let room=document.querySelector('#user-room').value
        if (room.trim().length > 0){
            document.querySelector('#create-room').classList.remove('disabled');
        }
        else{
            document.querySelector('#create-room').classList.add('disabled');
        }
    };

    // Prevent sending empty messages 
    document.querySelector('#send-message').disabled = true;
    document.querySelector('#user-message').onkeyup = () => {
        let msg=document.querySelector('#user-message').value
        if (msg.trim().length > 0)
            document.querySelector('#send-message').disabled = false;
        else
            document.querySelector('#send-message').disabled = true;
    };

    // Prevent submitting empty strings as username
    document.querySelector('#create-username').disabled = true;
    document.querySelector('#username-modal').onkeyup = () => {
        let msg=document.querySelector('#username-modal').value
        if (msg.trim().length > 0)
            document.querySelector('#create-username').disabled = false;
        else
            document.querySelector('#create-username').disabled = true;
    };


});