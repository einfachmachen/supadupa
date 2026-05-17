/**
 * Dual-Server für MyBudgetTracker
 *
 * Port 3000: alte App (statische index-OLD.html aus ./old)
 * Port 3001: neue modulare App aus ./new
 *
 * Flags:
 *   --dev   (default) Vite-Dev-Server mit Hot-Reload für die neue App
 *   --prod  servieren des vorab gebauten ./new/dist (vorher: cd new && npm run build)
 *
 * Beispiele:
 *   node server.js              # alt + neu (dev) parallel
 *   node server.js --prod       # alt + neu (production-build) parallel
 *   node server.js --only=old   # nur Port 3000
 *   node server.js --only=new   # nur Port 3001
 *   node server.js --port-old=4000 --port-new=4001
 */

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── CLI-Flags parsen ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const has = (name) => args.includes(`--${name}`);
const val = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : fallback;
};

const MODE = has("prod") ? "prod" : "dev";
const ONLY = val("only", null); // null | "old" | "new"
const PORT_OLD = parseInt(val("port-old", "3000"), 10);
const PORT_NEW = parseInt(val("port-new", "3001"), 10);

const OLD_DIR = path.join(__dirname, "old");
const NEW_DIR = path.join(__dirname, "new");

// ── Helper: MIME-Types setzen ────────────────────────────────────────────────
const mimeHeaders = (res, p) => {
  if (p.endsWith(".js") || p.endsWith(".mjs")) {
    res.set("Content-Type", "application/javascript; charset=utf-8");
  } else if (p.endsWith(".html")) {
    res.set("Content-Type", "text/html; charset=utf-8");
  } else if (p.endsWith(".css")) {
    res.set("Content-Type", "text/css; charset=utf-8");
  } else if (p.endsWith(".json") || p.endsWith(".webmanifest")) {
    res.set("Content-Type", "application/json; charset=utf-8");
  }
};

// ── Port 3000: alte App ──────────────────────────────────────────────────────
async function startOld() {
  if (!fs.existsSync(path.join(OLD_DIR, "index-OLD.html"))) {
    console.warn(`⚠  ${OLD_DIR}/index-OLD.html nicht gefunden — Port ${PORT_OLD} wird übersprungen`);
    return;
  }
  const app = express();
  app.use(express.static(OLD_DIR, { setHeaders: mimeHeaders }));
  app.get("/", (_req, res) => res.sendFile(path.join(OLD_DIR, "index-OLD.html")));

  return new Promise((resolve) => {
    app.listen(PORT_OLD, "0.0.0.0", () => {
      console.log(`🔵 Alt:  http://localhost:${PORT_OLD}`);
      resolve();
    });
  });
}

// ── Port 3001: neue App (dev oder prod) ──────────────────────────────────────
async function startNewDev() {
  // Vite programmatisch starten
  const { createServer } = await import("vite");
  const vite = await createServer({
    root: NEW_DIR,
    server: { port: PORT_NEW, host: true, strictPort: true },
    configFile: path.join(NEW_DIR, "vite.config.js"),
  });
  await vite.listen();
  console.log(`🟢 Neu (dev):  http://localhost:${PORT_NEW}  (Hot-Reload aktiv)`);
}

async function startNewProd() {
  const distDir = path.join(NEW_DIR, "dist");
  if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, "index.html"))) {
    console.error(
      `\n❌ ${distDir} nicht gefunden.\n` +
      `   Erst bauen:    cd new && npm install && npm run build\n` +
      `   Oder dev-Modus: node server.js  (ohne --prod)\n`
    );
    return;
  }
  const app = express();
  app.use(express.static(distDir, { setHeaders: mimeHeaders }));
  // SPA-Fallback: alle nicht-Asset-Pfade → index.html
  app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));

  return new Promise((resolve) => {
    app.listen(PORT_NEW, "0.0.0.0", () => {
      console.log(`🟢 Neu (prod): http://localhost:${PORT_NEW}  (dist/)`);
      resolve();
    });
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
console.log(`\nMyBudgetTracker Dual-Server`);
console.log(`Modus: ${MODE === "prod" ? "production (dist/)" : "development (Vite Hot-Reload)"}`);
if (ONLY) console.log(`Nur: ${ONLY}`);
console.log();

const tasks = [];
if (ONLY !== "new") tasks.push(startOld());
if (ONLY !== "old") {
  tasks.push(MODE === "prod" ? startNewProd() : startNewDev());
}

await Promise.all(tasks);
console.log(`\n✅ Bereit. Strg+C zum Beenden.\n`);
