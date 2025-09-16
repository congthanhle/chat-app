const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("a user connected:", socket.id);

  socket.on("message", (data) => {
    console.log("message received:", data);
    io.emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
  });
});

server.listen(4000, () => {
  console.log("🚀 Server is running on http://localhost:4000");
});
