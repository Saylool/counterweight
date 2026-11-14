#!/bin/sh
set -eu
# REQUEST_FILE: docs/evidence/mainnet-v4-open-1794661435547-80c25aa2.request.json
near contract call-function as-transaction cw4.haxheton.near observe_margin json-args '{"equity_usdc":"20000000","withdrawable_usdc":"20000000","observed_at_ms":"1794661434144.6926"}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as haxheton.near network-config mainnet sign-with-keychain send
near contract call-function as-transaction cw4.haxheton.near request_order_signature json-args '{"order":{"asset_index":74,"size":"3600000000000000000000000","reduce_only":false,"reference_price":null}}' prepaid-gas '285 Tgas' attached-deposit '0 NEAR' sign-as keeper4.haxheton.near network-config mainnet sign-with-keychain send
