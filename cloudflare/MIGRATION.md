# Cloudflare cutover

This branch prepares hosting; the production domain still uses the existing GitHub Pages workflow until cutover is verified.

The Worker serves `apps/web/public` and routes the two public barter-credit documents and snapshot alias through a separate public-data D1 database. A scheduled refresh uses the existing pricing formula and daily-history merge shared with the current publisher. Snapshot and history are stored in one atomic document; an optimistic revision guard prevents a concurrent writer from losing history. Failed refreshes retain the previous document. Public requests cannot run refreshes or write data. No membership records belong in this database.

The checked-in configuration is preview-only, uses a placeholder database ID, disables provider refreshes and has no cron or production routes. It must be configured before deployment.

1. Create a dedicated preview D1 database, set its ID and apply `cloudflare/migrations`. Validate asset delivery and public reads on a temporary hostname with synthetic inputs. The preview must never bind production databases or credentials.
2. Create a separate production public-data database. Seed from the latest published history, not an older checkout; update the static snapshot and history artifact before first production refresh. Keep the existing publisher running until this is verified.
3. Put the provider credential in a Worker secret, configure the existing tier, enable refresh and add the cron `*/5 * * * *` to the production configuration. Check provider plan limits before enabling: four pages per refresh produce up to 1,152 market requests per day. No secret belongs in config, source or browser assets.
4. Validate actual refresh success, daily history retention and cache behavior on the temporary hostname. Run existing tests, `node --test cloudflare/worker.test.mjs`, and a Wrangler dry-run build. Review errors without printing provider response bodies or credentials.
5. Attach pyraprotocol.com and retain www behavior and legal/assets/data routes. Verify anonymous HTTPS, history chart, data freshness and all public pages. Keep vote.pyraprotocol.com on its existing independent deployment.
6. Replace GitHub Pages publishing with authenticated Cloudflare CI only after deployment access is configured. Remove the five-minute GitHub Pages publisher after the Worker cron is verified. Confirm that private-source changes still deploy, then make the GitHub source private.

Do not retire the old publisher before the domain cutover and refresh have been verified. Do not change domain DNS to an unregistered destination. Keep the former deployment configuration available for rollback.
