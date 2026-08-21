# Roobird execution architecture

Roobird is the decision and initiation layer. It is not a broker, exchange, custodian, or execution venue.

## V1 support matrix

| Provider | external_handoff | intent_deeplink | quote | unsigned_transaction | provider_wallet_execution | execution_status |
|---|---:|---:|---:|---:|---:|---:|
| Bankr | yes | no | no | no | no | no |

The Bankr adapter is intentionally restricted to `external_handoff`. Roobird does not call Bankr Wallet API methods on behalf of users, request user Bankr API keys, or use a Roobird-owned key to trade user funds.

Native self-custody execution remains disabled until a documented Bankr Stock Token endpoint returns a verifiable unsigned/prepared transaction intended for the caller's external wallet.

## V1 allowlist

- Network: Robinhood Chain, chain ID 4663
- Assets: NVDA, AAPL, TSLA
- Destination: the connected Privy wallet
- Provider: Bankr

## Flow

1. The asset API returns provider capability metadata.
2. The user enters an amount and reviews asset, network, wallet, and provider.
3. The server authenticates the user and validates the asset, chain, wallet, amount, provider, and provider-asset mapping.
4. Roobird stores an execution intent without credentials or signing material.
5. The V1 adapter returns an external handoff to the official Bankr surface.
6. Roobird records `external_handoff`, not `confirmed`.

External handoff is never shown as a completed purchase because Roobird has no verifiable transaction confirmation.

## Future unsigned-transaction activation gate

Before enabling `unsigned_transaction`, the adapter must have a documented provider response containing chain ID, destination, calldata, value, and enough context to validate the transaction. Roobird must then:

- validate chain ID and destination against allowlists
- show a transaction review
- request explicit signature from the connected wallet
- keep signing material entirely client-side
- broadcast through the wallet/provider
- persist the transaction hash
- wait for Robinhood Chain confirmation
- mark `confirmed` only after a receipt is verified

A Bankr-managed-wallet flow is a separate `provider_wallet_execution` capability and must label its destination as `Bankr wallet`, never `Connected wallet`.

## Stored execution intent fields

`id`, `user_id`, `asset_id`, `provider_id`, `execution_mode`, `source_wallet`, `destination_wallet`, `requested_amount`, `estimated_output`, `provider_reference`, `transaction_hash`, `status`, `error_code`, `created_at`, `updated_at`.

Private keys, seed phrases, raw signing material, and user Bankr API keys are never stored.
