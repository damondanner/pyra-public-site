const fs = require('fs');
const path = require('path');
const { fetchCoinGeckoMarkets, getCoinGeckoConfig } = require('../apps/api/src/coingecko');
const { calculateBarterCredit } = require('../packages/pricing/src');
const { loadLocalEnv } = require('./lib/load-local-env');

const repoRoot = path.resolve(__dirname, '..');
const defaultOutputs = [
  path.join(repoRoot, 'api/barter-credit.json'),
  path.join(repoRoot, 'apps/web/public/api/barter-credit.json'),
  path.join(repoRoot, 'assets/barter-credit.json'),
  path.join(repoRoot, 'apps/web/public/assets/barter-credit.json')
];

async function main() {
  if (process.argv.includes('--self-test')) {
    runSelfTest();
    console.log('public barter-credit generator self-test passed');
    return;
  }

  await loadLocalEnv();

  const baseConfig = getCoinGeckoConfig();
  const config = {
    ...baseConfig,
    maxPages: parsePositiveInteger(process.env.PYRA_PUBLIC_MARKET_PAGES, 4),
    perPage: parsePositiveInteger(process.env.PYRA_PUBLIC_MARKET_PAGE_SIZE, 250)
  };
  const rows = await fetchCoinGeckoMarkets(config);
  const snapshot = createPublicSnapshot(rows, config);

  if (snapshot.status !== 'success') {
    throw new Error(snapshot.error || 'Barter-credit calculation failed');
  }

  const requestedOutputs = process.argv.slice(2).filter(argument => !argument.startsWith('--'));
  const outputs = requestedOutputs.length > 0
    ? requestedOutputs.map(output => path.resolve(repoRoot, output))
    : defaultOutputs;

  for (const output of outputs) {
    writeJsonAtomically(output, snapshot);
  }

  console.log(JSON.stringify({
    status: snapshot.status,
    value: snapshot.value,
    valid_rows: snapshot.valid_rows,
    total_rows: snapshot.total_rows,
    calculated_at: snapshot.calculated_at,
    outputs: outputs.map(output => path.relative(repoRoot, output).replace(/\\/g, '/'))
  }, null, 2));
}

function createPublicSnapshot(rows, config = {}) {
  const source = config.tier === 'pro' ? 'CoinGecko Pro API' : 'CoinGecko API';
  const snapshot = calculateBarterCredit(rows, { source });

  return {
    ...snapshot,
    type: 'pyra_public_barter_credit_snapshot',
    version: 1,
    market_pages_requested: config.maxPages || null,
    market_page_size: config.perPage || null,
    privacy: {
      api_key_excluded: true,
      raw_market_rows_excluded: true
    }
  };
}

function writeJsonAtomically(output, value) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const temporary = `${output}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, output);
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function runSelfTest() {
  const snapshot = createPublicSnapshot([
    { current_price: 1 },
    { current_price: 3 },
    { current_price: null },
    { current_price: 0.001 },
    { current_price: -2 }
  ], {
    tier: 'demo',
    maxPages: 4,
    perPage: 250
  });

  if (
    snapshot.status !== 'success' ||
    snapshot.value !== 2 ||
    snapshot.valid_rows !== 2 ||
    snapshot.filtered.missing_price !== 1 ||
    snapshot.filtered.below_minimum !== 1 ||
    snapshot.filtered.invalid_price !== 1 ||
    snapshot.privacy.api_key_excluded !== true ||
    JSON.stringify(snapshot).includes('apiKey')
  ) {
    throw new Error('Public barter-credit snapshot did not satisfy its safety contract');
  }
}

main().catch(error => {
  console.error(JSON.stringify({
    status: 'error',
    message: error.message
  }, null, 2));
  process.exitCode = 1;
});
