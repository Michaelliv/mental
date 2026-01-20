import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface OnboardOptions {
  force?: boolean;
  global?: boolean;
}

const MENTAL_SECTION = `<mental>
Use \`mental\` to maintain the mental model as you work on the codebase.

<commands>
- \`mental add domain <name>\` - Add a domain (core business concept)
- \`mental add capability <name>\` - Add a capability (what the system does)
- \`mental add aspect <name>\` - Add an aspect (cross-cutting concern)
- \`mental add decision <what> --why <reason>\` - Record a decision
- \`mental show\` - Display the current model
- \`mental view\` - Open interactive visualization
</commands>

<when-to-use>
- After adding a new feature or module
- After making an architectural decision
- When introducing a new domain concept
- When adding cross-cutting concerns (auth, logging, caching)
- When the user asks to update the mental model
</when-to-use>

<guidelines>
- Domains are nouns (User, Order, Payment)
- Capabilities are verbs (Checkout, ProcessPayment, SendNotification)
- Aspects apply across capabilities (Auth, Validation, RateLimit)
- Decisions capture the "why" behind choices
- Link decisions to related entities with --relates-to
- Attach documentation with --docs (local paths or URLs)
</guidelines>
</mental>
`;

const START_TAG = '<mental>';
const END_TAG = '</mental>';

export function onboard(options: OnboardOptions = {}): void {
  let targetFile: string;

  if (options.global) {
    const claudeDir = join(homedir(), '.claude');
    if (!existsSync(claudeDir)) {
      mkdirSync(claudeDir, { recursive: true });
    }
    targetFile = join(claudeDir, 'CLAUDE.md');
  } else {
    // Local: check for existing CLAUDE.md or AGENTS.md in project root
    const cwd = process.cwd();
    const claudeMd = join(cwd, 'CLAUDE.md');
    const agentsMd = join(cwd, 'AGENTS.md');

    if (existsSync(claudeMd)) {
      targetFile = claudeMd;
    } else if (existsSync(agentsMd)) {
      targetFile = agentsMd;
    } else {
      // Default to CLAUDE.md if neither exists
      targetFile = claudeMd;
    }
  }

  let existingContent = '';
  if (existsSync(targetFile)) {
    existingContent = readFileSync(targetFile, 'utf-8');
  }

  const hasSection = existingContent.includes(START_TAG);

  if (hasSection) {
    if (!options.force) {
      console.log(`mental section already exists in ${targetFile}`);
      console.log('Use --force to update it');
      return;
    }
    // Remove existing section for replacement
    const startIndex = existingContent.indexOf(START_TAG);
    const endIndex = existingContent.indexOf(END_TAG);
    if (endIndex !== -1) {
      existingContent =
        existingContent.slice(0, startIndex) +
        existingContent.slice(endIndex + END_TAG.length);
    } else {
      existingContent = existingContent.slice(0, startIndex);
    }
  }

  const newContent = existingContent
    ? existingContent.trimEnd() + '\n\n' + MENTAL_SECTION
    : MENTAL_SECTION;

  writeFileSync(targetFile, newContent);

  const action = hasSection ? 'Updated' : 'Added';
  console.log(`${action} mental section in ${targetFile}`);
}
