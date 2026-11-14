#!/bin/sh
set -eu
curl --fail-with-body --silent --show-error --max-time 15 -X POST https://api.hyperliquid.xyz/exchange -H 'content-type: application/json' --data-binary @'docs/evidence/mainnet-v4-close-1794662022070-3b87b608.request.json.exchange.json' --output 'docs/evidence/mainnet-v4-close-1794662022070-3b87b608.request.json.response.json'
