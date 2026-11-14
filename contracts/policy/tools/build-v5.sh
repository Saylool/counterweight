#!/usr/bin/env bash
# Production v5 only. Historical artifacts and live keeper scratch stay untouched.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -d .cargo-home && -z "${CARGO_HOME:-}" ]]; then export CARGO_HOME="$PWD/.cargo-home"; fi
if [[ -d .rustup && -z "${RUSTUP_HOME:-}" ]]; then
  export RUSTUP_HOME="$PWD/.rustup"
  export RUSTUP_TOOLCHAIN="${RUSTUP_TOOLCHAIN:-stable}"
fi
scratch=$(mktemp -d /private/tmp/counterweight-v5-build.XXXXXX)
trap 'rm -rf "$scratch"' EXIT
npm --cache="$scratch/npm-cache" install --prefix "$scratch/binaryen" --no-audit --no-fund binaryen@123.0.0
optimizer="$scratch/binaryen/node_modules/.bin/wasm-opt"
"$optimizer" --version
cargo build --locked --release --target wasm32-unknown-unknown --no-default-features -p counterweight-policy
"$optimizer" target/wasm32-unknown-unknown/release/counterweight_policy.wasm \
  --enable-bulk-memory --enable-sign-ext -Oz --signext-lowering \
  --strip-debug --strip-producers -o "$scratch/policy-v5.wasm"
"$optimizer" "$scratch/policy-v5.wasm" --enable-bulk-memory --flatten --rereloop \
  -Oz --converge --merge-similar-functions -Oz --converge -o "$scratch/policy-v5-reloop.wasm"
"$optimizer" "$scratch/policy-v5-reloop.wasm" --enable-bulk-memory --gufa \
  -Oz --converge --merge-similar-functions -Oz --converge -o "$scratch/policy-v5.wasm"
python3 tests/check_default_exports.py "$scratch/policy-v5.wasm"
python3 - "$scratch/policy-v5.wasm" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
assert p.stat().st_size < 350_000, f'production size regression: {p.stat().st_size}'
PY
cp "$scratch/policy-v5.wasm" artifacts/counterweight_policy_v5.wasm
wc -c artifacts/counterweight_policy_v5.wasm
shasum -a 256 artifacts/counterweight_policy_v5.wasm | tee artifacts/SHA256SUMS.v5
