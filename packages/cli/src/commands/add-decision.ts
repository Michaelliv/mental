/**
 * Add decision command
 */

import * as p from '@clack/prompts';
import { isInteractive, hasAllArgs } from '../lib/interactive';
import { appendEntity, readModel } from '../lib/storage';
import type { Decision } from '@mentalmodel/shared';

interface AddDecisionOptions {
  why?: string;
  relates?: string;
  'relates-to'?: string;
  json?: boolean;
}

export async function addDecision(
  what: string | undefined,
  options: AddDecisionOptions
): Promise<void> {
  const why = options.why;
  const relatesTo = options.relates || options['relates-to'];

  const hasAll = hasAllArgs({ what, why }, ['what', 'why']);
  const interactive = isInteractive(options) && !hasAll;

  let decWhat = what;
  let decWhy = why;
  let decRelatesTo = relatesTo;

  if (interactive) {
    p.intro('Add a decision');

    if (!decWhat) {
      const whatInput = await p.text({
        message: 'What decision was made?',
        placeholder: 'Soft deletes instead of hard deletes',
        validate(value) {
          if (!value) return 'Decision is required';
        },
      });
      if (p.isCancel(whatInput)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }
      decWhat = whatInput as string;
    }

    if (!decWhy) {
      const whyInput = await p.text({
        message: 'Why was this decision made?',
        placeholder: 'Maintain audit trail and allow recovery',
        validate(value) {
          if (!value) return 'Rationale is required';
        },
      });
      if (p.isCancel(whyInput)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }
      decWhy = whyInput as string;
    }

    if (!decRelatesTo) {
      const relatesInput = await p.text({
        message: 'Relates to (format: domain:Name,capability:Name):',
        placeholder: 'domain:Order,capability:Checkout',
      });
      if (!p.isCancel(relatesInput) && relatesInput) {
        decRelatesTo = relatesInput as string;
      }
    }
  } else {
    if (!decWhat || !decWhy) {
      console.error('Error: --why is required in non-interactive mode');
      console.error('Usage: mental add decision "what" --why "why"');
      process.exit(1);
    }
  }

  // Parse relates_to
  const relates_to: Decision['relates_to'] = {};
  if (decRelatesTo) {
    const parts = decRelatesTo.split(',').map((p) => p.trim());
    for (const part of parts) {
      const [type, name] = part.split(':').map((s) => s.trim());
      if (type === 'domain') {
        relates_to.domains = relates_to.domains || [];
        relates_to.domains.push(name);
      } else if (type === 'capability') {
        relates_to.capabilities = relates_to.capabilities || [];
        relates_to.capabilities.push(name);
      } else if (type === 'aspect') {
        relates_to.aspects = relates_to.aspects || [];
        relates_to.aspects.push(name);
      }
    }
  }

  const decision: Decision = {
    id: `dec-${Date.now()}`,
    what: decWhat!,
    why: decWhy!,
    when: new Date().toISOString(),
    relates_to,
  };

  appendEntity('decision', decision);

  if (options.json) {
    console.log(JSON.stringify({ success: true, decision }));
  } else if (interactive) {
    p.outro(`✓ Added decision (ID: ${decision.id})`);
  } else {
    console.log(`✓ Added decision (ID: ${decision.id})`);
  }
}
