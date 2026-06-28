const DEFAULT_MIN_PRICE_USD = 0.01;
const DEFAULT_DECIMAL_PLACES = 2;
const BUSINESS_BARTER_CREDIT = 5000;

function extractUsdPrice(row) {
  if (!row || typeof row !== 'object') {
    return null;
  }

  if (row.current_price !== undefined && row.current_price !== null) {
    return parseNumber(row.current_price);
  }

  if (row.price !== undefined && row.price !== null) {
    return parseNumber(row.price);
  }

  const nestedUsd = row.market_data &&
    row.market_data.current_price &&
    row.market_data.current_price.usd;

  if (nestedUsd !== undefined && nestedUsd !== null) {
    return parseNumber(nestedUsd);
  }

  return null;
}

function calculateBarterCredit(rows, options = {}) {
  const minPriceUsd = options.minPriceUsd ?? DEFAULT_MIN_PRICE_USD;
  const decimalPlaces = options.decimalPlaces ?? DEFAULT_DECIMAL_PLACES;
  const source = options.source || 'CoinGecko API';
  const rowsArray = Array.isArray(rows) ? rows : [];

  const filtered = {
    missing_price: 0,
    invalid_price: 0,
    below_minimum: 0
  };

  const validPrices = [];

  for (const row of rowsArray) {
    const price = extractUsdPrice(row);

    if (price === null) {
      filtered.missing_price += 1;
      continue;
    }

    if (!isValidPrice(price)) {
      filtered.invalid_price += 1;
      continue;
    }

    if (price < minPriceUsd) {
      filtered.below_minimum += 1;
      continue;
    }

    validPrices.push(price);
  }

  const totalRows = rowsArray.length;
  const validRows = validPrices.length;

  if (validRows === 0) {
    return {
      status: 'error',
      value: null,
      symbol: 'btc',
      label: 'PYRA Barter Credit',
      source,
      calculation_method: 'simple_average',
      min_price_usd: minPriceUsd,
      decimal_places: decimalPlaces,
      total_rows: totalRows,
      valid_rows: 0,
      filtered,
      error: 'No valid prices remained after filtering',
      calculated_at: new Date().toISOString()
    };
  }

  const sum = validPrices.reduce((total, price) => total + price, 0);
  const average = sum / validRows;

  return {
    status: 'success',
    value: roundToDecimalPlaces(average, decimalPlaces),
    symbol: 'btc',
    label: 'PYRA Barter Credit',
    source,
    calculation_method: 'simple_average',
    min_price_usd: minPriceUsd,
    decimal_places: decimalPlaces,
    total_rows: totalRows,
    valid_rows: validRows,
    filtered,
    stats: getPriceStats(validPrices, decimalPlaces),
    calculated_at: new Date().toISOString()
  };
}

function calculateBusinessBarterCredit(options = {}) {
  return {
    status: 'success',
    value: options.value ?? BUSINESS_BARTER_CREDIT,
    symbol: 'btc',
    label: 'PYRA Business Barter Credit',
    source: 'PYRA business instance fixed value',
    calculation_method: 'fixed_business_value',
    calculated_at: new Date().toISOString()
  };
}

function calculateMedianBarterCredit(snapshots, options = {}) {
  const minPriceUsd = options.minPriceUsd ?? DEFAULT_MIN_PRICE_USD;
  const decimalPlaces = options.decimalPlaces ?? DEFAULT_DECIMAL_PLACES;
  const source = options.source || 'Chainlink median barter-credit feed';
  const rowsArray = Array.isArray(snapshots) ? snapshots : [];
  const filtered = {
    missing_price: 0,
    invalid_price: 0,
    below_minimum: 0,
    unhealthy_source: 0
  };
  const validPrices = [];

  for (const snapshot of rowsArray) {
    if (!snapshot || typeof snapshot !== 'object') {
      filtered.missing_price += 1;
      continue;
    }

    if (snapshot.status && snapshot.status !== 'success') {
      filtered.unhealthy_source += 1;
      continue;
    }

    const price = parseNumber(snapshot.value);

    if (price === null) {
      filtered.missing_price += 1;
      continue;
    }

    if (!isValidPrice(price)) {
      filtered.invalid_price += 1;
      continue;
    }

    if (price < minPriceUsd) {
      filtered.below_minimum += 1;
      continue;
    }

    validPrices.push(price);
  }

  const totalRows = rowsArray.length;
  const validRows = validPrices.length;

  if (validRows === 0) {
    return {
      status: 'error',
      value: null,
      symbol: 'btc',
      label: 'PYRA Barter Credit',
      source,
      calculation_method: 'median_aggregation',
      min_price_usd: minPriceUsd,
      decimal_places: decimalPlaces,
      total_rows: totalRows,
      valid_rows: 0,
      filtered,
      error: 'No valid barter-credit oracle snapshots remained after filtering',
      calculated_at: new Date().toISOString()
    };
  }

  return {
    status: 'success',
    value: roundToDecimalPlaces(calculateMedian(validPrices), decimalPlaces),
    symbol: 'btc',
    label: 'PYRA Barter Credit',
    source,
    calculation_method: 'median_aggregation',
    min_price_usd: minPriceUsd,
    decimal_places: decimalPlaces,
    total_rows: totalRows,
    valid_rows: validRows,
    filtered,
    stats: getPriceStats(validPrices, decimalPlaces),
    calculated_at: new Date().toISOString()
  };
}

function isValidPrice(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function parseNumber(value) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function roundToDecimalPlaces(value, decimalPlaces) {
  const factor = 10 ** decimalPlaces;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function getPriceStats(prices, decimalPlaces = DEFAULT_DECIMAL_PLACES) {
  if (!Array.isArray(prices) || prices.length === 0) {
    return {
      min: null,
      max: null,
      median: null
    };
  }

  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];

  return {
    min: roundToDecimalPlaces(sorted[0], decimalPlaces),
    max: roundToDecimalPlaces(sorted[sorted.length - 1], decimalPlaces),
    median: roundToDecimalPlaces(median, decimalPlaces)
  };
}

function calculateMedian(values) {
  const validValues = Array.isArray(values)
    ? values.filter(isValidPrice).sort((a, b) => a - b)
    : [];

  if (validValues.length === 0) {
    return null;
  }

  const mid = Math.floor(validValues.length / 2);
  return validValues.length % 2 === 0
    ? (validValues[mid - 1] + validValues[mid]) / 2
    : validValues[mid];
}

module.exports = {
  BUSINESS_BARTER_CREDIT,
  DEFAULT_DECIMAL_PLACES,
  DEFAULT_MIN_PRICE_USD,
  calculateBarterCredit,
  calculateBusinessBarterCredit,
  calculateMedian,
  calculateMedianBarterCredit,
  extractUsdPrice,
  getPriceStats,
  isValidPrice,
  roundToDecimalPlaces
};
