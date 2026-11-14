#!/bin/sh
set -eu
# REQUEST_FILE: docs/evidence/mainnet-v4-close-1794662022070-3b87b608.request.json
near contract call-function as-transaction cw4.haxheton.near request_order_signature json-args '{"order":{"asset_index":74,"size":"3600000000000000000000000","reduce_only":true,"reference_price":"3322200","observed_at":"1794662020"}}' prepaid-gas '285 Tgas' attached-deposit '0 NEAR' sign-as keeper4.haxheton.near network-config mainnet sign-with-keychain send
