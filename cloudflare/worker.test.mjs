import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker, { refreshPublicData } from './worker.mjs';

function setup() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('./migrations/0001_public_data.sql', import.meta.url), 'utf8'));
  const seed = { type: 'pyra_public_barter_credit_history', points: [{ date: '2026-01-01', kind: 'reconstructed', value: 123, calculated_at: '2026-01-01T00:00:00.000Z' }] };
  const PUBLIC_DATA = { prepare(sql) {
    const statement = sqlite.prepare(sql);
    const prepared = { bind(...args) { this.args = args; return this; }, async first() { return statement.get(...(this.args || [])); }, async run() { return { meta: { changes: statement.run(...(this.args || [])).changes } }; } };
    return prepared;
  } };
  const env = { PUBLIC_DATA, REFRESH_ENABLED: 'true', COINGECKO_API_KEY: 'synthetic-provider-key', ASSETS: { fetch: async () => Response.json(seed) } };
  return { env, sqlite, seed };
}
const rows = async () => [{ current_price: 100 }, { current_price: 200 }, { current_price: null }];

test('refresh preserves historical reconstruction and exposes only the public snapshot', async () => {
  const { env } = setup();
  assert.equal((await refreshPublicData(env, rows)).status, 'updated');
  const response = await worker.fetch(new Request('https://preview.invalid/api/barter-credit.json'), env);
  const body = await response.json();
  assert.equal(body.value, 150);
  assert.equal(body.privacy.api_key_excluded, true);
  assert(!JSON.stringify(body).includes(env.COINGECKO_API_KEY));
  assert(!Object.hasOwn(body, 'history'));
  const history = await (await worker.fetch(new Request('https://preview.invalid/api/barter-credit-history.json'), env)).json();
  assert.equal(history.points[0].value, 123);
  assert.equal(history.points.length, 2);
});

test('failed provider refresh keeps the previous complete snapshot and history', async () => {
  const { env, sqlite } = setup();
  await refreshPublicData(env, rows);
  const before = sqlite.prepare('SELECT document FROM public_data').get().document;
  await assert.rejects(refreshPublicData(env, async () => { throw new Error('provider unavailable'); }));
  await assert.rejects(refreshPublicData(env, async () => []));
  assert.equal(sqlite.prepare('SELECT document FROM public_data').get().document, before);
});

test('preview refresh is disabled and missing credentials never make upstream requests', async () => {
  const { env } = setup();
  let called = false;
  const load = async () => { called = true; return []; };
  assert.equal((await refreshPublicData({ ...env, REFRESH_ENABLED: 'false' }, load)).status, 'disabled');
  await assert.rejects(refreshPublicData({ ...env, COINGECKO_API_KEY: '' }, load));
  assert.equal(called, false);
});

test('public visitors cannot trigger refresh or write public data', async () => {
  const { env } = setup();
  const response = await worker.fetch(new Request('https://preview.invalid/api/barter-credit.json', { method: 'POST' }), env);
  assert.equal(response.status, 405);
  const head = await worker.fetch(new Request('https://preview.invalid/api/barter-credit.json', { method: 'HEAD' }), { ...env, ASSETS: { fetch: async () => new Response(null) } });
  assert.equal(await head.text(), '');
});

test('unseeded or malformed history prevents losing the existing archive', async () => {
  const { env, sqlite } = setup();
  await assert.rejects(refreshPublicData({ ...env, ASSETS: { fetch: async () => new Response(null, { status: 404 }) } }, rows));
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM public_data').get().count, 0);
});
