const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const RETENTION_DAYS = 1827;
const defaultSnapshot = path.join(repoRoot, 'api/barter-credit.json');
const defaultOutputs = [
  path.join(repoRoot, 'api/barter-credit-history.json'),
  path.join(repoRoot, 'apps/web/public/api/barter-credit-history.json')
];

async function main() {
  if (process.argv.includes('--self-test')) {
    runSelfTest();
    console.log('public barter-credit history self-test passed');
    return;
  }

  const argumentsList = process.argv.slice(2).filter(argument => !argument.startsWith('--'));
  const snapshotPath = argumentsList[0] ? path.resolve(repoRoot, argumentsList[0]) : defaultSnapshot;
  const outputs = argumentsList.length > 1
    ? argumentsList.slice(1).map(output => path.resolve(repoRoot, output))
    : defaultOutputs;
  const snapshot = readJson(snapshotPath);
  const localHistory = outputs.map(readJsonIfPresent).find(isValidHistory) || null;
  const remoteHistory = await fetchHistory(process.env.PYRA_PUBLIC_HISTORY_URL || '');
  const history = mergeSnapshot(remoteHistory || localHistory, snapshot);

  for (const output of outputs) {
    writeJsonAtomically(output, history);
  }

  console.log(JSON.stringify({
    status: 'success',
    points: history.points.length,
    first_date: history.points[0].date,
    last_date: history.points[history.points.length - 1].date,
    outputs: outputs.map(output => path.relative(repoRoot, output).replace(/\\/g, '/'))
  }, null, 2));
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

async function fetchHistory(url) {
  if (!url) return null;

  try {
    const separator = url.includes('?') ? '&' : '?';
    const response = await fetch(`${url}${separator}refresh=${Date.now()}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return null;
    const history = await response.json();
    return isValidHistory(history) ? history : null;
  } catch (error) {
    return null;
  }
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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readJsonIfPresent(filePath) {
  return fs.existsSync(filePath) ? readJson(filePath) : null;
}

function writeJsonAtomically(output, value) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const temporary = `${output}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, output);
}

function runSelfTest() {
  const oldSnapshot = {
    type: 'pyra_public_barter_credit_snapshot',
    status: 'success',
    value: 100,
    calculated_at: '2026-06-26T12:00:00.000Z',
    valid_rows: 800,
    total_rows: 1000,
    source: 'CoinGecko API',
    calculation_method: 'simple_average'
  };
  const newSnapshot = {
    ...oldSnapshot,
    value: 125,
    calculated_at: '2026-06-27T12:00:00.000Z'
  };
  const sameDaySnapshot = {
    ...newSnapshot,
    value: 130,
    calculated_at: '2026-06-27T18:00:00.000Z'
  };
  const firstHistory = mergeSnapshot(null, oldSnapshot);
  const secondHistory = mergeSnapshot(firstHistory, newSnapshot);
  const upsertedHistory = mergeSnapshot(secondHistory, sameDaySnapshot);

  if (
    firstHistory.points.length !== 1 ||
    secondHistory.points.length !== 2 ||
    upsertedHistory.points.length !== 2 ||
    upsertedHistory.points[1].value !== 130 ||
    upsertedHistory.historical_reconstruction !== false ||
    upsertedHistory.retention_days !== RETENTION_DAYS
  ) {
    throw new Error('Public barter-credit history did not preserve its daily archive contract');
  }
}

main().catch(error => {
  console.error(JSON.stringify({ status: 'error', message: error.message }, null, 2));
  process.exitCode = 1;
});
