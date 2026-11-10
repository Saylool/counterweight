// Preloaded only by demo:local/test:demo. Fail before DNS or TCP for public hosts.
// Sandbox child processes have no peers configured; Node clients may use loopback only.
const net = require('node:net');
const connect = net.Socket.prototype.connect;
const allowed = new Set(['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0']);
net.Socket.prototype.connect = function (...args) {
  const normalized = Array.isArray(args[0]) ? args[0] : args;
  const first = normalized[0];
  const options = typeof first === 'object' && first !== null ? first : undefined;
  const host = options?.host ?? (typeof first === 'number' && typeof normalized[1] === 'string' ? normalized[1] : 'localhost');
  if (!allowed.has(host)) throw new Error('COUNTERWEIGHT_OFFLINE: public network connections are disabled');
  return connect.apply(this, args);
};
process.env.COUNTERWEIGHT_OFFLINE_GUARD = '1';
