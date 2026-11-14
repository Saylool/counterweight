#!/bin/sh
set -eu
curl --fail-with-body --silent --show-error --max-time 15 -X POST https://api.hyperliquid.xyz/exchange -H 'content-type: application/json' --data-binary @'docs/evidence/mainnet-v4-to-perp-1794660922741-5834afe4.request.json.exchange.json' --output 'docs/evidence/mainnet-v4-to-perp-1794660922741-5834afe4.request.json.response.json'
