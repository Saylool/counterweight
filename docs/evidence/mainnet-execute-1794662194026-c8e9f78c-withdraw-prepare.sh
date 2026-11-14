#!/bin/sh
set -eu
near contract call-function as-transaction cw4.haxheton.near set_reference_price json-args '{"price":"3323600"}' prepaid-gas '30 Tgas' attached-deposit '0 NEAR' sign-as haxheton.near network-config mainnet sign-with-keychain send
