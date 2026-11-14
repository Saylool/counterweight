import { z } from 'zod';
import type { PublicClient } from '../apps/keeper/src/run-io.js';

// Release artifact downloaded read-only from near/mpc/releases/tag/3.18.0.
// SHA256 af8c66fd218f88bc6223d9d11eea7b6b1911ffd891d37ae3179f15cdf4a94955.
// That release has no deposit view: its shared SIGN_DEPOSIT_YOCTONEAR is 1.
export const SIGNER_RELEASE = { version: '3.18.0', codeHash: 'CpGX8ywXJwvWPgZFDDCTCuPJBHF7BATT51gSfc3APERJ', fee: '1' };
export const signingResourcesSchema = z.object({ fee: z.string().regex(/^[1-9]\d*$/), signer_gas_tgas: z.number().int(), callback_gas_tgas: z.number().int(),
  minimumGasTgas: z.number().int(), codeHash: z.string(), version: z.string(), block: z.string(), config: z.unknown(),
  depositSource: z.literal('verified-release-bytecode') });
export type SigningResources = z.infer<typeof signingResourcesSchema>;

export function assertSigningResources(resources: Pick<SigningResources, 'fee' | 'signer_gas_tgas' | 'callback_gas_tgas'>, minimumGasTgas: number, minimumFee: string) {
  const { fee, signer_gas_tgas: gas, callback_gas_tgas: callback } = resources;
  if (BigInt(fee) < BigInt(minimumFee) || BigInt(fee) > 10n ** 22n || gas < minimumGasTgas || gas < 10 || gas > 250 || callback < 10 || callback > 30 || gas + callback + 25 > 300)
    throw new Error('Policy live signer fee/gas incompatible with 300 Tgas and zero-deposit subsidy; STOP before key deletion');
}

/** Only finalized public reads. Unknown signer bytecode fails closed, including fee changes. */
export async function readSigningResources(client: PublicClient): Promise<SigningResources> {
  const configuration = await client.view('v1.signer', 'config');
  const [account, version] = await Promise.all([
    client.rpc('query', { request_type: 'view_account', account_id: 'v1.signer', block_id: configuration.block }),
    client.view('v1.signer', 'version', {}, configuration.block),
  ]);
  const code = z.object({ block_hash: z.literal(configuration.block), code_hash: z.literal(SIGNER_RELEASE.codeHash) }).safeParse(account);
  if (!code.success || version.value !== SIGNER_RELEASE.version) throw new Error('Policy unknown live v1.signer release/deposit; STOP and independently verify new bytecode');
  const config = z.object({ sign_call_gas_attachment_requirement_tera_gas: z.number().int().positive() }).parse(configuration.value);
  // Keep the contract defaults when compatible; do not guess smaller callback budgets.
  const resources: SigningResources = { fee: SIGNER_RELEASE.fee, signer_gas_tgas: 230, callback_gas_tgas: 30,
    minimumGasTgas: config.sign_call_gas_attachment_requirement_tera_gas, codeHash: code.data.code_hash,
    version: SIGNER_RELEASE.version, block: configuration.block, config: configuration.value, depositSource: 'verified-release-bytecode' };
  assertSigningResources(resources, resources.minimumGasTgas, SIGNER_RELEASE.fee);
  return resources;
}
