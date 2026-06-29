const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../../..');

const pages = [
  ['web app source', fs.readFileSync(path.join(repoRoot, 'apps/web/public/index.html'), 'utf8')],
  ['GitHub Pages root', fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8')]
];
const distributionPlan = fs.readFileSync(path.join(repoRoot, 'docs/pyra-distribution-and-payments.md'), 'utf8');
const protocolDoc = fs.readFileSync(path.join(repoRoot, 'docs/protocol.md'), 'utf8');
const supplyReservePolicy = fs.readFileSync(path.join(repoRoot, 'docs/supply-reserve-policy.md'), 'utf8');

for (const [label, html] of pages) {
  for (const expected of [
    'PYRA Protocol',
    '<link rel="icon" href="assets/pyra-logo.jpg" type="image/jpeg">',
    'assets/pyra-logo.jpg',
    'base:app_id',
    '6a246aeaab28df7fd2fc178e',
    'Wallet Live',
    'https://wallet.pyraprotocol.com/',
    'Open PYRA Wallet',
    'USA-only distributed-ledger barter credit system',
    'A member-only barter network built on blockchain infrastructure.',
    '0x6ddd86...63ed3e',
    '100B PYRA',
    'PYRA Barter Credit',
    'btc (barter credit)',
    'Loading the published CoinGecko market snapshot',
    "BARTER_CREDIT_PATH = 'api/barter-credit.json'",
    'pyra_public_barter_credit_snapshot',
    'Published CoinGecko reference',
    'CACHE_MS = 5 * 60 * 1000',
    'Barter Credit History',
    'barterCreditHistoryChart',
    'CoinGecko reconstruction',
    'Observed PYRA snapshot',
    'api/barter-credit-history.json',
    'assets/barter-credit-chart.js',
    'Member Wallet',
    'KYC Approval',
    'Secure USA-only intake replaces ordinary email for identity documents',
    'encrypted local storage references',
    'manual account approval',
    'Closed Network Controls',
    'USA-only membership',
    'Onboarding Gate',
    'USA-only jurisdiction checks',
    'registered PYRA wallet addresses',
    'Members may transact on public blockchains',
    'reviewed roster records and approved wallet addresses',
    'No Cash Conversion',
    'does not cash out, redeem, broker, or convert PYRA',
    'Activity Records',
    'Multichain Footprint',
    'Member Voting',
    'P2P and Time Bank',
    'Phone-to-phone barter capture',
    'Emergency Recovery',
    'Emergency Recovery Loop',
    'pyra_emergency_iou',
    'pyra_emergency_recovery_packet',
    'pyra_emergency_settlement_plan',
    'two-party QR payloads',
    'handoff acknowledgements',
    'recovery packets',
    'settlement plans for later review',
    'No transfer',
    'without KYC documents, seed phrases, private keys, signatures, or broadcasts',
    'Public Vote Tally',
    'pyra_public_vote_tally',
    'assets/public-vote-tally.json',
    'normalizePublicTallyPayload',
    'isSafePublicTally',
    'PUBLIC_TALLY_FORBIDDEN_KEYS',
    'hasForbiddenPublicTallyKeys',
    'accepted_votes',
    'registered_wallets',
    'member_roster_sha256',
    'memberRosterSha256',
    'member_roster_byte_length',
    'memberRosterByteLength',
    'walletAddress',
    'wallet_addresses',
    'walletAddresses',
    'renderPublicTally',
    'refreshPublicTally',
    'Public results load from assets/public-vote-tally.json',
    'Privacy Boundary',
    'KYC data, member roster records, raw transfers, and voter wallet lists are excluded',
    'eligibility',
    'approved_member_roster_required',
    'isValidPublicTallyRegisteredWalletCount',
    'member_roster_snapshot_id',
    'registered_wallet_count',
    'registered wallets at tally time',
    'No public tally snapshot has been published yet.',
    'last indexed block',
    'Pyramidion Cryptocurrency LLC is not a bank',
    'not an FDIC-insured institution',
    'PYRA is not FDIC insured',
    'PYRA is not a deposit account, legal tender, investment product',
    'Terms of Use',
    'Privacy Notice',
    'Data Requests',
    'Accessibility',
    'Security',
    'terms.html',
    'privacy.html',
    'data-request.html',
    'accessibility.html',
    'security.html',
    'mailto:damondanner@gmail.com',
    'No wallet transactions occur on this informational page.'
  ]) {
    assert(html.includes(expected), `Expected ${label} landing page to include: ${expected}`);
  }

  assert(!/<button[\s>]/i.test(html), `${label} landing page should not include live buttons yet.`);
  assert(!/<form[\s>]/i.test(html), `${label} landing page should not include live forms yet.`);
  assert(!html.includes('style: \'currency\''), `${label} should not display PYRA btc with currency formatting.`);
  assert(!html.includes('currency: \'USD\''), `${label} should not display PYRA btc with a dollar sign.`);
  assert(!html.includes('api.coingecko.com'), `${label} should not call CoinGecko from a visitor browser.`);
}

const legalPages = [
  ['root terms', fs.readFileSync(path.join(repoRoot, 'terms.html'), 'utf8')],
  ['web terms', fs.readFileSync(path.join(repoRoot, 'apps/web/public/terms.html'), 'utf8')],
  ['root privacy', fs.readFileSync(path.join(repoRoot, 'privacy.html'), 'utf8')],
  ['web privacy', fs.readFileSync(path.join(repoRoot, 'apps/web/public/privacy.html'), 'utf8')],
  ['root data request', fs.readFileSync(path.join(repoRoot, 'data-request.html'), 'utf8')],
  ['web data request', fs.readFileSync(path.join(repoRoot, 'apps/web/public/data-request.html'), 'utf8')],
  ['root accessibility', fs.readFileSync(path.join(repoRoot, 'accessibility.html'), 'utf8')],
  ['web accessibility', fs.readFileSync(path.join(repoRoot, 'apps/web/public/accessibility.html'), 'utf8')],
  ['root security', fs.readFileSync(path.join(repoRoot, 'security.html'), 'utf8')],
  ['web security', fs.readFileSync(path.join(repoRoot, 'apps/web/public/security.html'), 'utf8')]
];

for (const [label, html] of legalPages) {
  for (const expected of [
    'PYRA Protocol',
    '<link rel="icon" href="assets/pyra-logo.jpg" type="image/jpeg">',
    'assets/pyra-logo.jpg',
    'legal.css'
  ]) {
    assert(html.includes(expected), `Expected ${label} to include legal shell text: ${expected}`);
  }
}

for (const [label, html] of legalPages.filter(([label]) => label.includes('terms'))) {
  for (const expected of [
    'PYRA Terms of Use',
    'Pyramidion Cryptocurrency LLC is not a bank',
    'not an FDIC-insured institution',
    'PYRA is not FDIC insured',
    'closed barter-network credit',
    'does not cash out, redeem, broker, exchange, or convert PYRA',
    'not legal, tax, accounting, securities, commodities, banking, privacy, sanctions, AML, or investment advice'
  ]) {
    assert(html.includes(expected), `Expected ${label} to include terms boundary: ${expected}`);
  }
}

for (const [label, html] of legalPages.filter(([label]) => label.includes('privacy'))) {
  for (const expected of [
    'PYRA Privacy Notice',
    'No public ID uploads',
    'Information We May Collect',
    'KYC document contents must not be committed to GitHub',
    'BSA/AML retention',
    'does not sell KYC document images',
    'A data request cannot erase public blockchain history',
    'damondanner@gmail.com',
    'Email initiates manual review only'
  ]) {
    assert(html.includes(expected), `Expected ${label} to include privacy boundary: ${expected}`);
  }
}

for (const [label, html] of legalPages.filter(([label]) => label.includes('data request'))) {
  for (const expected of [
    'Customer Information Request',
    'pyra_data_request',
    'not a live upload form',
    'Manual identity verification is required',
    'BSA/AML retention',
    'No automatic deletion',
    'private keys, seed phrases, or sensitive credentials',
    'Request Contact',
    'damondanner@gmail.com'
  ]) {
    assert(html.includes(expected), `Expected ${label} to include data request boundary: ${expected}`);
  }

  assert(!/<form[\s>]/i.test(html), `${label} should be printable and not submit a live form yet.`);
}

for (const [label, html] of legalPages.filter(([label]) => label.includes('accessibility'))) {
  for (const expected of [
    'PYRA Accessibility Statement',
    'people who use screen readers, keyboard navigation, browser zoom, or other assistive technology',
    'Report accessibility problems to',
    'damondanner@gmail.com',
    'automated checks with manual keyboard, screen-reader, zoom, contrast, and form-label review'
  ]) {
    assert(html.includes(expected), `Expected ${label} to include accessibility boundary: ${expected}`);
  }
}

for (const [label, html] of legalPages.filter(([label]) => label.includes('security'))) {
  for (const expected of [
    'PYRA Security Reporting',
    'Do not send secrets',
    'Report suspected security issues privately to',
    'damondanner@gmail.com',
    'Do not test against KYC records, member records, payment records',
    'No Bug Bounty Yet'
  ]) {
    assert(html.includes(expected), `Expected ${label} to include security boundary: ${expected}`);
  }
}

assert(fs.existsSync(path.join(repoRoot, 'assets/pyra-logo.jpg')), 'Expected root GitHub Pages logo asset to exist.');
assert(fs.existsSync(path.join(repoRoot, 'assets/barter-credit.json')), 'Expected root barter-credit snapshot to exist.');
assert(fs.existsSync(path.join(repoRoot, 'assets/public-vote-tally.json')), 'Expected root vote publication status to exist.');
assert(fs.existsSync(path.join(repoRoot, 'assets/barter-credit-chart.js')), 'Expected root barter-credit chart script to exist.');
assert(fs.existsSync(path.join(repoRoot, 'api/index.json')), 'Expected root public API discovery document to exist.');
assert(fs.existsSync(path.join(repoRoot, 'api/barter-credit.json')), 'Expected root canonical barter-credit snapshot to exist.');
assert(fs.existsSync(path.join(repoRoot, 'api/barter-credit-history.json')), 'Expected root barter-credit history to exist.');

for (const expected of [
  '100,000,000,000 PYRA',
  '$1',
  '$10',
  'Chain choice does not change tranche price',
  'does not cash out',
  'wallet'
]) {
  assert(distributionPlan.toLowerCase().includes(expected.toLowerCase()), `Expected distribution plan to include: ${expected}`);
}

assert(protocolDoc.includes('Primary distribution sells PYRA ledger space'), 'Expected protocol to include primary distribution positioning.');
assert(supplyReservePolicy.includes('Pricing and customer purchases are chain-agnostic'), 'Expected reserve policy to include chain-agnostic pricing.');
assert(distributionPlan.includes('Coinbase Commerce or CDP API key'), 'Expected distribution plan to track Coinbase account requirements.');
assert(distributionPlan.includes('PayPal app client ID'), 'Expected distribution plan to track PayPal account requirements.');
assert(distributionPlan.includes('Do not deliver PYRA to unapproved customers'), 'Expected distribution plan to include delivery guardrails.');
assert(distributionPlan.includes('Requested delivery map that totals the order amount'), 'Expected distribution plan to include order record delivery controls.');
assert(distributionPlan.includes('Wallet-side import of an admin order export'), 'Expected distribution plan to include wallet-side order import boundary.');

console.log('web static test passed');
