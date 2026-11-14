#!/bin/sh
set -eu
near contract call-function as-transaction cw4.haxheton.near settle_position json-args '{"short_size":"0","observed_at_ms":"1794662185103"}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as haxheton.near network-config mainnet sign-with-keychain send
