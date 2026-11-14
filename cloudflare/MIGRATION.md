# Cloudflare cutover

This branch prepares hosting; the production domain still uses the existing GitHub Pages workflow until cutover is verified.

The Worker serves `apps/web/public` and routes the two public barter-credit documents and snapshot alias through a separate public-data D1 database. A scheduled refresh uses the existing pricing formula and daily-history merge shared with the current publisher. Snapshot and history are stored in one atomic document; an optimistic revision guard prevents a concurrent writer from losing history. Failed refreshes retain the previous document. Public requests cannot run refreshes or write data. No membership records belong in this database.

The checked-in configuration is preview-only, binds the dedicated `pyra-public-data-preview` database, disables provider refreshes and has no cron or production routes. Production must use a separate database and configuration.

1. Create a dedicated preview D1 database, set its ID and apply `cloudflare/migrations`. Validate asset delivery and public reads on a temporary hostname with synthetic inputs. The preview must never bind production databases or credentials.
2. Create a separate production public-data database. Seed from the latest published history, not an older checkout; update the static snapshot and history artifact before first production refresh. Keep the existing publisher running until this is verified.
3. Preserve the existing provider tier, enable refresh and add the cron `*/5 * * * *` to the production configuration. Check provider plan limits before enabling: four pages per refresh produce up to 1,152 market requests per day. The current GitHub repository has no provider secrets and uses CoinGecko public access. The Worker therefore requires an explicit public tier when no key is configured. If a paid/demo credential is added later, keep it in a Worker secret, never config, source or browser assets.
4. Validate actual refresh success, daily history retention and cache behavior on the temporary hostname. Run existing tests, `node --test cloudflare/worker.test.mjs`, and a Wrangler dry-run build. Review errors without printing provider response bodies or credentials.
5. Attach pyraprotocol.com and retain www behavior and legal/assets/data routes. Verify anonymous HTTPS, history chart, data freshness and all public pages. Keep vote.pyraprotocol.com on its existing independent deployment.
6. Replace GitHub Pages publishing with authenticated Cloudflare CI only after deployment access is configured. Remove the five-minute GitHub Pages publisher after the Worker cron is verified. Confirm that private-source changes still deploy, then make the GitHub source private.

Do not retire the old publisher before the domain cutover and refresh have been verified. Do not change domain DNS to an unregistered destination. Keep the former deployment configuration available for rollback.

## Prepared manual preview deployment

`cloudflare-preview.yml` is manual-only and restricted to main. It runs the website and Worker tests, installs pinned Wrangler, fetches the current public snapshot and full history (396 points verified in this review), and stops if either is invalid or the snapshot is older than 24 hours. It deploys only the reviewed preview Worker and dedicated preview D1 database. It never changes company DNS or deploys to the production database.

The optional `refresh` input enables the preview's five-minute cron; false removes that preview cron. Retire the preview cron after production migration to avoid duplicate upstream requests. A public provider outage retains the last successful snapshot and complete history. Actual provider success must be checked before cutover.

The workflow needs repository secret `CLOUDFLARE_PREVIEW_DEPLOY_TOKEN`, limited to Workers Scripts Edit and D1 Edit in the company account. Creating that token and storing it in GitHub require the owner's explicit confirmation. The proposed temporary token expires November 20, 2026. Encrypt it with this repository's Actions public key before transmission; never print or save the raw value. This is a new token for the GitHub workflow, distinct from the previously deleted unused local-handoff token. No provider credential needs moving.
Production uses Worker `pyra-public-site` and a separate public-data D1 database `dcb3319d-8d33-4c92-b986-8b6f8803b5ff`. The production workflow deploys only on main changes or manual dispatch; pricing refreshes run within Cloudflare, not as repeated full builds. It uses the approved account-limited temporary deployment secret; that credential expires November 20 and must be replaced for later source deployments. Cron execution does not depend on that deployment credential after publishing.

Before attaching domains, verify a real scheduled refresh through the published JSON timestamps. Disable the preview cron after production refresh succeeds. Retire the former Pages publisher and make source private after the domain points to Cloudflare. Neither database contains membership or KYC data.
