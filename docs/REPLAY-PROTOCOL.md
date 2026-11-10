# Hedged + cross-venue rebalance protocol

Revision 2026-11-10: aligned with implemented contract rules after the blind reviews. Earlier performance reports are superseded; the same candidate grid is rerun with corrected accounting.

This fixture and its prior reports have already been observed. This is a retrospective
chronological holdout, not a prospective or untouched experiment. Do not revise this
candidate grid, objective, sizing, costs or latency in response to holdout results.

- First 2,160 hours (90 days) select parameters; last 2,160 hours are OOS. Pass a
  physically truncated array, including only the 24 prior warm-up hours, to selection.
  Reject missing hours. Freeze the selected rule before any OOS/full evaluation.
- Three deliberately coarse symmetric bands, expressed as H / current short notional:
  (lower trigger, target, upper trigger) = (0.20, 0.50, 0.80),
  (0.30, 0.60, 0.90), (0.40, 0.70, 1.00). No other search.
  Select maximum training net return on ALL $5,700 committed capital at the $2,500
  spot size among candidates with zero maintenance breaches and positive venue equity.
  Ties prefer earlier grid order. All-in costs included. If none qualifies, fail closed.
- Start each run independently at the first open with equal spot/short NEAR, rounded
  down to venue precision, capped by spot target dollars on both reference prices.
  Require existing entry data/depth/funding/leverage/minimum-order gates. No funding
  timing/exit optimization and no re-entry after a full unwind. Funding of either sign
  is carried while hedged. Unused cash earns zero. All periods pay fresh setup/exit costs;
  period results are not additive. Full window uses the frozen winner throughout.
- H = venue equity - $0.10 fee reserve - ceil_micro(short quantity × ceil_micro(price × 1.01)). Bands and minimum H use that upper-band notional, matching contract arithmetic. Maintenance under a further 50% shock is retained only as a diagnostic. Observe completed closes, submit next open. On low
  trigger sell k spot NEAR and reduce the short by exactly k at that open. Solve the
  smallest lot that restores target H/notional after net proceeds arrive, including
  fees; round toward safety and reject overshoots outside the upper band. In-transit proceeds earn nothing and are NOT venue margin.
  Require the remaining position to retain H >= 10% notional during transfer, otherwise
  increase the reduction or fully unwind if the target cannot be restored.
- Excess margin remains at the venue while any short is reserved: contract `ERR_OPEN_SHORT` forbids withdrawals in that state. This replay does not reopen after closing, so it has no reverse withdrawals or additions. A future reverse strategy must fully close, wait for authorization expiry and finalized owner settlement, withdraw within action/rolling caps, reconcile arrival, acquire actual spot, and pass funded re-entry gates.
- Caps use the same rules, parameterized by portfolio. Research defaults: maximum short = initial owned quantity, per-order upper-band notional = 1.01 × target dollars, rolling-24h open cap = 2.02 × target dollars, cooldown = 60 seconds, sale/mismatch caps = initial quantity per action and rolling day, minimum residual equity $1. These are research limits, not the proposed deployment's 1 NEAR / $10 order / $20 day. `policyLimits` can supply deployment caps; explicit cap fixtures and real contract calls are compared in the cross-layer regression. Owner fill/finality attestations are assumed available before each paired sale; signatures alone release nothing.
- Fixed route latency: one full hour after submission (not after signal). A close signal
  at t submits at the next open t and arrives at t+1h. One outstanding route only.
  Arrival accounting precedes that open's decisions; funding is credited only for quantity
  held both before and after open actions (no funding on newly added or removed quantity). Positive hourly funding is
  excluded from adverse-high safety checks because its intra-hour ordering is unknown.
- Emergency: close H < 10% notional or adverse-high H < 0 schedules full unwind next
  open, including during latency. Recheck open safety before discretionary action.
  All closes are paired; pending cash remains owned and is returned on route completion.
  At fixed horizon cancel discretionary new transfers, close both legs at final close,
  and include remaining transit at face value (disclose it). No fictitious instant margin.
  Negative observed venue equity makes replay infeasible and throws; do not floor it,
  finance it from spot, or credit impossible unwind fills. Hourly OHLC cannot guarantee
  intrabar solvency: breach counts/high-stress diagnostics are proxies, not liquidation fills.
- Costs are frozen planning assumptions: each spot conversion pays 0.25% 1Click +
  0.0001% protocol + 5bp slippage; each perp adjustment 4.5bp taker + 5bp slippage;
  three signing actions per rebalance at $0.02 (spot route, perp, top-up).
  Initial margin route pays 0.2501%;
  setup/terminal planning overhead $6 (including a $1 allowance for a later capped margin withdrawal, not an executed transfer); entry/exit signing $0.04 each. Route fees are charged
  once on the combined spot-sale-to-margin route, not twice. No quotes or latency measurements are implied.
- All capital: $25/$30/$20, $2,500/$3,000/$200, $25,000/$30,000/$2,000
  (spot/margin/operating). Spot-only uses spot + operating and also reports the common
  hedged-envelope return with margin idle. Simple annual % = return * 8,760 / hours.
  Drawdown includes costs at hourly opens/closes from initial capital. End position is
  just before scheduled terminal liquidation; actual final position is zero.
- Comparators retain original/reentry policies for audit; always-hedged bypasses all
  safety gates and is theoretical carry accounting with unfunded losses/breaches shown.
  Spot-only holds directional NEAR. Largest survived moves are maximum positive rolling
  1h/24h perp close returns with endpoints in-period and continuously hedged throughout,
  and no maintenance breach in those hours (earliest tie); show independent spot move.
  They are observed moves, not a guarantee of a future stress limit.

Regression tests pin all numeric comparison/cost fields, candidate scores, exact reports,
causal future perturbation, delayed top-ups, forbidden open-short withdrawals, rounding/caps, emergency
unwind and insolvent-path rejection. Replay/selection are offline, keyless and deterministic.
The legacy re-entry rule remains selected on training among N=6,12,24 as before; it is
an audit comparator and never selects rebalance parameters.
