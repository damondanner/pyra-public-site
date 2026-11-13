// Shared by the current publisher and the staged Cloudflare Worker.
const { calculateBarterCredit } = require('../packages/pricing/src');
const RETENTION_DAYS = 1827;

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

function mergeSnapshot(existingHistory, snapshot) {
  assertValidSnapshot(snapshot);

  const point = {
    date: snapshot.calculated_at.slice(0, 10),
    kind: 'observed',
    value: Number(snapshot.value),
    calculated_at: snapshot.calculated_at,
    valid_rows: Number(snapshot.valid_rows || 0),
    total_rows: Number(snapshot.total_rows || 0),
    source: snapshot.source,
    calculation_method: snapshot.calculation_method
  };
  const pointsByDate = new Map();

  if (isValidHistory(existingHistory)) {
    for (const existingPoint of existingHistory.points) {
      if (isValidPoint(existingPoint)) pointsByDate.set(existingPoint.date, existingPoint);
    }
  }

  pointsByDate.set(point.date, point);
  const points = [...pointsByDate.values()]
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-RETENTION_DAYS);

  return {
    type: 'pyra_public_barter_credit_history',
    version: 1,
    frequency: 'daily',
    retention_days: RETENTION_DAYS,
    started_at: points[0].calculated_at,
    updated_at: point.calculated_at,
    source_latest: '/api/barter-credit.json',
    historical_reconstruction: points.some(historyPoint => historyPoint.kind === 'reconstructed'),
    caveat: points.some(historyPoint => historyPoint.kind === 'reconstructed')
      ? 'Reconstructed points apply the PYRA formula to available CoinGecko historical data; observed points are recorded live PYRA snapshots.'
      : 'Verified PYRA snapshots only. Values before the archive start are not reconstructed.',
    reconstruction: existingHistory && existingHistory.reconstruction || null,
    points
  };
}

function assertValidSnapshot(snapshot) {
  if (
    !snapshot ||
    snapshot.type !== 'pyra_public_barter_credit_snapshot' ||
    snapshot.status !== 'success' ||
    !Number.isFinite(Number(snapshot.value)) ||
    !/^\d{4}-\d{2}-\d{2}T/.test(snapshot.calculated_at || '')
  ) {
    throw new Error('A valid public barter-credit snapshot is required');
  }
}

function isValidHistory(history) {
  return Boolean(
    history &&
    history.type === 'pyra_public_barter_credit_history' &&
    Array.isArray(history.points) &&
    history.points.every(isValidPoint)
  );
}

function isValidPoint(point) {
  return Boolean(
    point &&
    /^\d{4}-\d{2}-\d{2}$/.test(point.date || '') &&
    ['observed', 'reconstructed'].includes(point.kind) &&
    Number.isFinite(Number(point.value)) &&
    Number(point.value) > 0
  );
}


module.exports = { createPublicSnapshot, mergeSnapshot };
