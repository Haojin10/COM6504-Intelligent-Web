let db;
// Define the database name for un
const APPLICATION_DB_NAME = 'db_application';
const CHAT_STORE_NAME = 'store_chat';
const IMAGE_STORE_NAME = 'store_image';
const ANNOTATIONS_STORE_NAME = 'store_annotations';

/*
* Init the database
* Create 3 object store;
* CHAT_STORE_NAME: Object store for chat
* IMAGE_STORE_NAME: Object store for image
* ANNOTATIONS_STORE_NAME: Object store for annotation
* */
async function initDatabase() {
    if (!db) {
        // Create the data base with database name, version, upgradeCallback
        db = await idb.openDB(APPLICATION_DB_NAME, 2, {
            upgrade(upgradeDb, oldVersion, newVersion) {
                // If the database does not contain this image data store
                if (!upgradeDb.objectStoreNames.contains(IMAGE_STORE_NAME)) {
                    console.log("Create image object store successfully!");
                    // Creat one if it is not created, defined the key path and auto increment.
                    let applicationDB = upgradeDb.createObjectStore(IMAGE_STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    // Create the index, which is author name + image url, for retrieve
                    applicationDB.createIndex('imageUrl', 'imageUrl', {unique: false, multiEntry: true});
                }

                // If the database does not contain this chat data store
                if (!upgradeDb.objectStoreNames.contains(CHAT_STORE_NAME)) {
                    console.log("Create image object store successfully!");
                    // Creat one if it is not created, defined the key path and auto increment.
                    let applicationDB = upgradeDb.createObjectStore(CHAT_STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    // Create the index, which is room number, for retrieve
                    applicationDB.createIndex('roomNumber_image', 'roomNumber_image', {
                        unique: false,
                        multiEntry: true
                    });
                }

                // If the database does not contain this chat data store
                if (!upgradeDb.objectStoreNames.contains(ANNOTATIONS_STORE_NAME)) {
                    console.log("Create image object store successfully!");
                    // Creat one if it is not created, defined the key path and auto increment.
                    let applicationDB = upgradeDb.createObjectStore(ANNOTATIONS_STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    // Create the index, which is author name+url+room number, for retrieve
                    applicationDB.createIndex('userId_url_roomNumber', 'userId_url_roomNumber', {
                        unique: false,
                        multiEntry: true
                    });
                }
            }
        });
        console.log('db created');
    }
}

window.initDatabase = initDatabase;

/*
* Store the image data to index db
*
* */
async function storeImageData(imageObject) {
    console.log('inserting: ' + JSON.stringify(imageObject));
    if (!db)
        await initDatabase();
    if (db) {
        try {
            // Define the transaction, the mode is read and write
            let tx = await db.transaction(IMAGE_STORE_NAME, 'readwrite');
            // Perform operation on object store
            let store = await tx.objectStore(IMAGE_STORE_NAME);
            // Put the image object into object store
            await store.put(imageObject);
            // Finish the transaction
            await tx.complete;
            // console.log('added item to the store! ' + JSON.stringify(chatObject));
        } catch (error) {
            console.log('error: I could not store the element. Reason: ' + error);
        }

    }
    // else localStorage.setItem(imageObject.sum, JSON.stringify(chatObject));
    else {
        console.log('error: I could not store the element. Reason: ' + error);
    }

}

window.storeImageData = storeImageData;


/*
* Store the chat data to index db database
*
* */
async function storeChatData(chatObject) {
    console.log('inserting: ' + JSON.stringify(chatObject));
    if (!db)
        await initDatabase();
    if (db) {
        try {
            // Define the transaction, the mode is read and write
            let tx = await db.transaction(CHAT_STORE_NAME, 'readwrite');
            // Perform operation on object store
            let store = await tx.objectStore(CHAT_STORE_NAME);
            // Put the chat object into object store
            await store.put(chatObject);
            // Finish the transaction
            await tx.complete;
            // console.log('added item to the store! ' + JSON.stringify(chatObject));
        } catch (error) {
            console.log('error: I could not store the element. Reason: ' + error);
        }

    } else {
        console.log('error: I could not store the element. Reason: ' + error);
    }
}

window.storeChatData = storeChatData;


/*
* Store the annotation data to database
* */
async function storeAnnotationData(annotationObject) {
    // console.log(annotationObject);
    // console.log('inserting: ' + JSON.stringify(annotationObject));
    if (!db)
        await initDatabase();
    if (db) {
        try {
            // Define the transaction, the mode is read and write
            let tx = await db.transaction(ANNOTATIONS_STORE_NAME, 'readwrite');
            // Perform operation on object store
            let store = await tx.objectStore(ANNOTATIONS_STORE_NAME);
            // Put the annotation object into object store
            await store.put(annotationObject);
            // Finish the transaction
            await tx.complete;
            // console.log('added item to the store! ' + JSON.stringify(chatObject));
        } catch (error) {
            console.log('error: I could not store the element. Reason: ' + error);
        }

    } else {
        console.log('error: I could not store the element. Reason: ' + error);
    }
}

window.storeAnnotationData = storeAnnotationData;

/*
* Check if the image is in indexDB
*
* */
async function getImage(imageURL) {
    if (!db)
        await initDatabase();
    if (db) {
        try {
            console.log('fetching: ' + imageURL);
            // Create transaction
            let tx = await db.transaction(IMAGE_STORE_NAME, 'readonly');
            // Get object store
            let store = await tx.objectStore(IMAGE_STORE_NAME);
            // Get index
            let index = await store.index('imageUrl');
            // Get a list of all the items in theDB satisfying a specific condition
            let readingsList = await index.getAll(IDBKeyRange.only(imageURL));
            // transaction complete
            await tx.complete;
            // If the result list greater than 0
            if (readingsList && readingsList.length > 0) {
                return readingsList;
            } else {
                console.log("not in IDB")
            }
        } catch (error) {
            console.log('I could not retrieve the items because: ' + error);
        }
    } else {
        console.log('I could not retrieve the items because: ' + error);
    }
}

window.getImage = getImage;


/*
* Get the annotation from indexDB
* para:
* userId_url_roomNumber: the index for retrieve the annotation, the form is: userId_url_roomNumber,
* for example:
* Yuhao_https://helpx.adobe.com/content/dam/help/en/photoshop/using/convert-color-image-black-white/jcr_content/main-pars/before_and_after/image-before/Landscape-Color.jpg_R9141
* */
async function getAnnotation(userId_url_roomNumber) {
    if (!db)
        await initDatabase();
    if (db) {
        try {
            console.log('fetching: ' + userId_url_roomNumber);
            // Create transaction
            let tx = await db.transaction(ANNOTATIONS_STORE_NAME, 'readonly');
            // Get object store
            let store = await tx.objectStore(ANNOTATIONS_STORE_NAME);
            // Get index
            let index = await store.index('userId_url_roomNumber');
            // Get a list of all the items in theDB satisfying a specific condition
            let readingsList = await index.getAll(IDBKeyRange.only(userId_url_roomNumber));
            // transaction complete
            await tx.complete;
            // If the result list greater than 0
            if (readingsList && readingsList.length > 0) {
                return readingsList;
            } else {
                console.log("not in IDB")
            }
        } catch (error) {
            console.log('I could not retrieve the items because: ' + error);
        }
    } else {
        console.log('I could not retrieve the items because: ' + error);
    }
}

window.getAnnotation = getAnnotation;

/*
* Get the chat message from indexDB
* para:
* roomNumber_image: the index for retrieve the chat, the form is: roomNumber_image,
* for example:
* R9141_https://comicvine1.cbsistatic.com/uploads/original/8/82727/1525513-the_moutain____by_vincentfavre.jpg
* */
async function getChat(roomNumber_image) {
    if (!db)
        await initDatabase();
    if (db) {
        try {
            console.log('fetching: ' + roomNumber_image);
            // Create transaction
            let tx = await db.transaction(CHAT_STORE_NAME, 'readonly');
            // Get object store
            let store = await tx.objectStore(CHAT_STORE_NAME);
            // Get index
            let index = await store.index('roomNumber_image');
            // Get a list of all the items in theDB satisfying a specific condition
            let readingsList = await index.getAll(IDBKeyRange.only(roomNumber_image));
            // transaction complete
            await tx.complete;
            // If the result list greater than 0, return the result
            if (readingsList && readingsList.length > 0) {
                return readingsList;
            } else {
                console.log("not in IDB")
            }
        } catch (error) {
            console.log('I could not retrieve the items because: ' + error);
        }
    } else {
        console.log('I could not retrieve the items because: ' + error);
    }
}

window.getChat = getChat;

/*
* Check if the image is same as the previous image, if it is same, load the chat message
* paras:
* roomNo: room number
* userId: the id of user
* imageURL: the url of image
* */

async function checkFromIDB(roomNo, userId, imageURL) {
    let imageList = await getImage(imageURL);
    // If the image is not found
    if (imageList === undefined || imageList == null) {
        console.log('The image is not in index DB');
    } else {
        //If find the the image, update the chat history
        let roomNumber_image = roomNo + '_' + imageURL;
        await updateChat(roomNumber_image, userId);
    }
}

window.checkFromIDB = checkFromIDB;

/*
* Update the annotation from history that store in the index DB
* paras:
* ctx: ctx for canvas
* userId_url_roomNumber: index of index db
* */
async function updateAnnotation(ctx, userId_url_roomNumber) {
    // get the annotation list
    let annotationList = await getAnnotation(userId_url_roomNumber);
    //if cannot find the annotation that link to this image
    if (annotationList === undefined || annotationList == null) {
        console.log('The annotation is not in index DB:' + userId_url_roomNumber);
    } else {
        // if find the annotation that link to this image, draw the annotation on canvas
        for (let annotation of annotationList) {
            drawOnCanvas(ctx, annotation.canvas_width, annotation.canvas_height, annotation.prevX, annotation.prevY, annotation.currX, annotation.currY, annotation.color, annotation.thickness);
        }
    }
}

window.updateAnnotation = updateAnnotation;

/*
* Update the annotation from history that store in the index DB
* paras:
* roomNumber_image: index od index db
* userId: id of user
* */
async function updateChat(roomNumber_image, userId) {
    // get the chat message that link to this room and image from index DB
    let chatList = await getChat(roomNumber_image);
    // if cannot find the chat
    if (chatList === undefined || chatList == null) {
        console.log('The chat that associate to this image and room is not in index DB');
    } else {
        // if find the chat history, update it to the page
        let userName = '';
        for (let chat of chatList) {
            if (chat.name === userId) {
                userName = 'Me'
            } else {
                userName = chat.name;
            }
            let chatMessage = '<b>' + userName + ':</b> ' + chat.chatText;
            writeOnChatHistory(chatMessage);
        }
    }
}

window.updateChat = updateChat;


/*
* delete the annotation data
* */
async function deleteAnnotation(userId_url_roomNumber) {
    if (!db)
        await initDatabase();
    if (db) {
        try {
            console.log('Deleting: ' + userId_url_roomNumber);
            // Create transaction
            let tx = await db.transaction(ANNOTATIONS_STORE_NAME, 'readwrite');
            // Get object store
            let store = await tx.objectStore(ANNOTATIONS_STORE_NAME);
            await store.delete(userId_url_roomNumber);
            // transaction complete
            await tx.complete;
        } catch (error) {
            console.log('I could not delete the items because: ' + error);
        }
    } else {
        console.log('I could not delete the items because: ' + error);
    }
}
window.deleteAnnotation = deleteAnnotation;

// /*
// * delete the annotation data
// * */
// async function deleteImage(imgeurl) {
//     if (!db)
//         await initDatabase();
//     if (db) {
//         try {
//             console.log('Deleting: ' + imgeurl);
//             // Create transaction
//             let tx = await db.transaction(IMAGE_STORE_NAME, 'readwrite');
//             // Get object store
//             let store = await tx.objectStore(IMAGE_STORE_NAME);
//             await store.delete('https://comicvine1.cbsistatic.com/uploads/original/8/82727/1525513-the_moutain____by_vincentfavre.jpg');
//             // transaction complete
//             await tx.complete;
//         } catch (error) {
//             console.log('I could not delete the items because: ' + error);
//         }
//     } else {
//         console.log('I could not delete the items because: ' + error);
//     }
// }
// window.deleteImage = deleteImage;
