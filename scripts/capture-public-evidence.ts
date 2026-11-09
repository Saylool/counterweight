/** Public RPC views and a recycled public signature control. Never signs or accesses an account. */
import { writeFile } from 'node:fs/promises';
import { deriveEvmAddress, getSigningDigest, harmlessCancel, nearPublicKeyToHex, recoveredSigner,
  submitTestnetProof, testnetMeta, testnetView, TESTNET_RPC, TESTNET_SIGNER } from '../packages/hyperliquid/src/index.js';
async function main() {
  const root = await testnetView('public_key', {});
  const examples = [];
  for (const path of ['ethereum-1', 'ethereum-2']) {
    const predecessor = 'example.near'; // Opaque predecessor text in a testnet view, not a mainnet call.
    const remote = await testnetView('derived_public_key', { predecessor, path, domain_id: 0 });
    const local = deriveEvmAddress(root.value, predecessor, path);
    if (local.publicKey !== nearPublicKeyToHex(remote.value)) throw new Error('Public derivation mismatch');
    examples.push({ predecessor, path, rpcResponse: remote, ...local });
  }
  const derivation = { capturedAt: new Date().toISOString(), rpcUrl: TESTNET_RPC, contract: TESTNET_SIGNER, root,
    provenance: ['https://docs.near.org/chain-abstraction/chain-signatures/implementation',
      'https://github.com/NearDeFi/chainsig.js/blob/main/src/utils/cryptography.ts'], examples };
  await writeFile('fixtures/chainsig-public-derivation.json', `${JSON.stringify(derivation, null, 2)}\n`);
  const meta = await testnetMeta();
  const index = meta.universe.findIndex(a => a.name === 'NEAR');
  if (index < 0) throw new Error('NEAR market missing');
  const input = harmlessCancel(index, Date.now());
  // Already-public on-chain MPC signature, reused on an unrelated digest as a control.
  // There is no corresponding known signing key, and this is not our owner/MPC proof.
  const publicSignature = {
    r: '0x1b1dbaa86589149a89df3845df0de182ad3190925d66e87b82d4d91108d876c6',
    s: '0x04d417c672d65a5e5c1f826cf0cccd62343162a046a8169bb5b66e3797202798', v: 27,
  } as const;
  const address = await recoveredSigner(getSigningDigest(input), publicSignature);
  const result = await submitTestnetProof(input, publicSignature, address);
  const evidence = { kind: 'recycled-public-signature-control-NOT-owner-MPC-proof', capturedAt: new Date().toISOString(),
    signatureSource: 'https://nearblocks.io/txns/C1BFVeNKTdGisszpssXMcg3qVnJatdcS4zh6Hxt3jxqY/execution',
    input, digest: getSigningDigest(input), ...result };
  await writeFile('fixtures/hyperliquid-testnet-public-control.json', `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  if (result.verdict === 'unproven') process.exitCode = 1;
}
main().catch((e: unknown) => { console.error(e instanceof Error ? e.message : 'Public capture failed'); process.exitCode = 1; });
