import credit from './public-credit.cjs';
import coinGecko from '../apps/api/src/coingecko.js';

const SNAPSHOT_PATHS = new Set(['/api/barter-credit.json', '/assets/barter-credit.json']);
const HISTORY_PATH = '/api/barter-credit-history.json';

function publicJson(value, method) {
  return new Response(method === 'HEAD' ? null : JSON.stringify(value), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', 'X-Content-Type-Options': 'nosniff' },
  });
}

export async function refreshPublicData(env, loadMarkets = coinGecko.fetchCoinGeckoMarkets) {
  if (env.REFRESH_ENABLED !== 'true') return { status: 'disabled' };
  if (!env.PUBLIC_DATA || (!env.COINGECKO_API_KEY && env.COINGECKO_API_TIER !== 'public')) throw new Error('Public data storage and explicit provider configuration are required.');
  const config = { ...coinGecko.getCoinGeckoConfig(env), maxPages: 4, perPage: 250 };
  const snapshot = credit.createPublicSnapshot(await loadMarkets(config), config);
  if (snapshot.status !== 'success') throw new Error('Provider did not return a valid public snapshot.');

  // Read after fetching so overlapping invocations merge against the latest state.
  const previous = await env.PUBLIC_DATA.prepare('SELECT document, revision FROM public_data WHERE id = 1').first();
  let seedHistory;
  if (previous) {
    const old = JSON.parse(previous.document);
    if (old.snapshot.calculated_at >= snapshot.calculated_at) return { status: 'superseded' };
    seedHistory = old.history;
  } else {
    const seed = await env.ASSETS.fetch(new Request('https://assets.invalid' + HISTORY_PATH));
    if (!seed.ok) throw new Error('Existing history must be seeded before publishing.');
    seedHistory = await seed.json();
    if (seedHistory.type !== 'pyra_public_barter_credit_history' || !Array.isArray(seedHistory.points) || !seedHistory.points.length) {
      throw new Error('A valid existing history archive is required.');
    }
  }
  const history = credit.mergeSnapshot(seedHistory, snapshot);
  const document = JSON.stringify({ snapshot, history });
  const result = previous
    ? await env.PUBLIC_DATA.prepare('UPDATE public_data SET document = ?, revision = revision + 1 WHERE id = 1 AND revision = ?').bind(document, previous.revision).run()
    : await env.PUBLIC_DATA.prepare('INSERT INTO public_data (id, document, revision) VALUES (1, ?, 1) ON CONFLICT(id) DO NOTHING').bind(document).run();
  return { status: result.meta.changes === 1 ? 'updated' : 'superseded' };
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (SNAPSHOT_PATHS.has(path) || path === HISTORY_PATH) {
      if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
      if (env.PUBLIC_DATA) {
        const row = await env.PUBLIC_DATA.prepare('SELECT document FROM public_data WHERE id = 1').first();
        if (row) {
          const data = JSON.parse(row.document);
          return publicJson(path === HISTORY_PATH ? data.history : data.snapshot, request.method);
        }
      }
      // Until the first successful refresh, retain the last published static data.
    }
    return env.ASSETS.fetch(request);
  },
  async scheduled(_event, env) {
    // Report a failed invocation to Cloudflare without logging credentials or upstream bodies.
    try { await refreshPublicData(env); }
    catch { throw new Error('Public reference refresh failed; previous snapshot retained.'); }
  },
};
