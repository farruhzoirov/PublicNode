#!/usr/bin/env node

import WebSocket from "ws";
import http from "http";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

// CLI argumentlarini olish
const argv = yargs(hideBin(process.argv))
  .option("port", {
    alias: "p",
    type: "number",
    description: "Mahalliy serverning porti",
    demandOption: true,
  })
  .option("host", {
    alias: "h",
    type: "string",
    default: "ws://159.89.86.13:8080",
    description: "Tunnel server manzili",
  })
  .option("id", {
    alias: "i",
    type: "string",
    default: "mytunnel",
    description: "Tunnel ID (unikal bo‘lishi kerak)",
  })
  .help().argv;

// CLI argumentlarini olish
const LOCAL_PORT = argv.port;
const TUNNEL_SERVER = argv.host;
const CLIENT_ID = argv.id;

console.log(
  `🔗 Tunnel ochilmoqda: ${TUNNEL_SERVER}/${CLIENT_ID} → localhost:${LOCAL_PORT}`
);

const ws = new WebSocket(`${TUNNEL_SERVER}/${CLIENT_ID}`);

ws.on("open", () =>
  console.log(
    `✅ Tunnel ochildi! --> http://${TUNNEL_SERVER.split("//")[1]}/${CLIENT_ID}`
  )
);
ws.on("close", () => console.log("❌ Tunnel yopildi"));
ws.on("error", (err) => console.error("⚠️ Xatolik:", err));

ws.on("message", (data) => {
  const reqData = JSON.parse(data);
  console.log(`🌍 So‘rov: ${reqData.method} /${reqData.path}`);

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
