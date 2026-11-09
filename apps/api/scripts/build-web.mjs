import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
console.log('[practicebridge] Building the website.');

const result = spawnSync('npm', ['run', 'build', '-w', '@ricoz/web'], {
  cwd: root,
  env: {
    ...process.env,
    API_PROXY_URL: process.env.API_PROXY_URL || 'http://127.0.0.1:4000',
    NEXT_PUBLIC_API_URL: '',
    NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=2048',
  },
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
