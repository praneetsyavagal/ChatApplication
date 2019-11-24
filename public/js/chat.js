var socket = io();
var messages = document.getElementById("messages");

var username = prompt('Please tell me your name');

var prime = 23;
var generator = 9;
var private_key = 4;
var public_key = (Math.pow(generator,private_key))%prime;
var shared_key = null;

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

socket.emit('username', {user:username,key:public_key});

socket.on("key",data => {
  if(shared_key == null){
    console.log(data);
    shared_key = (Math.pow(data,private_key))%prime;
    console.log("bingo! " + shared_key);
  }
});

(function() {
  $("form").submit(function(e) {
    let li = document.createElement("li");
    e.preventDefault(); // prevents page reloading
    mesg = $("#message").val();
    console.log(mesg);
    mg = xorEncode(mesg,shared_key);
    console.log(mg);
    socket.emit("chat message", {msg:mg,user:username});
    messages.appendChild(li).append($("#message").val());
    let span = document.createElement("span");
    messages.appendChild(span).append("by " + username + ": " + "just now");
    $("#message").val("");
    return false;
  });

  
  socket.on("is_online", data => {
    let li = document.createElement("li");
    let span = document.createElement("span");
    var messages = document.getElementById("messages");
    console.log(data)
    messages.appendChild(li).append(data);
    console.log("bingo!");
  });

  socket.on("received", data => {
    let li = document.createElement("li");
    let span = document.createElement("span");
    var messages = document.getElementById("messages");
    console.log(data)
    mesg = xorEncode(data.msg,shared_key);
    messages.appendChild(li).append(mesg);
    messages.appendChild(span).append("by " + data.user + ": " + "just now");
    console.log("Hello bingo!");
    console.log(data.mesg);
  });
})();

// fetching initial chat messages from the database
(function() {
  fetch("/chats")
    .then(data => {
      return data.json();
    })
    .then(json => {
      json.map(data => {
        let li = document.createElement("li");
        let span = document.createElement("span");
        messages.appendChild(li).append(data.message);
        messages
          .appendChild(span)
          .append("by " + data.sender + ": " + formatTimeAgo(data.createdAt));
      });
    });
})();

//is typing...

let messageInput = document.getElementById("message");
let typing = document.getElementById("typing");

//isTyping event
messageInput.addEventListener("keypress", () => {
  socket.emit("typing", { user: username, message: "is typing..." });
});

socket.on("notifyTyping", data => {
  typing.innerText = data.user + " " + data.message;
  console.log(data.user + data.message);
});

//stop typing
messageInput.addEventListener("keyup", () => {
  socket.emit("stopTyping", "");
});

socket.on("notifyStopTyping", () => {
  typing.innerText = "";
});
