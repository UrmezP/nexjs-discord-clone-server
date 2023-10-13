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
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// array of users
const allUsers = [];

function addNewUser(userObj) {
  allUsers.push(userObj);
  console.log(allUsers);
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
    addNewUser(userObj);
    res.status(201).json({ message: "New user created!" });
  } else {
    console.error("username taken");
    res.status(401).json({ message: "User already exists" });
  }
});

io.on("connection", (socket) => {
  console.log("a user connected with id " + socket.id);

  // manage click event
  socket.on("globalchatsubmithandler", (msg) => {
    console.log(
      "User " +
        msg.userId +
        " sent message " +
        msg.message.text +
        " from socket : " +
        msg.message.socketId
    );

    io.emit("globalchatappend", msg);
  });

  socket.on("disconnect", (msg) => {
    console.log("Disconnedted : message: " + msg);
  });
});

server.listen(process.env.PORT || 3001, () => {
  console.log("server running at http://localhost:3001");
});
