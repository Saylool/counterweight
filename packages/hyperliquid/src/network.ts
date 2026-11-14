import { z } from 'zod';
import type { Network } from './signing.js';

export const MAINNET_API = 'https://api.hyperliquid.xyz';
export function apiForNetwork(network: Network) {
  z.enum(['testnet', 'mainnet']).parse(network);
  return network === 'mainnet' ? MAINNET_API : 'https://api.hyperliquid-testnet.xyz';
}
export function accountForNetwork(value: string, network: Network) {
  z.enum(['testnet', 'mainnet']).parse(network);
  if (!/^(?=.{2,64}$)[a-z0-9]+(?:[-_][a-z0-9]+)*(?:\.[a-z0-9]+(?:[-_][a-z0-9]+)*)*$/.test(value)
    || (network === 'testnet' ? !value.endsWith('.testnet') : value.endsWith('.testnet') || value.endsWith('.test.near')))
    throw new Error(`Expected a named ${network} account`);
  return value;
}
