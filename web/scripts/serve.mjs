/* 빌드 결과(build/client)를 Vercel 정적 호스팅과 같은 규칙으로 띄우는 테스트용 서버
   /basic → basic/index.html, 없는 경로 → 404.html (status 404)
   사용: node scripts/serve.mjs [port] */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../build/client/", import.meta.url));
const port = Number(process.argv[2] || 4180);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png", ".data": "text/x-script",
};

const isFile = async p => { try{ return (await stat(p)).isFile(); }catch{ return false; } };

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  // 상위 폴더 접근 차단
  const safe = normalize(path).replace(/^(\.\.[/\\])+/, "");
  const candidates = [join(root, safe), join(root, safe, "index.html"), join(root, `${safe}.html`)];
  for(const file of candidates){
    if(file.startsWith(root) && await isFile(file)){
      res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
      return res.end(await readFile(file));
    }
  }
  const notFound = join(root, "404.html");
  res.writeHead(404, { "content-type": TYPES[".html"] });
  res.end(await isFile(notFound) ? await readFile(notFound) : "Not Found");
}).listen(port, () => console.log(`serving build/client on http://localhost:${port}`));
