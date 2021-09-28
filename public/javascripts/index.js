let name = null;
let roomNo = null;
let chat = io.connect('/chat');

// let pane = io.connect('/pane');

/**
 * called by <body onload>
 * it initialises the interface and the expected socket messages
 * plus the associated actions
 */
function init() {

    // it sets up the interface so that userId and room are selected
    document.getElementById('initial_form').style.display = 'block';
    document.getElementById('chat_interface').style.display = 'none';

    // Check the support for indexDB and service worker
    checkSupport();

    //@todo here is where you should initialise the socket operations as described in teh lectures (room joining, chat message receipt etc.)
    initChatSocket();
}


/**
 * When the client gets off-line, it shows an off line warning to the user
 * so that it is clear that the data is stale
 */
window.addEventListener('offline', function (e) {
    // Queue up events for server.
    console.log("You are offline");
    showOfflineWarning();
}, false);

/**
 * When the client gets online, it hides the off line warning
 */
window.addEventListener('online', function (e) {
    // Resync data with server.
    console.log("You are online");
    hideOfflineWarning();
}, false);

function showOfflineWarning() {
    if (document.getElementById('offline_div') != null)
        document.getElementById('offline_div').style.display = 'block';

    if (document.getElementById('offline_div_chat') != null)
        document.getElementById('offline_div_chat').style.display = 'block';
}

