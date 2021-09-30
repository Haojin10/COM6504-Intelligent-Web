var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Image Browsing' });
});
/**
 *  POST the data about the image.
 *  parameters in body:
 *    image: a image url
 *    author: a author name for image
 *    title: a title for image
 *    description: a description for image
 */
router.post('/imageRoute', function (req, res, next) {
  // get random weather for a location
  let imageData = req.body;
  console.log(imageData);
  //Check if the request data is empty
  if (imageData == null) {
    res.setHeader('Content-Type', 'application/json');
    res.status(403).json({error: 403, reason: 'The image data is null!'});
  } else {
    // send the data back
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(imageData));
  }
});


/**
 *  POST the data about the chat.
 *  parameters in body:
 *  roomNumber_image: roomNumber_image, name: name, chatText: chatText
 *    roomNumber_image: index for retrieve chat from index DB, example: hi, nice to meet you_image url
 *    name: the user id
 *    chatText: chat text
 */
router.post('/chatRoute', function (req, res, next) {
  // get random weather for a location
  let chatData = req.body;
  console.log(chatData);
  //Check if the request data is empty
  if (chatData == null) {
    res.setHeader('Content-Type', 'application/json');
    res.status(403).json({error: 403, reason: 'The chat data is null!'});
  } else {
    // send the data back
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(chatData));
  }
});

module.exports = router;
