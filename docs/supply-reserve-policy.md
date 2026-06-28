# PYRA Multichain Supply Reserve Policy

## Status

Status: selected.

## Purpose

PYRA can operate on multiple chains, but the protocol should present a consistent supply story across chains.

The original Ethereum mainnet PYRA deployment represents the original one trillion PYRA supply. When PYRA is deployed on another supported chain or L2, the operating supply for that chain is matched by placing the same amount from the original Ethereum-based supply into a visible reserve wallet.

This policy is intended to show that new chain deployments are operational mirrors for the closed barter network, not arbitrary supply expansion.

Pricing and customer purchases are chain-agnostic. The active primary distribution price is based on aggregate PYRA distributed across the one trillion PYRA distribution schedule, not on which chain receives the customer's allocation.

## Current Reserve Model

- Original supply chain: Ethereum mainnet
- Original Ethereum PYRA contract: `0x774be8Aa7482E2d4a4961ECa756C73D662689dF1`
- Original display supply: `1000000000000` PYRA
- Reserve wallet: `0xD6EF18E249179FA55DDdc65C262Ece9db3Dd7598`
- Base receive wallet: `0xD6EF18E249179FA55DDdc65C262Ece9db3Dd7598`
- Base signer/owner wallet: `0xD6EF18E249179FA55DDdc65C262Ece9db3Dd7598`
- Standard reserve amount for each new non-Ethereum chain: `100000000000` PYRA
- Base planned supply: `100000000000` PYRA

## Chain Launch Rule

Before a new PYRA chain is treated as production-ready:

1. Record the deployed chain contract, asset, or token identifier.
2. Record the deployed chain display supply.
3. Move or hold the matching reserve amount from the original Ethereum-based supply in the public reserve wallet.
4. Record the reserve transaction hash or explorer evidence.
5. Update the chain inventory and wallet configuration.

## Base Application

For the Base deployment, the planned Base supply is:

```text
100000000000 PYRA
```

After the Base PYRA contract is deployed and accepted, record:

- Base contract address
- Base deployment transaction hash
- Ethereum reserve wallet address: `0xD6EF18E249179FA55DDdc65C262Ece9db3Dd7598`
- Base receive wallet address: `0xD6EF18E249179FA55DDdc65C262Ece9db3Dd7598`
- Ethereum reserve transaction hash or explorer evidence showing `100000000000` PYRA reserved

Create a machine-readable reserve evidence packet after the Ethereum reserve transaction is available:

```text
npm run create:supply-reserve-evidence -- --reserve-tx 0x... --output pyra-base-supply-reserve-evidence.json
```

The helper validates the target chain supply, reserve wallet format, reserve amount, Ethereum transaction hash format, and no-conversion guardrails. It does not broadcast transactions, move PYRA, make payments, or read private keys.

## Evidence Packet

The reserve evidence packet type is:

```text
pyra_supply_reserve_evidence
```

Minimum required fields:

```text
target_chain.id
target_chain.contract_address
target_chain.display_supply
original_supply_chain.contract_address
reserve.wallet
reserve.display_amount
reserve.transaction_hash
reserve.explorer_url
guardrails.no_bridge_or_conversion
guardrails.no_private_keys_or_seed_phrases
```

## Public Explanation

Suggested public wording:

```text
PYRA began with a one trillion token Ethereum mainnet supply. When PYRA operates on another supported chain, a matching amount from the original Ethereum supply is held in a visible reserve wallet. This lets members verify that multichain operation is an accounting and access expansion for the closed barter network, not an undisclosed supply expansion.
```

## Guardrails

- Do not describe mirrored chain supply as conversion.
- Do not let a delivery chain change the active primary distribution tranche price.
- Do not promise redemption between chains unless a separate written bridge/conversion policy is approved.
- Do not treat reserve movements as customer deposits.
- Do not mark a new chain production-ready until reserve evidence is recorded.
- Keep the reserve wallet public enough for member verification, but do not commit private keys or seed phrases.
- The Base receive/reserve wallet is selected as the Base PYRA signer and contract owner/admin wallet in `docs/base-signing-plan.md`.
