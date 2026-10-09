// In hai PDF tài liệu từ mẫu HTML cục bộ.
// node scripts/xuat-pdf-tai-lieu.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const JOBS = [
  {
    urlPath: "/scripts/mau-cam-nang.html",
    out: path.join(ROOT, "assets/cam-nang-cham-soc-suc-khoe-chu-dong.pdf"),
  },
  {
    urlPath: "/__in/ebook.html",
    out: path.join(ROOT, "ebook/lang-nghe-co-the.pdf"),
  },
];

function mime(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".woff2") return "font/woff2";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

function ebookIn() {
  const html = fs.readFileSync(path.join(ROOT, "ebook/index.html"), "utf8");
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, "");
}

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (urlPath === "/__in/ebook.html") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(ebookIn());
      return;
    }
    const rel = path.normalize(urlPath).replace(/^[/\\]+/, "");
    const file = path.resolve(ROOT, rel);
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("not found");
        return;
      }
      res.writeHead(200, { "Content-Type": mime(file) });
      res.end(data);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function whichChrome() {
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) return process.env.CHROME_BIN;
  const candidates = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  const out = execFileSync("npx", ["--yes", "@puppeteer/browsers", "install", "chrome"], {
    encoding: "utf8",
    cwd: ROOT,
  });
  const lines = out.trim().split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const last = lines[lines.length - 1] || "";
  const bin = last.split(/\s+/).pop();
  if (!bin || !fs.existsSync(bin)) throw new Error("Khong cai duoc Chrome (CHROME_BIN)");
  return bin;
}

function inPdf(chrome, url, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--no-pdf-header-footer",
    "--virtual-time-budget=15000",
    `--print-to-pdf=${dest}`,
    url,
  ];
  return new Promise((resolve, reject) => {
    const child = spawn(chrome, args, { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    child.stderr.on("data", (d) => { err += d.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0 || !fs.existsSync(dest)) reject(new Error(err || `chrome exit ${code}`));
      else resolve();
    });
  });
}

const server = await startServer();
const { port } = server.address();
const chrome = whichChrome();
try {
  for (const job of JOBS) {
    const url = `http://127.0.0.1:${port}${job.urlPath}`;
    await inPdf(chrome, url, job.out);
    console.log("OK", path.relative(ROOT, job.out));
  }
} finally {
  server.close();
}
