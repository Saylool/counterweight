#!/bin/sh
set -eu
near contract call-function as-transaction cw4.haxheton.near heartbeat json-args '{}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as keeper4.haxheton.near network-config mainnet sign-with-keychain send
near contract call-function as-transaction cw4.haxheton.near set_keeper_price json-args '{"price":"3317500","observed_at":"1794661420"}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as keeper4.haxheton.near network-config mainnet sign-with-keychain send
