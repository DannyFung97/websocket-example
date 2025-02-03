import express from "express";
import configureSockets from "./sockets";
import http from "http";
import dotenv from "dotenv";
import configureRoutes from "./routers";
import cors from "cors";

dotenv.config();

const app = express();
const port = 4000;

// Enable CORS for all routes
app.use(cors());

// Create an HTTP server
const server = http.createServer(app);

configureRoutes(app);

// Configure WebSocket server
configureSockets(server);

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
