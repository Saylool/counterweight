#!/bin/bash
# Owner-run entrypoint. This script is never executed by the engineering agent.
set -euo pipefail
export POLICY_VERSION="${POLICY_VERSION:-v4}"
case "$POLICY_VERSION" in v4|v5) ;; *) echo 'STOP: POLICY_VERSION must be v4 or v5' >&2; exit 1 ;; esac
export NEAR_MAINNET_RPC="${NEAR_MAINNET_RPC:-https://rpc.mainnet.fastnear.com}"
cd "$(dirname "$0")/.."
if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then echo 'Usage: bash scripts/mainnet-runbook.sh STEP [--resume] (1 through 18)' >&2; exit 1; fi
resume=()
if [ "$#" -eq 2 ]; then
  if [ "$2" != '--resume' ]; then echo 'STOP: only --resume is supported as a second argument' >&2; exit 1; fi
  case "$1" in 10|12|13|14|15) resume=(--resume) ;; *) echo 'STOP: --resume applies only to venue execution steps 10, 12, 13, 14 or 15' >&2; exit 1 ;; esac
fi
owner() { npx --no-install tsx scripts/mainnet-owner.ts "--step=$1"; }
venue() { npx --no-install tsx scripts/mainnet-execute.ts --network=mainnet --i-understand-real-funds --plan="docs/evidence/policy-${POLICY_VERSION}-mainnet-plan.json" "--step=$1" ${resume[@]+"${resume[@]}"}; }
case "$1" in
  1) npm test; npm run typecheck; (cd contracts/policy; shasum -a 256 -c "artifacts/SHA256SUMS.${POLICY_VERSION}"; python3 tests/check_default_exports.py "artifacts/counterweight_policy_${POLICY_VERSION}.wasm") ;;
  2) owner plan ;;
  3) owner create-keeper ;;
  4) owner create-policy ;;
  5) owner deploy ;;
  6) owner resources ;;
  7) owner margin ;;
  8) owner sign-test ;;
  9) owner delete-key ;;
  10) venue to-perp ;;
  11) owner spot ;;
  12) venue open ;;
  13) venue close ;;
  14) venue settle ;;
  15) venue withdraw ;;
  16) owner reconcile ;;
  17) owner return-spot ;;
  18) owner status ;;
  *) echo 'STOP: step must be 1 through 18' >&2; exit 1 ;;
esac
