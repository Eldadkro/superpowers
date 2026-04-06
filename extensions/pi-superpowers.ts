import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const superpowersRoot = path.resolve(__dirname, '..');
const usingSuperpowersSkillPath = path.join(
  superpowersRoot,
  'skills',
  'using-superpowers',
  'SKILL.md'
);

function extractAndStripFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content };

  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx <= 0) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
    frontmatter[key] = value;
  }

  return { frontmatter, content: match[2] };
}

function getBootstrapContent() {
  if (!fs.existsSync(usingSuperpowersSkillPath)) return null;

  const fullContent = fs.readFileSync(usingSuperpowersSkillPath, 'utf8');
  const { content } = extractAndStripFrontmatter(fullContent);

  const toolMapping = `**Tool Mapping for Pi:**
When skills reference tools you don't have, substitute Pi equivalents:
- \`Skill\` tool → Skills are installed locally. Follow matching skills directly, or use \`/skill:name\` to force-load one.
- \`Read\`, \`Write\`, \`Edit\`, \`Bash\` → Use Pi's native tools.
- \`TodoWrite\` → Pi has no built-in task tracker. Track checklist progress in the plan file or a local TODO.md.
- \`Task\` tool with subagents → Pi has no built-in subagents. Work sequentially in this session unless the user installed a subagent extension/package.

If a superpowers skill assumes a missing Pi feature, preserve the workflow intent and use the closest native Pi mechanism.`;

  return `<EXTREMELY_IMPORTANT>
You have superpowers.

**IMPORTANT: The using-superpowers skill content is included below. It is ALREADY LOADED - do NOT try to load \"using-superpowers\" again. Use skill loading only for other skills.**

${content}

${toolMapping}
</EXTREMELY_IMPORTANT>`;
}

export default function superpowersForPi(pi) {
  pi.on('before_agent_start', async (_event, ctx) => {
    const alreadyBootstrapped = ctx.sessionManager.getBranch().some((entry) => {
      return entry.type === 'custom' && entry.customType === 'superpowers-bootstrap-installed';
    });

    if (alreadyBootstrapped) return;

    const bootstrap = getBootstrapContent();
    if (!bootstrap) return;

    pi.appendEntry('superpowers-bootstrap-installed', {
      installedAt: Date.now(),
      extension: 'pi-superpowers',
    });

    return {
      message: {
        customType: 'superpowers-bootstrap',
        content: bootstrap,
        display: false,
      },
    };
  });
}
