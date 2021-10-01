let name = null;
let roomNo = null;
let chat = io.connect('/chat');
/**
 * called by <body onload>
 * it initialises the interface and the expected socket messages
 * plus the associated actions
 */
function init() {
    // it sets up the interface so that userId and room are selected
    document.getElementById('initial_form').style.display = 'block';
    document.getElementById('chat_interface').style.display = 'none';
    document.getElementById('annotationDiv').style.display = 'none';

    checkSupport();
    //@todo here is where you should initialise the socket operations as described in teh lectures (room joining, chat message receipt etc.)
    initChatSocket();
}

/**
 * called to generate a random room number
 * This is a simplification. A real world implementation would ask the server to generate a unique room number
 * so to make sure that the room number is not accidentally repeated across uses
 */
function generateRoom() {
    roomNo = Math.round(Math.random() * 10000);
    document.getElementById('roomNo').value = 'R' + roomNo;
}

/**
 * called when the Send button is pressed. It gets the text to send from the interface
 * and sends the message via  socket
 */
function sendChatText() {
    let chatText = document.getElementById('chat_input').value;
    let imageUrl = document.getElementById('image_url').value;

    // @todo send the chat message
    chat.emit('chat', roomNo, name, chatText);
    // Store the values as a object
    let roomNumber_image = roomNo + '_' + imageUrl ;
    let chatData = {roomNumber_image: roomNumber_image, name: name, chatText: chatText};
    sendAjaxQueryForChat("/chatRoute", chatData);
}

/**
 * used to connect to a room. It gets the user name and room number from the
 * interface
 */
function connectToRoom() {
    roomNo = document.getElementById('roomNo').value;
    name = document.getElementById('name').value;
    let imageUrl= document.getElementById('image_url').value;
    const imageData = {imageUrl: imageUrl, userName:name, roomNo : roomNo};
    if (!name) name = 'Unknown-' + Math.random();
    storeImageData(imageData);
    //@todo join the room

    hideLoginInterface(roomNo, name);

    chat.emit('create or join', roomNo, name);

    initCanvas(chat, imageUrl, roomNo, name);
    checkFromIDB(roomNo, userId, imageUrl);

    sendAjaxQueryForImage('/imageRoute', imageData);
}

/**
 * it appends the given html text to the history div
 * this is to be called when the socket receives the chat message (socket.on ('message'...)
 * @param text: the text to append
 */
function writeOnHistory(text) {
    if (text==='') return;
    let history = document.getElementById('history');
    let paragraph = document.createElement('p');
    paragraph.innerHTML = text;
    history.appendChild(paragraph);
    // scroll to the last element
    history.scrollTop = history.scrollHeight;
    document.getElementById('chat_input').value = '';
}

/**
 * it hides the initial form and shows the chat
 * @param room the selected room
 * @param userId the user name
 */
function hideLoginInterface(room, userId) {
    document.getElementById('initial_form').style.display = 'none';
    document.getElementById('chat_interface').style.display = 'block';
    document.getElementById('annotationDiv').style.display = 'block';
    document.getElementById('who_you_are').innerHTML= userId;
    document.getElementById('in_room').innerHTML= ' '+room;

}



/*
* Check for indexDb and service worker support
* */
function checkSupport() {
    //check for support
    if ('indexedDB' in window) {
        //Init the index db database if support
        initDatabase();
        console.log("Index DB is ok!");
    } else {
        //Otherwise log error information
        console.log('This browser doesn\'t support IndexedDB');
    }
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('./service-worker.js')
            .then(function () {
                console.log('Service Worker Registered');
            });
    }

}

/**
 * it initialises the socket for /chat
 */

function initChatSocket() {
    // called when someone joins the room. If it is someone else it notifies the joining of the room
    chat.on('joined', function (room, userId) {
        if (userId === name) {
            // it enters the chat
            hideLoginInterface(room, userId);
        } else {
            // notifies that someone has joined the room
            writeOnChatHistory('<b>' + userId + '</b>' + ' joined room ' + room);
        }
    });
    // called when a message is received
    chat.on('chat', function (room, userId, chatText) {
        let who = userId
        if (userId === name) who = 'Me';
        writeOnChatHistory('<b>' + who + ':</b> ' + chatText);
    });
}


/**
 * it appends the given html text to the history div
 * @param text: teh text to append
 */

function writeOnChatHistory(text) {
    if (text === '') return;
    let history = document.getElementById('chat_history');
    let paragraph = document.createElement('p');
    paragraph.innerHTML = text;
    history.appendChild(paragraph);
    history.scrollTop = history.scrollHeight;
    document.getElementById('chat_input').value = '';
}
/**
 * Use ajax to send the image to index DB database
 */
function sendAjaxQueryForImage(url, data) {
    $.ajax({
        url: url,
        data: JSON.stringify(data),
        contentType: 'application/json',
        dataType: 'json',
        type: 'POST',
        success: function (dataR) {
            // no need to JSON parse the result, as we are using
            // dataType:json, so JQuery knows it and unpacks the
            // object for us before returning it
            // in order to have the object printed by alert
            // we need to JSON.stringify the object
            storeImageData(dataR);
        },
        error: function (response) {
            // the error structure we passed is in the field responseText
            // it is a string, even if we returned as JSON
            // if you want o unpack it you must do:
            // const dataR= JSON.parse(response.responseText)
            console.log(response.responseText);
            // Store the image data object in the indexDB database, if offline
            storeImageData(data);
        }
    });
}


/*
* Clear the text message
*
* */
function cleaChatHistory() {
    console.log('check');
    let history = document.getElementById('chat_history');
    // let paragraph = document.getElementsByTagName('p');
    let paragraph = document.querySelectorAll('#chat_history>p');
    let i = 0;
    for (i = 0; i < paragraph.length; i++) {
        console.log(paragraph[i]);
        removeElement(paragraph[i]);
    }
}
/*
* function to delete the node tag
*
* */
function removeElement(tag) {
    let parentTag = tag.parentNode;
    if (parentTag) {
        parentTag.removeChild(tag);
    }
}

/**
 * Use ajax to send the image to index DB database
 */
function sendAjaxQueryForChat(url, data) {
    $.ajax({
        url: url,
        data: JSON.stringify(data),
        contentType: 'application/json',
        dataType: 'json',
        type: 'POST',
        success: function (dataR) {
            // no need to JSON parse the result, as we are using
            // dataType:json, so JQuery knows it and unpacks the
            // object for us before returning it
            // in order to have the object printed by alert
            // we need to JSON.stringify the object
            storeChatData(dataR);
        },
        error: function (response) {
            // the error structure we passed is in the field responseText
            // it is a string, even if we returned as JSON
            // if you want o unpack it you must do:
            // const dataR= JSON.parse(response.responseText)
            console.log(response.responseText);
            // Store the chat data object in the indexDB database, if off-line
            storeChatData(data);
        }
    });
}



/*
* Read the image from local
* */
function readLocalImage() {
    let url = null;
    let file = document.querySelector('input[type=file]').files[0];
    let reader = new FileReader();
    let input = document.getElementById('image_url');

    reader.addEventListener("load", function () {
        url = reader.result;
        input.value = url;
    }, false);

    if (file) {
        reader.readAsDataURL(file);
    }
}
