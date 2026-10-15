// PostToolUse: тихо форматирует изменённый файл Prettier'ом. Никогда не блокирует.
import { execFileSync } from 'node:child_process';
process.chdir(process.env.CLAUDE_PROJECT_DIR ?? process.cwd());
import { existsSync, readFileSync } from 'node:fs';

try {
  const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
  const file = input?.tool_input?.file_path;
  const ok = /\.(tsx?|jsx?|mjs|cjs|json|css|md)$/.test(file ?? '');
  const hasPrettier = existsSync('node_modules/.bin/prettier');
  if (file && ok && existsSync(file) && hasPrettier && !file.includes('node_modules')) {
    execFileSync('node_modules/.bin/prettier', ['--write', '--log-level=silent', file], { stdio: 'ignore' });
  }
} catch {
  // форматирование не должно мешать работе
}
process.exit(0);
