"use client";

import React, { useRef, useState } from "react";
const TIME_BUFFER = 1000 * 1;
const HEARTBEAT_TIMEOUT = 1000 * 5 + TIME_BUFFER;
const HEARTBEAT_VALUE = 1;

export default function Home() {
  const wsRef = useRef<WebSocketExt | null>(null);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<string[]>([]);

  const addMessage = (message: string) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const closeConnection = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const heartbeat = () => {
    if (!wsRef.current) {
      return;
    } else if (!!wsRef.current.pingTimeout) {
      clearTimeout(wsRef.current.pingTimeout);
    }

    wsRef.current.pingTimeout = setTimeout(() => {
      wsRef.current?.close();

      // business logic to deciding whether to reconnect or not
    }, HEARTBEAT_TIMEOUT);

    const data = new Uint8Array(1);
    data[0] = HEARTBEAT_VALUE;

    wsRef.current.send(data);
  };

  const isBinary = (data: any) => {
    return (
      typeof data === "object" &&
      Object.prototype.toString.call(data) === "[object Blob]"
    );
  };

  const openWebSocket = () => {
    closeConnection();
    const socket = new WebSocket("ws://localhost:4000") as WebSocketExt;
    socket.onopen = () => {
      addMessage("WebSocket connection opened");
    };
    socket.onclose = () => {
      addMessage("WebSocket connection closed");
      if (!!socket.pingTimeout) {
        clearTimeout(socket.pingTimeout);
      }
    };
    socket.onerror = (error) => {
      addMessage(`WebSocket error: ${error}`);
    };
    socket.onmessage = (event) => {
      if (isBinary(event.data)) {
        heartbeat();
      } else {
        addMessage(event.data);
      }
    };
    wsRef.current = socket;
  };

  const closeWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const sendMessage = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
      setMessage("");
    }
  };

  return (
    <div>
      <button onClick={openWebSocket}>Open WebSocket</button>
      <button onClick={closeWebSocket}>Close WebSocket</button>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message"
      />
      <button onClick={sendMessage}>Send Message</button>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}
