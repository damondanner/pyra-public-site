# PYRA Distribution And Payment Rails

## Purpose

This document records the current PYRA primary distribution model and the intended payment integrations. It separates customer purchase of PYRA ledger space from company-operated cash-out, redemption, brokerage, or conversion services.

## Distribution Model

PYRA customers purchase ledger space represented by PYRA token allocations inside the closed barter network.

The planned primary distribution is one trillion PYRA across ten pricing tranches:

```text
Tranche 1: first 100,000,000,000 PYRA at $1 per PYRA
Tranche 2: next 100,000,000,000 PYRA at $2 per PYRA
Tranche 3: next 100,000,000,000 PYRA at $3 per PYRA
Tranche 4: next 100,000,000,000 PYRA at $4 per PYRA
Tranche 5: next 100,000,000,000 PYRA at $5 per PYRA
Tranche 6: next 100,000,000,000 PYRA at $6 per PYRA
Tranche 7: next 100,000,000,000 PYRA at $7 per PYRA
Tranche 8: next 100,000,000,000 PYRA at $8 per PYRA
Tranche 9: next 100,000,000,000 PYRA at $9 per PYRA
Tranche 10: final 100,000,000,000 PYRA at $10 per PYRA
```

The active price is determined by aggregate distributed PYRA, not by the blockchain used for delivery. A customer allocation can be delivered across one or more supported chains as long as the approved member roster and chain reserve records remain consistent.

## Chain-Agnostic Allocation

- Chain choice does not change tranche price.
- A purchase may be delivered on one chain or split across multiple supported chains.
- The member account record should preserve both the total PYRA allocation and the per-chain wallet delivery map.
- Multichain delivery must remain consistent with the supply reserve policy.
- Chain delivery should not be described as redemption or conversion between chains unless a separate written bridge policy is approved.

## Payment Rails

Intended payment acceptance:

- Major crypto payments through a controlled crypto payment rail.
- Coinbase payment flow, using the approved Coinbase account and current Coinbase developer/commerce tooling.
- PayPal checkout, using the existing PayPal business account.

Payment rails are for purchase acceptance only. PYRA does not cash out, redeem, broker, or convert PYRA for customers, and payment acceptance does not create that obligation for Pyramidion Cryptocurrency LLC.

## Payment Confirmation Workflow

1. Customer completes onboarding and wallet registration.
2. Customer creates a purchase order for a PYRA amount.
3. System calculates tranche price and total amount due.
4. Customer pays through an enabled payment rail.
5. Payment event is verified through provider status, webhook, dashboard export, or controlled manual review.
6. Admin records the confirmed payment in the customer file.
7. PYRA allocation is delivered only to approved registered wallet addresses.
8. Admin exports updated audit and member roster records.

## Order Record Requirements

Admin purchase order records should include:

- Approved member ID and source application ID.
- PYRA amount requested.
- Aggregate PYRA distributed before and after the order.
- Tranche breakdown with PYRA amount, unit USD price, and subtotal for each tranche crossed.
- Verified payment rail, provider reference, verification notes, verifier, and verification timestamp.
- Registered wallet address map copied from the approved member roster.
- Requested delivery map that totals the order amount and uses only registered wallet chains.
- Guardrails confirming KYC approval, verified payment before delivery, chain-agnostic pricing, and no cash-out, redemption, brokerage, or conversion.

Wallet-side import of an admin order export should create a receive-side activity record only. It should not broadcast a blockchain transaction, should reject orders without verified payment and guardrail metadata, and should reject an order when a connected wallet is not one of the registered wallet addresses on that order.

Admin payment confirmation records should be exportable separately from purchase orders so the customer file can preserve the payment proof artifact without implying that payment itself delivers PYRA. The confirmation record should include the order ID, member ID, payment rail, provider reference, USD amount, verifier, verification method, timestamp, notes, and guardrails confirming payment does not bypass KYC, does not deliver PYRA, and does not create cash-out, redemption, brokerage, or conversion service obligations.

Wallet-side import of a payment confirmation export should create a review-only activity record. It should not broadcast a blockchain transaction, should not mark PYRA delivered, and should reject confirmations missing provider reference, amount, verifier, verification method, or payment guardrail metadata.

Before filing or importing both artifacts together, a distribution/payment bundle validation should confirm the purchase order and payment confirmation agree on order ID, member ID, payment rail, provider reference, USD amount, and verified status.

## Coinbase Integration Notes

Current official documentation points to Coinbase Developer Platform payment tooling, Onchain Commerce examples, Coinbase Commerce API keys, supported network references, and Coinbase Business/Prime payment API distinctions.

Implementation should capture, outside the repository:

- Coinbase Commerce or CDP API key.
- Webhook signing secret or equivalent event-verification secret, if enabled.
- Product or charge metadata fields for internal customer ID, order ID, tranche number, PYRA amount, and destination chain map.
- Supported assets/networks actually enabled for the business account.
- Settlement/export process for accounting records.

Do not commit Coinbase API keys, webhook secrets, private keys, seed phrases, or dashboard screenshots containing secrets.

## PayPal Integration Notes

Current official documentation supports PayPal Checkout for one-time payments and payment buttons that can accept PayPal and common card-style payment methods.

Implementation should capture, outside the repository:

- PayPal app client ID.
- PayPal secret.
- Webhook ID and webhook verification process, if enabled.
- Sandbox/live mode separation.
- Order metadata for internal customer ID, order ID, tranche number, PYRA amount, and destination chain map.

Do not commit PayPal client secrets, webhook secrets, or dashboard screenshots containing secrets.

## Guardrails

- Do not deliver PYRA to unapproved customers.
- Do not deliver PYRA to unregistered wallet addresses.
- Do not rely on an unverified client-side payment success message.
- Do not treat payment acceptance as KYC approval.
- Do not describe PYRA purchases as company-operated exchange, redemption, cash-out, or conversion.
- Do not let the selected delivery chain affect the tranche price.
- Do not store payment provider secrets in the repository.
