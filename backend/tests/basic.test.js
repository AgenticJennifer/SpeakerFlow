const assert = require('node:assert');
const { describe, it } = require('node:test');

describe('Backend basic tests', () => {
  it('should have basic test infrastructure', () => {
    assert.strictEqual(1 + 1, 2);
  });

  it('should load constants', () => {
    const fields = require('../constants/fields');
    assert.ok(fields);
    assert.ok(Array.isArray(fields.speakerFields));
  });

  it('should load models', () => {
    const Airtable = require('../models/airtable');
    assert.ok(typeof Airtable === 'function');
  });
});