import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

if (process.env.RENDER !== 'true') {
  process.exit(0);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const result = spawnSync('npm', ['run', 'build', '-w', '@ricoz/web'], {
  cwd: root,
  env: {
    ...process.env,
    API_PROXY_URL: 'http://127.0.0.1:4000',
    NEXT_PUBLIC_API_URL: '',
  },
  stdio: 'inherit',
  shell: true,
});

process.exit(result.status ?? 1);
