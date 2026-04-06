import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractAndStripFrontmatter,
  buildPiBootstrapMessage,
} from '../../extensions/pi-superpowers.ts';

test('extractAndStripFrontmatter removes YAML frontmatter and keeps body', () => {
  const input = `---\nname: using-superpowers\ndescription: demo\n---\n# Body\n`;
  const result = extractAndStripFrontmatter(input);

  assert.equal(result.content, '# Body\n');
  assert.equal(result.frontmatter.name, 'using-superpowers');
});

test('buildPiBootstrapMessage wraps stripped skill content with Pi tool mapping', () => {
  const message = buildPiBootstrapMessage('# Skill body');

  assert.match(message, /You have superpowers\./);
  assert.match(message, /\*\*Tool Mapping for Pi:\*\*/);
  assert.match(message, /# Skill body/);
});
