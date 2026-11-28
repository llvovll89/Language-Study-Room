import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

/* 자동 업데이트 테스트용 정적 서버 (테스트마다 따로 띄워 서비스 워커가 섞이지 않게 한다)
   규칙은 scripts/serve.mjs(Vercel과 같은 규칙)와 같고, deploy()를 부르면 sw.js 끝에 주석을 붙여
   '새 버전 배포'를 흉내 낸다 (바이트가 달라지면 브라우저가 새 서비스 워커로 본다) */
const root = fileURLToPath(new URL("../../build/client/", import.meta.url));
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png", ".data": "text/x-script",
};
const isFile = async (p: string) => { try{ return (await stat(p)).isFile(); }catch{ return false; } };

export async function deployServer(){
  let version = 0;
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url!, "http://x").pathname);
    const safe = normalize(path).replace(/^(\.\.[/\\])+/, "");
    for(const file of [join(root, safe), join(root, safe, "index.html"), join(root, `${safe}.html`)]){
      if(!file.startsWith(root) || !await isFile(file)) continue;
      if(safe === "/sw.js"){
        res.writeHead(200, { "content-type": TYPES[".js"], "cache-control": "public, max-age=0, must-revalidate" });
        return res.end(`${await readFile(file, "utf8")}\n// deploy ${version}\n`);
      }
      res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
      return res.end(await readFile(file));
    }
    res.writeHead(404, { "content-type": TYPES[".html"] });
    res.end(await readFile(join(root, "404.html")));
  });
  await new Promise<void>(r => server.listen(0, "127.0.0.1", r));
  const { port } = server.address() as AddressInfo;
  return {
    origin: `http://127.0.0.1:${port}`,
    deploy(){ version++; },
    close: () => new Promise<void>(r => server.close(() => r())),
  };
}
