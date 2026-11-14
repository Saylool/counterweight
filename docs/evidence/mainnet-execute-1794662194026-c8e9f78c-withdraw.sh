#!/bin/sh
set -eu
# REQUEST_FILE: docs/evidence/mainnet-v4-withdraw-1794662202701-eef44500.request.json
near contract call-function as-transaction cw4.haxheton.near observe_margin json-args '{"equity_usdc":"19986709","withdrawable_usdc":"19986709","observed_at_ms":"1794662201348"}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as haxheton.near network-config mainnet sign-with-keychain send
near contract call-function as-transaction cw4.haxheton.near request_evm_withdrawal json-args '{"recipient":"0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a","amount":"18886709"}' prepaid-gas '285 Tgas' attached-deposit '0 NEAR' sign-as haxheton.near network-config mainnet sign-with-keychain send
