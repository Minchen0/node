'use strict';

const common = require('../common');
const assert = require('assert');
const tick = require('./tick');
const initHooks = require('./init-hooks');
const { checkInvocations } = require('./hook-checks');
const dns = require('dns');

const hooks = initHooks();

hooks.enable();
dns.lookupService('127.0.0.1', 80, common.mustCall(onlookupService));
function onlookupService(err_, ip, family) {
  // we don't care about the error here in order to allow
  // tests to run offline (lookup will fail in that case and the err be set)

  const as = hooks.activitiesOfTypes('GETNAMEINFOREQWRAP');
  assert.strictEqual(as.length, 1, 'one activity');

  const a = as[0];
  assert.strictEqual(a.type, 'GETNAMEINFOREQWRAP', 'getnameinforeq wrap');
  assert.strictEqual(typeof a.uid, 'number', 'uid is a number');
  assert.strictEqual(a.triggerId, 1, 'parent uid 1');
  checkInvocations(a, { init: 1, before: 1 },
                   'while in onlookupService callback');
  tick(2);
}

process.on('exit', onexit);

function onexit() {
  hooks.disable();
  hooks.sanityCheck('GETNAMEINFOREQWRAP');

  const as = hooks.activitiesOfTypes('GETNAMEINFOREQWRAP');
  const a = as[0];
  checkInvocations(a, { init: 1, before: 1, after: 1, destroy: 1 },
                   'when process exits');
}
