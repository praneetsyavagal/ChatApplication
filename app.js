//require the express module
const express = require("express");
const app = express();
const dateTime = require("simple-datetime-formater");
const bodyParser = require("body-parser");
const chatRouter = require("./route/chatroute");
//const loginRouter = require("./route/loginRoute");

//require the http module
const http = require("http").Server(app);

// require the socket.io module
const io = require("socket.io");

const port = 5000;

//bodyparser middleware
app.use(bodyParser.json());

//routes
app.use("/chats", chatRouter);
//app.use("/login", loginRouter);

function xorEncode(txt, pass) { 
    var ord = []
    var buf = ""
    pass = pass.toString();
    txt = txt.toString();
    for (z = 1; z <= 255; z++) {ord[String.fromCharCode(z)] = z}
 
    for (j = z = 0; z < txt.length; z++) {
        buf += String.fromCharCode(ord[txt.substr(z, 1)] ^ ord[pass.substr(j, 1)])
        j = (j < pass.length) ? j + 1 : 0
    }
    return buf
}

//set the express.static middleware
app.use(express.static(__dirname + "/public"));

//integrating socketio
socket = io(http);

//database connection
const Chat = require("./models/Chat");
const connect = require("./dbconnect");

//setup event listener
var all_users = new Set();
var user_key = {};

var prime = 23;
var generator = 9;
var private_key = 3;
var public_key = (Math.pow(generator,private_key))%prime;

socket.on("connection", socket => { 
  socket.on('username', function(username) {
      socket.username = username.user;
      foriegn_key = username.key;
      shared_key = (Math.pow(foriegn_key,private_key))%prime;
      user_key[username.user] = shared_key;
      all_users.add(username);
      socket.emit('key',public_key);
      socket.broadcast.emit('is_online', '🔵' + socket.username + ' joined the chat..');
      console.log("aaaa "+shared_key);
  });

  socket.on("disconnect", function() {
    all_users.delete(socket.username);
    delete user_key[socket.username];
    socket.broadcast.emit('is_online', '🔴' + socket.username + ' left the chat..');
    console.log("user disconnected");
  });

  //Someone is typing
  socket.on("typing", data => {
    socket.broadcast.emit("notifyTyping", {
      user: data.user,
      message: data.message
    });
  });

  //when soemone stops typing
  socket.on("stopTyping", () => {
    socket.broadcast.emit("notifyStopTyping");
  });

  socket.on("chat message", function(msg) {
    console.log("message: " + msg);

    //broadcast message to everyone in port:5000 except yourself.
    socket.broadcast.emit("received", msg);

    mesg = xorEncode(msg.msg,user_key[msg.user]);

    //save chat to the database
    connect.then(db => {
      console.log("connected correctly to the server");
      let chatMessage = new Chat({ message: mesg, sender: msg.user});
      chatMessage.save();
    });
  });
});

http.listen(port, () => {
  console.log("Running on Port: " + port);
});
