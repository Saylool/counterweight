import { assetUrl } from "./data";

/** Dated public evidence, separate from the live testnet inspection tools. */
export const mainnetProof = {
  account: "cw4.haxheton.near",
  address: "0xb6a1d45ba9154067b7981e2b4b676393c75b0d26",
  open: {
    near: "J9ckn6RCUva3eamTSpLBkXQGKipovq8199V6E55SR3aU",
    venue: "0xa768851a0c51f57aa8e20448c6ec5002045500ffa755144c4b31306ccb55cf65",
  },
  close: {
    near: "5Nu3jXF6boa7H9ddFMc2XhD6bMiVDesCyC2vgyVzsFTN",
    venue: "0x2fad11edb3ade83731260448c6f1560201f400d34ea10709d375bd4072a1c221",
  },
  arrival: "0x6a6ff973ef4558eaab8afc9a8e63c968bde1a08f7713428dc9ed227f771eb07d",
  recipient: "0xb1af8b1d316e111c10fe6a2eb3b7b747ec37f36a",
};

export function MainnetLifecycle() {
  const proof = mainnetProof;
  return <>
    <p>
      On 14 November 2026, keyless v4 held 3.6 wNEAR on NEAR mainnet,
      opened and closed a real 3.6 NEAR short on Hyperliquid mainnet,
      and withdrew USDC to Arbitrum One. Owner settlement and reconciliation
      completed, spot was returned, and the recorded final status was flat.
    </p>
    <div className="table-scroll" role="region" aria-label="V4 mainnet proof" tabIndex={0}>
      <table>
        <caption>14 November 2026 · recorded mainnet lifecycle</caption>
        <thead><tr><th scope="col">Proof</th><th scope="col">Recorded result</th><th scope="col">Public explorer</th></tr></thead>
        <tbody>
          <tr><th scope="row">Keyless NEAR policy</th><td><code>{proof.account}</code> · 0 access keys</td>
            <td><a href={`https://nearblocks.io/address/${proof.account}#keys`}>Account &amp; keys ↗</a></td></tr>
          <tr><th scope="row">Open short</th><td>3.6 NEAR @ 3.3241 USDC</td>
            <td><a href={`https://nearblocks.io/txns/${proof.open.near}`}>NEAR authorization ↗</a>{" · "}<a href={`https://app.hyperliquid.xyz/explorer/tx/${proof.open.venue}`}>Hyperliquid fill ↗</a></td></tr>
          <tr><th scope="row">Reduce-only close</th><td>3.6 NEAR @ 3.3248 USDC</td>
            <td><a href={`https://nearblocks.io/txns/${proof.close.near}`}>NEAR authorization ↗</a>{" · "}<a href={`https://app.hyperliquid.xyz/explorer/tx/${proof.close.venue}`}>Hyperliquid fill ↗</a></td></tr>
          <tr><th scope="row">Arbitrum One arrival</th><td>17.886709 native USDC · 18.886709 gross withdrawal, 1 USDC bridge fee</td>
            <td><a href={`https://arbiscan.io/tx/${proof.arrival}`}>USDC transfer ↗</a></td></tr>
        </tbody>
      </table>
    </div>
    <p className="source-note">Derived Hyperliquid mainnet address: <a href={`https://app.hyperliquid.xyz/explorer/address/${proof.address}`}><code>{proof.address}</code> ↗</a>.<br />
      Arbitrum recipient: <code>{proof.recipient}</code>.
      {" "}<a href={assetUrl("evidence/2026-11-14-v4-mainnet-lifecycle-summary.md")}>Full lifecycle, incidents &amp; verification limits ↗</a>
      {" · "}<a href={assetUrl("data/lifecycle-v4.json")}>Verification JSON ↗</a>.
      These are dated evidence records; this section does not continuously monitor mainnet.
    </p>
    <p>One owner-supervised lifecycle at tiny size; unaudited, with no autonomous mainnet keeper or multi-day carry proof.
      Approximately 0.011 USDC trading fees, 0.0025 USDC trading loss, and 1 USDC bridge fee;
      1.1 USDC remains in perps under policy, another 1 USDC remains in spot, and about 7 NEAR remains locked in the keyless policy.
      The funding ledger also records a separate 1 USDC send fee; NEAR gas and owner labor are additional.</p>
    <details><summary>Tooling incidents &amp; remaining limits</summary>
      <p>Three tooling stops preceded the successful open, with no order sent: fractional observed_at_ms rejected by the contract,
        an over-strict host-clock guard, and a 3.2823 opening signature refused by the relay because it expected 3.2827.
        That unused signature expired and was settled. The keeper needed 0.7 NEAR because a 285–300 Tgas call
        requires about 0.3 NEAR prepaid gas on mainnet. A public-RPC outage delayed withdrawal relay by a few minutes.</p>
      <p>V4 serializes concurrent exits and caps lifetime public subsidy. Unauthenticated exit marks,
        owner attestations and settlement, MPC and venue availability, and IOC fill risk remain.
        Versions v1–v3 below are testnet evidence.</p>
    </details>
  </>;
}
