import express from "express";
import configureSockets from "./sockets";

// ws is used due to its advantages over socket.io, including size, performance, and scalability
// In production, keep your websocket server separate from a complete API implementation
import { WebSocketServer, WebSocket } from "ws";

const app = express();
const port = 4000;

configureSockets(
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  })
);
