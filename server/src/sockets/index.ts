import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";

const HEARTBEAT_INTERVAL = 1000 * 5; // 5 seconds
const HEARTBEAT_VALUE = 1;

function onSockerPreError(error: Error) {
  console.error(`WebSocket server error: ${error}`);
}

function onSocketPostError(error: Error) {
  console.error(`WebSocket server error: ${error}`);
}

function ping(ws: WebSocket) {
  ws.send(HEARTBEAT_VALUE, { binary: true });
}

export default function configure(s: Server) {
  // Decouples the server from the HTTP server, typically in production, allows for manual control of the WebSocket server
  const wss = new WebSocketServer({ noServer: true });

  // generally, when you deploy a server instance, you'll likely scale to multiple instances, this is a problem because websockets work on a single instance
  // users connected to different servers cannot communicate with each other via websocket, so you will need a pub/sub layer to handle cross-server communication

  // upgrade event is emitted by the HTTP server when a client requests an upgrade to the WebSocket protocol
  s.on("upgrade", (request, socket, head) => {
    // http server handling
    socket.on("error", onSockerPreError);
    // perform any type of auth, on desktop, use cookies, on mobile, use JWT from req

    if (!!request.headers["BadAuth"]) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      socket.removeListener("error", onSockerPreError);
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws: WebSocket, request) => {
    ws.isAlive = true;

    //websocket server handling
    ws.on("error", onSocketPostError);

    ws.on("message", (message, isBinary) => {
      if (isBinary && (message as any)[0] === HEARTBEAT_VALUE) {
        console.log("pong");
        ws.isAlive = true;
      } else {
        // websockets all come down to one big for loop which is kinda ironic
        wss.clients.forEach((client) => {
          // to exclude the original sender, add "ws !== client" in the if statement
          if (client.readyState === WebSocket.OPEN) {
            client.send(message, { binary: isBinary });
          }
        });
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });

  const interval = setInterval(() => {
    console.log("firing");
    wss.clients.forEach((client) => {
      if (!(client as WebSocket).isAlive) {
        client.terminate();
        return;
      }

      (client as WebSocket).isAlive = false;
      ping(client as WebSocket);
    });
  }, HEARTBEAT_INTERVAL);

  wss.on("close", () => {
    clearInterval(interval);
  });

  // beware of stale connections, you can use a heartbeat mechanism to detect stale connections
  // the implementation of a websocket server is easy but it's the architecture around its scalability that's hard
}
