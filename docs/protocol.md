# PYRA Protocol

## Summary

PYRA is a distributed-ledger barter credit system for a closed trade network. It gives members a way to record, hold, send, and receive barter credits inside the PYRA network.

## Positioning

Preferred public language:

> PYRA is a barter credit used as a unit of account within the PYRA closed trade network.

Avoid presenting PYRA as a public exchange product or a company-operated conversion service.

## Operating Model

- Members join under the PYRA operating agreement.
- KYC/account approval is required before member activation.
- Approved members must register at least one supported-chain PYRA wallet address during onboarding.
- Approved members may participate in the closed barter network.
- PYRA transfers may occur on public blockchain rails, but network membership and wallet eligibility are controlled through reviewed roster records.
- PYRA transfers record barter-network activity.
- Send/receive activity is treated according to the barter rules defined in the operating agreement, whitepaper, and compliance program.
- The company does not cash out, redeem, broker, or convert PYRA into fiat or other tokens.
- Primary distribution sells PYRA ledger space in 100 billion PYRA tranches from $1 to $10 per PYRA until one trillion PYRA have been distributed; chain selection does not change tranche price.

## Activity Records

Wallet and API services should record PYRA activity in a consistent structure:

- member
- counterparty, when available
- chain
- transaction hash or ledger reference
- amount
- activity direction
- activity status
- barter credit value reference, when applicable

Incoming PYRA transfer activity is categorized as network income activity for reporting workflows, subject to the operating agreement, whitepaper, and compliance program.

## Regulatory Crosswalk

The federal agency and use-case review map lives in `docs/regulatory-crosswalk.md`. That document is a counsel/manual-review checklist, not a legal conclusion. It keeps IRS barter reporting, FinCEN/BSA, OFAC, FTC, SEC, CFTC, CFPB, and banking-agency watch items tied to the current PYRA boundaries.

## Public Website Notices

The public website legal-notice scaffold lives in `docs/public-website-compliance.md`. It tracks homepage FDIC/banking disclaimers, Terms of Use, Privacy Notice, and the printable customer information request page for counsel review before production launch.

## Member Voting

PYRA can support closed-network votes using proposal-specific yes/no or up/down vote wallets. Members vote by sending a qualifying PYRA transfer to the selected vote wallet. Vote tallying should count one approved registered wallet once per proposal, regardless of how much PYRA was sent.

The detailed voting model lives in `docs/voting-protocol.md`.

## Time Bank

PYRA can support service-time barter by timing member work, applying a local MIT Living Wage single-adult hourly baseline, and preparing a suggested P2P PYRA send amount. Members may also enter a custom professional rate for specialized work, with the rate source preserved for activity records.

The detailed Time Bank model lives in `docs/time-bank.md`.

## Chains

PYRA currently has footprint on:

- Ethereum
- BNB Chain
- Algorand

Algorand is used exclusively for B2B activity. Base is planned as a modernization target.

## Cross-Chain Operating Invariant

PYRA token operations should remain the same on every supported chain.

The exception is Algorand:

- Algorand is used specifically for B2B activity.
- Algorand has no PYRA smart contract interaction fee.
- Algorand wallet/account handling is separate from EVM smart contract handling.

For every other chain, including Ethereum, BNB Chain, Base, and future public network deployments, PYRA should preserve the same operating behavior unless an explicit protocol decision changes that rule.

## Open Items

- Import contract addresses.
- Import ABI files.
- Import Algorand asset/app IDs.
- Import existing whitepaper and operating agreement language.
- Import old whitepaper as a historical source, then track corrections against current protocol behavior.
- Define member account types.
- Define business account flow.
- Implement primary distribution order records and payment confirmation workflow.
