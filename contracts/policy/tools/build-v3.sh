#!/usr/bin/env bash
# Production only. Never rebuild or replace the historical v2 artifact.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -d .cargo-home && -z "${CARGO_HOME:-}" ]]; then export CARGO_HOME="$PWD/.cargo-home"; fi
if [[ -d .rustup && -z "${RUSTUP_HOME:-}" ]]; then
  export RUSTUP_HOME="$PWD/.rustup"
  export RUSTUP_TOOLCHAIN="${RUSTUP_TOOLCHAIN:-stable}"
fi
optimizer="$PWD/.tmp/binaryen/node_modules/.bin/wasm-opt"
if [[ ! -x "$optimizer" ]]; then
  npm --cache="$PWD/.tmp/npm-cache" install --prefix .tmp/binaryen --no-audit --no-fund binaryen@123.0.0
fi
"$optimizer" --version
cargo build --locked --release --target wasm32-unknown-unknown --no-default-features -p counterweight-policy
"$optimizer" target/wasm32-unknown-unknown/release/counterweight_policy.wasm \
  --enable-bulk-memory --enable-sign-ext -Oz --signext-lowering \
  --strip-debug --strip-producers -o .tmp/policy-v3.wasm
"$optimizer" .tmp/policy-v3.wasm --enable-bulk-memory --flatten --rereloop \
  -Oz --converge --merge-similar-functions -Oz --converge -o .tmp/policy-v3-reloop.wasm
"$optimizer" .tmp/policy-v3-reloop.wasm --enable-bulk-memory --gufa \
  -Oz --converge --merge-similar-functions -Oz --converge -o .tmp/policy-v3.wasm
python3 tests/check_default_exports.py .tmp/policy-v3.wasm
python3 - <<'PY'
from pathlib import Path
p = Path('.tmp/policy-v3.wasm')
assert p.stat().st_size < 350_000, f'production size regression: {p.stat().st_size}'
PY
cp .tmp/policy-v3.wasm artifacts/counterweight_policy_v3.wasm
wc -c artifacts/counterweight_policy_v3.wasm
shasum -a 256 artifacts/counterweight_policy_v3.wasm
