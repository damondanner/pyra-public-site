import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

// Only the isolated preview can be selected by this migration workflow.
const root = resolve(import.meta.dirname, '..');
const config = JSON.parse(await readFile(resolve(root, 'wrangler.jsonc'), 'utf8'));
if (config.name !== 'pyra-public-site-preview' || config.account_id !== 'e6017deac0612b67d81a48d9c65f444b' ||
    config.d1_databases?.length !== 1 || config.d1_databases[0].database_id !== '80d2558f-c9bc-4f6e-b85b-0c4d9ba5d6f6' || config.routes || config.route) {
  throw new Error('Only the reviewed isolated preview is permitted.');
}
const enabled = process.argv.includes('--refresh');
config.main = resolve(root, config.main);
config.assets.directory = resolve(root, config.assets.directory);
config.d1_databases[0].migrations_dir = resolve(root, config.d1_databases[0].migrations_dir);
config.vars.REFRESH_ENABLED = enabled ? 'true' : 'false';
config.triggers = { crons: enabled ? ['*/5 * * * *'] : [] };
await mkdir(resolve(root, '.cloudflare-build'), { recursive: true });
await writeFile(resolve(root, '.cloudflare-build/preview.json'), JSON.stringify(config, null, 2) + '\n');
console.log(`Isolated preview prepared; scheduled refresh ${enabled ? 'enabled' : 'disabled'}.`);
