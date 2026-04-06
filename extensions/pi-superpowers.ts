import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_MODE = 'normal';
export const SUPER_MODE = 'super';
export const MODE_ENTRY_TYPE = 'superpowers-mode';
export const PENDING_PROMPT_ENTRY_TYPE = 'superpowers-pending-prompt';
export const PENDING_PROMPT_CONSUMED_ENTRY_TYPE = 'superpowers-pending-prompt-consumed';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const superpowersRoot = path.resolve(__dirname, '..');
const skillsPath = path.join(superpowersRoot, 'skills');
const usingSuperpowersSkillPath = path.join(
  skillsPath,
  'using-superpowers',
  'SKILL.md'
);

export function extractAndStripFrontmatter(content) {
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

export function createModeEntry(mode, changedAt = Date.now()) {
  return {
    customType: MODE_ENTRY_TYPE,
    data: { mode, changedAt },
  };
}

export function getLatestModeFromBranch(branch) {
  let mode = DEFAULT_MODE;

  for (const entry of branch) {
    if (entry.type === 'custom' && entry.customType === MODE_ENTRY_TYPE) {
      const candidate = entry.data?.mode;
      if (candidate === DEFAULT_MODE || candidate === SUPER_MODE) mode = candidate;
    }
  }

  return mode;
}

export function getSkillPathsForMode(mode, skillsPath) {
  return mode === SUPER_MODE ? [skillsPath] : [];
}

export function parseSuperCommandArgs(args) {
  const prompt = args.trim();
  return {
    mode: SUPER_MODE,
    prompt: prompt.length > 0 ? prompt : null,
  };
}

export function buildPiBootstrapMessage(skillBody) {
  return `<EXTREMELY_IMPORTANT>\nYou have superpowers.\n\n**IMPORTANT: The using-superpowers skill content is included below. It is ALREADY LOADED - do NOT try to load \"using-superpowers\" again. Use skill loading only for other skills.**\n\n${skillBody}\n\n**Tool Mapping for Pi:**\nWhen skills reference tools you don't have, substitute Pi equivalents:\n- \`Skill\` tool → Skills are installed locally. Follow matching skills directly, or use \`/skill:name\` to force-load one.\n- \`Read\`, \`Write\`, \`Edit\`, \`Bash\` → Use Pi's native tools.\n- \`TodoWrite\` → Pi has no built-in task tracker. Track checklist progress in the plan file or a local TODO.md.\n- \`Task\` tool with subagents → Pi has no built-in subagents. Work sequentially in this session unless the user installed a subagent extension/package.\n\nIf a superpowers skill assumes a missing Pi feature, preserve the workflow intent and use the closest native Pi mechanism.\n</EXTREMELY_IMPORTANT>`;
}

export function getLatestPendingPrompt(branch) {
  let pending = null;
  let consumedAt = -1;

  for (const entry of branch) {
    if (entry.type !== 'custom') continue;
    if (entry.customType === PENDING_PROMPT_ENTRY_TYPE) pending = entry.data;
    if (entry.customType === PENDING_PROMPT_CONSUMED_ENTRY_TYPE) {
      consumedAt = entry.data?.createdAt ?? consumedAt;
    }
  }

  if (!pending) return null;
  return pending.createdAt === consumedAt ? null : pending;
}

function getBootstrapContent() {
  if (!fs.existsSync(usingSuperpowersSkillPath)) return null;

  const fullContent = fs.readFileSync(usingSuperpowersSkillPath, 'utf8');
  const { content } = extractAndStripFrontmatter(fullContent);
  return buildPiBootstrapMessage(content);
}

function applyModeIndicator(ctx, mode) {
  ctx.ui?.setStatus?.('superpowers-mode', mode === SUPER_MODE ? 'SUPER ON' : '');
}

export default function superpowersForPi(pi) {
  let currentMode = DEFAULT_MODE;

  pi.on('session_start', async (_event, ctx) => {
    const branch = ctx.sessionManager.getBranch();
    currentMode = getLatestModeFromBranch(branch);
    applyModeIndicator(ctx, currentMode);

    const pendingPrompt = getLatestPendingPrompt(branch);
    if (currentMode === SUPER_MODE && pendingPrompt) {
      pi.appendEntry(PENDING_PROMPT_CONSUMED_ENTRY_TYPE, { createdAt: pendingPrompt.createdAt });
      pi.sendUserMessage(pendingPrompt.text);
    }
  });

  pi.on('resources_discover', async () => ({
    skillPaths: getSkillPathsForMode(currentMode, skillsPath),
  }));

  pi.on('before_agent_start', async (_event, ctx) => {
    if (currentMode !== SUPER_MODE) return;

    const bootstrap = getBootstrapContent();
    if (!bootstrap) return;

    return {
      message: {
        customType: 'superpowers-bootstrap',
        content: bootstrap,
        display: false,
      },
    };
  });

  pi.registerCommand('super', {
    description: 'Enable Superpowers mode for this session',
    handler: async (args, ctx) => {
      const { prompt } = parseSuperCommandArgs(args ?? '');
      const changedAt = Date.now();

      pi.appendEntry(MODE_ENTRY_TYPE, { mode: SUPER_MODE, changedAt });
      currentMode = SUPER_MODE;

      if (prompt) {
        pi.appendEntry(PENDING_PROMPT_ENTRY_TYPE, { text: prompt, createdAt: changedAt + 1 });
      }

      await ctx.reload();
      return;
    },
  });

  pi.registerCommand('normal', {
    description: 'Disable Superpowers mode for this session',
    handler: async (_args, ctx) => {
      pi.appendEntry(MODE_ENTRY_TYPE, { mode: DEFAULT_MODE, changedAt: Date.now() });
      currentMode = DEFAULT_MODE;
      await ctx.reload();
      return;
    },
  });
}
