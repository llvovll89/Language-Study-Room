/* Claude Code PreToolUse hook (.claude/settings.json)
   Bash로 git commit을 실행하기 전에 데이터 검증과 단위 테스트를 돌리고, 실패하면 커밋을 막는다 (exit 2)
   git commit이 아닌 명령은 그대로 통과 (exit 0) */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

let command = "";
try{ command = JSON.parse(raw || "{}").tool_input?.command ?? ""; }catch{ process.exit(0); }
// git commit, git -C <경로> commit, git -c k=v commit 등 (git log --grep commit, git commit-tree는 제외)
const COMMIT = /\bgit(?:\s+-[A-Za-z]\s+\S+|\s+--?[\w-]+(?:=\S+)?)*\s+commit(?![\w-])/;
if(!COMMIT.test(command)) process.exit(0);

const run = (label, args) => {
  const r = spawnSync("npm", ["run", ...args], { cwd: root, encoding: "utf8", shell: true });
  if(r.status !== 0){
    const lines = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim().split("\n");
    // node --test는 실패한 테스트 이름과 이유만, 그 밖(데이터 검증)은 마지막 25줄
    const failed = lines.filter(l => /^\s*not ok|^\s*(error|expected|actual):|AssertionError/.test(l));
    const out = (failed.length ? failed : lines.slice(-25)).join("\n");
    process.stderr.write(`[커밋 전 검사 실패] ${label}\n${out}\n\n고친 뒤 다시 커밋하세요. (규칙: CLAUDE.md, 확인: npm run ${args[0]})\n`);
    process.exit(2);
  }
};

run("데이터 검증 (npm run validate)", ["validate"]);
run("단위 테스트 (npm run test:unit)", ["test:unit"]);
run("웹앱 단위 테스트 (npm run web:unit)", ["web:unit"]);
process.exit(0);
