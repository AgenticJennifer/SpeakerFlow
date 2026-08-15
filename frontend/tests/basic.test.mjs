import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const pkg = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
);

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
