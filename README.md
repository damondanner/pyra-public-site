# PYRA Public Site

Public website and read-only Barter Credit data publisher for PYRA Protocol.

This repository intentionally excludes the admin office, KYC portal, wallet source, mobile scope, private operational documentation, signing material, and deployment keys.

The production domain is `pyraprotocol.com`. The Cloudflare production workflow deploys the website from private GitHub source, while a Cloudflare scheduled job refreshes public pricing and daily history every five minutes. The public-data database contains no member or KYC records. The separate voting site is `vote.pyraprotocol.com`.

The former GitHub Pages workflow now performs verification only. See [migration and rollback details](cloudflare/MIGRATION.md). Deployment access currently uses an approved temporary credential expiring November 20, 2026; replace that credential before later source deployments. The running Cloudflare pricing schedule continues independently of the deployment credential.
