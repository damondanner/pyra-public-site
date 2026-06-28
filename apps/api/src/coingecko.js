const PUBLIC_BASE_URL = 'https://api.coingecko.com/api/v3';
const PRO_BASE_URL = 'https://pro-api.coingecko.com/api/v3';

function getCoinGeckoConfig(env = process.env) {
  const apiKey = env.COINGECKO_API_KEY || '';
  const tier = (env.COINGECKO_API_TIER || (apiKey ? 'demo' : 'public')).toLowerCase();
  const maxPages = parseInteger(env.COINGECKO_MAX_PAGES, 20);
  const perPage = parseInteger(env.COINGECKO_PER_PAGE, 250);

  return {
    apiKey,
    tier,
    baseUrl: tier === 'pro' ? PRO_BASE_URL : PUBLIC_BASE_URL,
    maxPages,
    perPage: Math.min(Math.max(perPage, 1), 250),
    requestDelayMs: parseInteger(env.COINGECKO_REQUEST_DELAY_MS, tier === 'public' ? 2500 : 500)
  };
}

async function fetchCoinGeckoMarkets(config = getCoinGeckoConfig()) {
  const allRows = [];

  for (let page = 1; page <= config.maxPages; page += 1) {
    const rows = await fetchCoinGeckoMarketsPage(page, config);

    if (!Array.isArray(rows) || rows.length === 0) {
      break;
    }

    allRows.push(...rows);

    if (rows.length < config.perPage) {
      break;
    }

    if (page < config.maxPages) {
      await delay(config.requestDelayMs);
    }
  }

  return allRows;
}

async function fetchCoinGeckoMarketsPage(page, config = getCoinGeckoConfig()) {
  const url = new URL('/api/v3/coins/markets', config.baseUrl);
  url.searchParams.set('vs_currency', 'usd');
  url.searchParams.set('order', 'market_cap_desc');
  url.searchParams.set('per_page', String(config.perPage));
  url.searchParams.set('page', String(page));
  url.searchParams.set('sparkline', 'false');
  url.searchParams.set('price_change_percentage', '1h,24h,7d');

  const headers = {
    Accept: 'application/json',
    'User-Agent': 'PYRA-Barter-Credit/0.1'
  };

  if (config.apiKey && config.tier === 'pro') {
    headers['x-cg-pro-api-key'] = config.apiKey;
  } else if (config.apiKey) {
    headers['x-cg-demo-api-key'] = config.apiKey;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`CoinGecko ${response.status}: ${body.slice(0, 200)}`);
  }

  return response.json();
}

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  fetchCoinGeckoMarkets,
  fetchCoinGeckoMarketsPage,
  getCoinGeckoConfig
};
