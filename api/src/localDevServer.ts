/**
 * Lightweight standalone local-dev API server, used ONLY as a workaround for
 * Azure Functions Core Tools v4 not yet supporting newer Node.js runtimes
 * (see https://aka.ms/functions-node-versions). It reuses the exact same
 * handler functions that `func start` would invoke in Azure/production — no
 * business logic is duplicated — just a minimal HTTP shim in front of them.
 *
 * Run with: npm run dev:local-api (after `npm run build`)
 */
import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";
import type { HttpResponseInit } from "@azure/functions";
import { demoStatus } from "./functions/demoStatus";
import { scrapeBusinessSite } from "./functions/scrapeBusinessSite";
import { liveCallTurn } from "./functions/liveCallTurn";
import { activateBusiness } from "./functions/activateBusiness";
import { voiceInbound } from "./functions/voiceInbound";
import { voiceStatus } from "./functions/voiceStatus";
import { recentVoiceActivity } from "./functions/recentVoiceActivity";
import { voiceAudio } from "./functions/voiceAudio";

function loadLocalSettings(): void {
  const settingsPath = path.join(__dirname, "..", "..", "local.settings.json");
  if (!fs.existsSync(settingsPath)) return;
  try {
    const parsed = JSON.parse(fs.readFileSync(settingsPath, "utf-8")) as { Values?: Record<string, string> };
    for (const [key, value] of Object.entries(parsed.Values ?? {})) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    console.warn("Could not parse local.settings.json; continuing with existing environment variables.");
  }
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function makeContext() {
  return {
    error: (...args: unknown[]) => console.error("[api]", ...args),
    log: (...args: unknown[]) => console.log("[api]", ...args),
  } as unknown as Parameters<typeof demoStatus>[1];
}

function send(res: http.ServerResponse, result: HttpResponseInit): void {
  const status = result.status ?? 200;
  const headers = (result.headers as Record<string, string>) ?? { "Content-Type": "application/json" };
  res.writeHead(status, headers);
  if (result.jsonBody !== undefined) {
    res.end(JSON.stringify(result.jsonBody));
  } else if (Buffer.isBuffer(result.body)) {
    res.end(result.body);
  } else {
    res.end(typeof result.body === "string" ? result.body : "");
  }
}

async function main() {
  loadLocalSettings();
  const port = Number(process.env.PORT) || 7071;

  const server = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url ?? "/", `http://localhost:${port}`);
    const bodyText = req.method === "POST" ? await readBody(req) : "";
    const mockRequest = {
      url: url.toString(),
      json: async () => (bodyText ? JSON.parse(bodyText) : {}),
      formData: async () => new URLSearchParams(bodyText),
      query: url.searchParams,
      headers: {
        get: (name: string) => {
          const value = req.headers[name.toLowerCase()];
          return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
        },
      },
    } as unknown as Parameters<typeof demoStatus>[0];

    try {
      if (url.pathname === "/api/demo-status" && req.method === "GET") {
        send(res, await demoStatus(mockRequest, makeContext()));
        return;
      }
      if (url.pathname === "/api/scrape-business-site" && req.method === "POST") {
        send(res, await scrapeBusinessSite(mockRequest, makeContext()));
        return;
      }
      if (url.pathname === "/api/live-call-turn" && req.method === "POST") {
        send(res, await liveCallTurn(mockRequest, makeContext()));
        return;
      }
      if (url.pathname === "/api/activate-business" && req.method === "POST") {
        send(res, await activateBusiness(mockRequest, makeContext()));
        return;
      }
      if (url.pathname === "/api/voice-inbound" && req.method === "POST") {
        send(res, await voiceInbound(mockRequest, makeContext()));
        return;
      }
      if (url.pathname === "/api/voice-status" && req.method === "POST") {
        send(res, await voiceStatus(mockRequest, makeContext()));
        return;
      }
      if (url.pathname === "/api/recent-voice-activity" && req.method === "GET") {
        send(res, await recentVoiceActivity(mockRequest, makeContext()));
        return;
      }
      if (url.pathname === "/api/voice-audio" && req.method === "GET") {
        send(res, await voiceAudio(mockRequest, makeContext()));
        return;
      }
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    } catch (err) {
      console.error("[api] Unhandled error", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal error" }));
    }
  });

  server.listen(port, () => {
    console.log(`Local dev API server listening on http://localhost:${port}`);
  });
}

main();
