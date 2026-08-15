const assert = require('node:assert');
const { describe, it } = require('node:test');

describe('Backend basic tests', () => {
  it('should have basic test infrastructure', () => {
    assert.strictEqual(1 + 1, 2);
  });

  it('should load field constants', () => {
    const { FIELDS, STATUS, DECIDED_STATUSES } = require('../constants/fields');
    assert.strictEqual(FIELDS.NAME, 'Name');
    assert.strictEqual(STATUS.ACCEPTED, 'Accepted');
    assert.ok(DECIDED_STATUSES.includes(STATUS.ACCEPTED));
  });

  it('should expose Airtable model operations', () => {
    const airtable = require('../models/airtable');
    assert.strictEqual(typeof airtable.createSpeakerSubmission, 'function');
    assert.strictEqual(typeof airtable.listSubmissions, 'function');
  });
});
