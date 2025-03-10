import WebSocket from "ws";
import http from "http";

const TUNNEL_SERVER = "ws://localhost:8080";
const LOCAL_PORT = 3000;
const CLIENT_ID = "mytunnel";

const ws = new WebSocket(`${TUNNEL_SERVER}/${CLIENT_ID}`);

ws.on("open", () => {
  console.log("Tunnel opened!");
});

ws.on("message", (data) => {
  const reqData = JSON.parse(data);
  console.log("Request received:", reqData);

  const options = {
    hostname: "localhost",
    port: LOCAL_PORT,
    path: "/" + reqData.path,
    method: reqData.method,
    headers: reqData.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    let responseBody = "";

    proxyRes.on("data", (chunk) => {
      responseBody += chunk;
    });

    proxyRes.on("end", () => {
      ws.send(
        JSON.stringify({ status: proxyRes.statusCode, body: responseBody })
      );
    });
  });

  proxyReq.on("error", () => {
    ws.send(JSON.stringify({ status: 500, body: "Proxy error" }));
  });

  if (reqData.body) {
    proxyReq.write(reqData.body);
  }

  proxyReq.end();
});

ws.on("close", () => {
  console.log("Tunnel closed");
});
