import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const load = async path => {
  const response = await fetch(`https://pyraprotocol.com${path}?migration=${Date.now()}`, {
    redirect: 'error', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error('The current public archive could not be read; migration stopped.');
  return response.json();
};
const [snapshot, history] = await Promise.all([load('/api/barter-credit.json'), load('/api/barter-credit-history.json')]);
const currentTime = Date.now();
if (snapshot?.type !== 'pyra_public_barter_credit_snapshot' || snapshot.status !== 'success' ||
    !Number.isFinite(snapshot.value) || snapshot.value <= 0 ||
    !Number.isFinite(Date.parse(snapshot.calculated_at)) ||
    Date.parse(snapshot.calculated_at) > currentTime + 60000 || currentTime - Date.parse(snapshot.calculated_at) > 86400000) {
  throw new Error('A current successful snapshot is required; migration stopped.');
}
const local = JSON.parse(await readFile(resolve(root, 'apps/web/public/api/barter-credit-history.json'), 'utf8'));
if (history?.type !== 'pyra_public_barter_credit_history' || !Array.isArray(history.points) ||
    history.points.length < local.points.length || !history.points.every(point =>
      /^\d{4}-\d{2}-\d{2}$/.test(point.date || '') && ['observed', 'reconstructed'].includes(point.kind) && Number.isFinite(point.value) && point.value > 0)) {
  throw new Error('The published history is invalid or shorter than the retained archive; migration stopped.');
}
await Promise.all([
  writeFile(resolve(root, 'apps/web/public/api/barter-credit.json'), JSON.stringify(snapshot, null, 2) + '\n'),
  writeFile(resolve(root, 'apps/web/public/assets/barter-credit.json'), JSON.stringify(snapshot, null, 2) + '\n'),
  writeFile(resolve(root, 'apps/web/public/api/barter-credit-history.json'), JSON.stringify(history, null, 2) + '\n'),
]);
console.log(JSON.stringify({ calculated_at: snapshot.calculated_at, history_points: history.points.length }));
