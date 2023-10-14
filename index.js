import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";

import bodyParser from "body-parser";

const app = express();

// handle cors from client side
app.use(cors());

// create application/json parser
app.use(bodyParser.json());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// array of users
var allUsers = [];

// array of rooms
const allRooms = [];

function addUser(userObj) {
  allUsers.push(userObj);
}
function removeUser(user) {
  allUsers = allUsers.filter((us) => {
    if (us.username != user) {
      return true;
    }
    return false;
  });
}
function checkUserExists(userObj) {
  const result = allUsers.findIndex((user) => {
    if (user.username.toLowerCase() == userObj.username.toLowerCase()) {
      return true;
    }
    return false;
  });
  return result > -1 ? true : false;
}

// api methods from here ********************************************

app.post("/checkUserExists", (req, res) => {
  const userObj = req.body;
  const exists = checkUserExists(userObj);

  if (!exists) {
    addUser(userObj);
    res.status(201).json({ message: "New user created!" });
  } else {
    res.status(401).json({ message: "User already in GlobalChat room!" });
  }
});

// ******************************************************************

io.on("connection", (socket) => {
  console.log("a user connected with id " + socket.id);

  // on every new connection update the allUserslist
  socket.on("fireAllUsersUpdated", () => {
    io.emit("allUsersUpdated", allUsers);
  });

  // handle send for globalchat
  socket.on("globalchatsubmithandler", (msg) => {
    console.log("User: " + msg.userId + " sent: " + msg.message.text);
    io.emit("globalchatappend", msg);
  });

  // handle logout of user
  socket.on("logoutuser", (data) => {
    const userData = JSON.parse(data);
    removeUser(userData.username);
    console.log(`${userData.username} logged out`);
    io.emit("allUsersUpdated", allUsers);
  });

  socket.on("disconnect", (msg) => {
    console.log("Disconnedted : message: " + msg);
  });
});

server.listen(process.env.PORT || 3001, () => {
  console.log("server running!");
});
