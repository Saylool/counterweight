#!/bin/sh
set -eu
curl --fail-with-body --silent --show-error --max-time 15 -X POST https://api.hyperliquid.xyz/exchange -H 'content-type: application/json' --data-binary @'docs/evidence/mainnet-v4-withdraw-1794662202701-eef44500.request.json.exchange.json' --output 'docs/evidence/mainnet-v4-withdraw-1794662202701-eef44500.request.json.response.json'
