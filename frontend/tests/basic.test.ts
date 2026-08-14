import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Frontend basic tests', () => {
  it('should have basic test infrastructure', () => {
    assert.strictEqual(1 + 1, 2);
  });

  it('should have expected package structure', () => {
    const pkg = require('../package.json');
    assert.ok(pkg.name);
    assert.ok(pkg.version);
    assert.ok(pkg.scripts);
    assert.ok(pkg.scripts.test || pkg.scripts.lint);
  });
});