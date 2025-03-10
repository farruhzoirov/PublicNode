import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const clients = {};

wss.on("connection", (ws, req) => {
  const clientId = req.url.split("/").pop();

  if (!clientId) {
    ws.close();
  }

  clients[clientId] = ws;
  console.log(`Client connected ${clientId}`);

  ws.on("close", () => {
    delete clients[clientId];
    console.log(`Client disconnected ${clientId}`);
  });
});

app.get("/:clientId/*", async (req, res) => {
  const client = clients[req.params.clientId];
  if (!client) return res.status(404).send("Client not found");

  client.send(
    JSON.stringify({
      method: req.method,
      path: req.params[0], // Foydalanuvchi yo'nalishi
      headers: req.headers,
      body: req.body || null,
    })
  );

  client.once("message", (message) => {
    const response = JSON.parse(message);
    res.status(response.status || 200).send(response.body);
  });
});

server.listen(8080, () =>
  console.log("Tunnel server is running on  port 8080")
);
