import assert from 'node:assert/strict';

function calcUptimePercent(history = []) {
  if (!history.length) return undefined;
  const up = history.filter((h) => h.status === 'online' || h.status === 'degraded').length;
  return Math.round((up / history.length) * 1000) / 10;
}

assert.equal(calcUptimePercent([]), undefined);
assert.equal(
  calcUptimePercent([
    { at: '1', status: 'online' },
    { at: '2', status: 'online' },
    { at: '3', status: 'offline' },
    { at: '4', status: 'degraded' },
  ]),
  75
);
assert.equal(calcUptimePercent([{ at: '1', status: 'offline' }]), 0);

console.log('uptime tests passed');
