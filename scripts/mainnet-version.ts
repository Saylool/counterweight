/** Version selection never redirects an existing plan or evidence directory. */
export type PolicyVersion = 'v4' | 'v5';
export function selectedPolicyVersion(value = process.env.POLICY_VERSION ?? 'v4'): PolicyVersion {
  if (value !== 'v4' && value !== 'v5') throw new Error('POLICY_VERSION must be v4 or v5');
  return value;
}
export function mainnetVersion(version: PolicyVersion = selectedPolicyVersion()) {
  return {
    version, policy: `${version === 'v4' ? 'cw4' : 'cw5'}.haxheton.near`,
    owner: 'haxheton.near', keeper: 'keeper4.haxheton.near',
    plan: `docs/evidence/policy-${version}-mainnet-plan.json`,
    wasm: `contracts/policy/artifacts/counterweight_policy_${version}.wasm`,
    checksum: `contracts/policy/artifacts/SHA256SUMS.${version}`,
    evidence: `docs/evidence/mainnet-owner-${version}`,
    lifecycleEvidence: `docs/evidence/mainnet-owner-${version}-lifecycle`,
    derivationPath: `counterweight-mainnet-${version}`,
    creationNear: version === 'v5' ? '5.5' : '7',
  };
}
export const PYTH_NEAR_STATUS = 'Unavailable: Pyth no longer supports NEAR (2026-08-26); no maintained mainnet deployment verified. Tight-band fallback only.';
