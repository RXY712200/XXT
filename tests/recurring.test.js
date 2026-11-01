import test from 'node:test';
import assert from 'node:assert/strict';
import { createScheduler } from '../src/core/scheduler.js';
import { clock, microtasks } from './support.js';

test('recurring action is bounded, non-overlapping and stale ticks cannot execute a newer deadline', async () => {
  const time = clock(), scheduler = createScheduler(time); let calls = 0, resolve;
  assert.equal(scheduler.recurring({ key: 'monitor', delay: 1, validate: () => true,
    execute: () => { calls++; return new Promise(r => { resolve = r; }); } }), true);
  const oldTick = [...time.timers.values()][0].run;
  time.advance(1); time.advance(100); assert.equal(calls, 1);
  resolve(); await microtasks(); oldTick(); assert.equal(calls, 1);
  time.advance(1); assert.equal(calls, 2); scheduler.cancel('monitor'); resolve(); await microtasks();
  assert.equal(time.timers.size, 0); assert.equal(scheduler.snapshot().length, 1);
  assert.equal(scheduler.recurring({ key: 'monitor', delay: 1 }), false);
});

test('one-shot keys stay single-use after execution/cancellation and recurring invalidation is final', () => {
  const time = clock(), scheduler = createScheduler(time); let calls = 0, valid = true;
  scheduler.request({ key: 'once', delay: 0, validate: () => true, execute: () => calls++ }); time.advance(0);
  assert.equal(scheduler.request({ key: 'once', delay: 0 }), false);
  scheduler.recurring({ key: 'watch', delay: 2, validate: () => valid, execute: () => calls++ });
  time.advance(2); valid = false; time.advance(2); time.advance(20);
  assert.equal(calls, 2); assert.equal(scheduler.snapshot()[1].status, 'invalidated');
  assert.equal(scheduler.request({ key: 'watch', delay: 0 }), false);
});
