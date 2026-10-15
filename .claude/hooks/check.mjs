// Stop: если в рабочей копии есть изменённые TS/TSX-файлы – гоняет lint и typecheck.
// При ошибке возвращает код 2: Claude видит хвост вывода и продолжает исправлять.
import { execSync } from 'node:child_process';
process.chdir(process.env.CLAUDE_PROJECT_DIR ?? process.cwd());
import { existsSync, readFileSync } from 'node:fs';

const input = (() => { try { return JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { return {}; } })();
if (input.stop_hook_active) process.exit(0); // не зацикливаемся

const pkg = existsSync('package.json') ? JSON.parse(readFileSync('package.json', 'utf8')) : null;
if (!pkg?.scripts?.lint || !pkg?.scripts?.typecheck || !existsSync('node_modules')) process.exit(0);

let changed = '';
try { changed = execSync('git status --porcelain', { encoding: 'utf8' }); } catch { process.exit(0); }
if (!/\.(tsx?|mts)$/m.test(changed)) process.exit(0);

for (const script of ['lint', 'typecheck']) {
  try {
    execSync(`pnpm -s ${script}`, { encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    const out = `${e.stdout ?? ''}${e.stderr ?? ''}`.trim().split('\n').slice(-40).join('\n');
    process.stderr.write(`pnpm ${script} упал. Исправь перед завершением:\n${out}\n`);
    process.exit(2);
  }
}
process.exit(0);
