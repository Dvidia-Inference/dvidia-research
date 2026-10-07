import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const action = process.argv[2];
const args = {
  'dry-run': ['deploy', '--dry-run', '--outdir', '/private/tmp/dvidia-research-worker'],
  deploy: ['deploy'],
  status: ['deployments', 'list'],
}[action];
if (!args) throw new Error('Use dry-run, deploy or status.');
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const config = JSON.parse(readFileSync(join(root, 'wrangler.jsonc'), 'utf8'));
if (config.name !== 'dvidia-research' || config.routes?.length !== 1 ||
    config.routes[0].pattern !== 'research.dvidia.org' || !config.routes[0].custom_domain)
  throw new Error('Research release must target only its dedicated Worker and hostname.');
const saved = JSON.parse(readFileSync(join(homedir(), '.config/dvidia/credentials.json'), 'utf8'));
if (!saved.CLOUDFLARE_API_TOKEN || saved.CLOUDFLARE_ACCOUNT_ID !== config.account_id)
  throw new Error('Expected DVIDIA Cloudflare credential is unavailable.');
const secretStrings = Object.values(saved).filter(v => typeof v === 'string' && v.length > 20);
function redact(text) {
  for (const value of secretStrings) text = text.split(value).join('[redacted]');
  return text;
}
const child = spawn('wrangler', [...args, '--config', join(root, 'wrangler.jsonc')], {
  cwd: root,
  env: {...process.env, CLOUDFLARE_API_TOKEN: saved.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: saved.CLOUDFLARE_ACCOUNT_ID,
    WRANGLER_SEND_METRICS: 'false', WRANGLER_LOG_PATH: '/private/tmp/dvidia-research-wrangler.log'},
  stdio: ['ignore', 'pipe', 'pipe'],
});
for (const [source, target] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
  let buffered = '';
  source.setEncoding('utf8');
  source.on('data', chunk => {
    buffered += chunk;
    const lines = buffered.split('\n');
    buffered = lines.pop();
    for (const line of lines) target.write(redact(line) + '\n');
  });
  source.on('end', () => { if (buffered) target.write(redact(buffered)); });
}
child.on('error', error => { console.error(redact(error.message)); process.exitCode = 1; });
child.on('close', code => { process.exitCode = code ?? 1; });