function hideOfflineWarning() {
    if (document.getElementById('offline_div') != null)
        document.getElementById('offline_div').style.display = 'none';

    if (document.getElementById('offline_div_chat') != null)
        document.getElementById('offline_div_chat').style.display = 'none';
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
 * called to generate a random room number
 * This is a simplification. A real world implementation would ask the server to generate a unique room number
 * so to make sure that the room number is not accidentally repeated across uses
 */
function generateRoom() {
    roomNo = Math.round(Math.random() * 10000);
    document.getElementById('roomNo').value = 'R' + roomNo;
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
 * called when the Send button is pressed. It gets the text to send from the interface
 * and sends the message via  socket
 */
function sendChatText() {
    let chatText = document.getElementById('chat_input').value;
    let imageUrl = document.getElementById('image_url').value;

    // @todo send the chat message
    chat.emit('chat', roomNo, name, chatText);
    // Store the values as a object
    let roomNumber_image = roomNo + '_' + imageUrl + '_' + name;
    let chatData = {roomNumber_image: roomNumber_image, name: name, chatText: chatText};
    sendAjaxQueryForChat("/chatRoute", chatData);

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

/**
 * used to connect to a room. It gets the user name and room number from the
 * interface
 */
function connectToRoom() {
    // Get the room number
    roomNo = document.getElementById('roomNo').value;
    name = document.getElementById('name').value;

    // Get the image url, image title, image author, image description
    let imageUrl = document.getElementById('image_url').value;
    let title = document.getElementById('title').value;
    let author = document.getElementById('author').value;
    let description = document.getElementById('description').value;

    // Store the values as a object
    const imageData = {imageUrl: imageUrl, author: author, title: title, description: description, userName:name, roomNo : roomNo};
    console.log(imageData);

    if (!name) name = 'Unknown-' + Math.random();
    sendAjaxInsertForImage("/img/uploadImg", imageData); //Image upload

    //@todo join the room

    hideLoginInterface(roomNo, name);
    chat.emit('create or join', roomNo, name);
    // pane.emit('create or join', roomNo, name);

    // initCanvas(pane, imageUrl, roomNo, name);
    initCanvas(chat, imageUrl, roomNo, name);
    checkFromIDB(roomNo, userId, imageUrl);

    // send the image to index DB database using ajax
    sendAjaxQueryForImage('/imageRoute', imageData);
}



function chatToRoom() {
    // Get the room number
    roomNo = document.getElementById('roomNo').value;
    name = document.getElementById('name').value;

    // Get the image url, image title, image author, image description
    let imageUrl = document.getElementById('image_url').value;
    let author = name;
    let title = roomNo + author;
    let description = roomNo + author + "image";

    // Store the values as a object
    const imageData = {imageUrl: imageUrl, author: author, title: title, description: description, userName:name, roomNo : roomNo};

    if (!name) name = 'Unknown-' + Math.random();
    sendAjaxInsertForImage("/img/uploadImg", imageData); //Image upload

    //@todo join the room

    hideLoginInterface(roomNo, name);
    chat.emit('create or join', roomNo, name);
    // pane.emit('create or join', roomNo, name);

    // initCanvas(pane, imageUrl, roomNo, name);
    initCanvas(chat, imageUrl, roomNo, name);
    checkFromIDB(roomNo, userId, imageUrl);

    // send the image to index DB database using ajax
    sendAjaxQueryForImage('/imageRoute', imageData);
}
//
function connectToRoomNew(userName, roomNumber, imageUrlParam, titleParam, authorParam, descriptionParam) {
    // Get the room number
    roomNo = roomNumber;
    name = userName;
    let imageUrl = imageUrlParam;
    // let title = titleParam;
    // let author = authorParam;
    // let description = descriptionParam;
    document.getElementById('image_url').value = imageUrl;

    // Store the values as a object
    const imageData = {imageUrl: imageUrlParam, author: authorParam, title: titleParam, description: descriptionParam, userName:name, roomNo : roomNo};

    if (!name) name = 'Unknown-' + Math.random();
    //@todo join the room

    hideLoginInterface(roomNo, name);
    chat.emit('create or join', roomNo, name);
    // pane.emit('create or join', roomNo, name);

    // initCanvas(pane, imageUrl, roomNo, name);
    initCanvas(chat, imageUrl, roomNo, name);
    checkFromIDB(roomNo, userId, imageUrl);

    // send the image to index DB database using ajax
    sendAjaxQueryForImage('/imageRoute', imageData);
}
//view the images list
function viewList() {

    let title = document.getElementById('title').value;
    let author = document.getElementById('author').value;
    let description = document.getElementById('description').value;
    let userName = document.getElementById("name").value;
    // Store the values as a object
    const imageData = {author: author, title: title, description: description, userName:userName};

    var tableHtml = sendAjaxListForImage("/img/queryImg", imageData);
    console.log(tableHtml);
    showViewList(tableHtml);

}

// Use ajax to send the image to index DB database

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
 * it hides the initial form and shows the chat
 * @param room the selected room
 * @param userId the user name
 */
function hideLoginInterface(room, userId) {
    document.getElementById('initial_form').style.display = 'none';
    document.getElementById('chat_interface').style.display = 'block';
    document.getElementById('chat_history').style.display = 'block';
    document.getElementById('chat_box').style.display = 'block';
    document.getElementById('image').style.display = 'block';
    document.getElementById('imageDiv').style.display = 'block';
    document.getElementById('who_you_are').innerHTML = userId;
    document.getElementById('in_room').innerHTML = ' ' + room;
}


/*
* Go to next image
* */
function openNext() {
    // Replace the original image url to the new image url
    let imageNew = document.getElementById('nextImage').value;
    let img = document.getElementById('image');
    let image = document.getElementById('image_url');
    image.value = imageNew;
    img.src = imageNew;

    // Get the title, author and description for new image
    let imageTitleNew = document.getElementById('nextImageTitle').value;
    let imageAuthorNew = document.getElementById('nextImageAuthor').value;
    let imageDescriptionNew = document.getElementById('nextImageDescription').value;


    socket.emit('create or join', room, name);

    // store the new image as a object to store it in the index db database
    let imageData = {
        imageUrl: imageNew,
        author: imageAuthorNew,
        title: imageTitleNew,
        description: imageDescriptionNew
    };
    cleaChatHistory();
    sendAjaxQueryForImage('/imageRoute', imageData);
    checkFromIDB(roomNo, userId, imageNew);
}

/*
* Clear the text message
*
* */
function cleaChatHistory() {
    console.log('check');
    let history = document.getElementById('history');
    // let paragraph = document.getElementsByTagName('p');
    let paragraph = document.querySelectorAll('#chat_history>p');
    let i = 0;
    for (i = 0; i < paragraph.length; i++) {
        console.log(paragraph[i]);
        removeElement(paragraph[i]);
    }
}

//Upload the inserted images
function sendAjaxInsertForImage(url, data) {
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
//Send images to list
function sendAjaxListForImage(url, data) {
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
            // storeImageData(dataR);
            console.log(dataR);
            console.log("Successful");
        },
        error: function (response) {
            // the error structure we passed is in the field responseText
            // it is a string, even if we returned as JSON
            // if you want o unpack it you must do:
            // const dataR= JSON.parse(response.responseText)
            console.log(response.responseText);
            // Store the image data object in the indexDB database, if offline
            // storeImageData(data);
            console.log("Fail");
            showViewList(response.responseText);
        }
    });
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
 * it hides the initial form and shows the chat
 * @param room the selected room
 * @param userId the user name
 */
function showViewList(tableHtml) {
    document.getElementById('initial_form').style.display = 'none';
    document.getElementById('chat_interface').style.display = 'none';
    document.getElementById('chat_history').style.display = 'none';
    document.getElementById('chat_box').style.display = 'none';
    document.getElementById('image').style.display = 'none';
    document.getElementById('imageDiv').style.display = 'none';
}







