#!/bin/sh
set -eu
# REQUEST_FILE: docs/evidence/mainnet-v4-to-perp-1794660922741-5834afe4.request.json
near contract call-function as-transaction cw4.haxheton.near request_usd_class_transfer json-args '{"amount":"20000000","to_perp":true}' prepaid-gas '285 Tgas' attached-deposit '0 NEAR' sign-as haxheton.near network-config mainnet sign-with-keychain send
