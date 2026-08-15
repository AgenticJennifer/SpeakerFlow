const assert = require('node:assert');
const { describe, it } = require('node:test');
const pkg = require('../package.json');

describe('Frontend basic tests', () => {
  it('should have basic test infrastructure', () => {
    assert.strictEqual(1 + 1, 2);
  });

  it('should have expected package structure', () => {
    assert.ok(pkg.name);
    assert.ok(pkg.version);
    assert.ok(pkg.scripts);
    assert.ok(pkg.scripts.test || pkg.scripts.lint);
  });
});
