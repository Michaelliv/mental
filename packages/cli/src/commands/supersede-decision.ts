/**
 * Supersede decision command
 *
 * This is a thin wrapper around the pure createSupersedeDecisionEvents function.
 */

import * as p from '@clack/prompts';
import { isInteractive, hasAllArgs } from '../lib/interactive';
import { createFileStorage, type Storage } from '../lib/storage';
import { createSupersedeDecisionEvents, type SupersedeDecisionInput } from '@mentalmodel/shared';
import type { Decision } from '@mentalmodel/shared';

interface SupersedeDecisionOptions {
  what?: string;
  why?: string;
  context?: string;
  relatesTo?: string;
  json?: boolean;
}

export async function supersedeDecision(
  decisionId: string | undefined,
  options: SupersedeDecisionOptions,
  storageOrCommand?: Storage | unknown
): Promise<void> {
  // Handle Commander passing Command object as third argument
  const storage: Storage =
    storageOrCommand && typeof (storageOrCommand as Storage).readModel === 'function'
      ? (storageOrCommand as Storage)
      : createFileStorage();

  const model = storage.readModel();

  // Require decision ID
  if (!decisionId) {
    console.error('Error: decision ID is required');
    console.error('Usage: mental supersede decision <id> --what "..." --why "..."');
    process.exit(1);
  }

  // Verify decision exists
  const oldDecision = model.decisions[decisionId];
  if (!oldDecision) {
    console.error(`Error: Decision not found: ${decisionId}`);
    process.exit(1);
  }

  const hasAll = hasAllArgs({ what: options.what, why: options.why }, ['what', 'why']);
  const interactive = isInteractive(options) && !hasAll;

  let decWhat = options.what;
  let decWhy = options.why;
  let decContext = options.context;
  let decRelatesTo = options.relatesTo;

  if (interactive) {
    p.intro('Supersede a decision');

    // Show original decision
    p.note(
      `What: ${oldDecision.what}\nWhy: ${oldDecision.why}${oldDecision.context ? `\nContext: ${oldDecision.context}` : ''}`,
      'Original decision'
    );

    if (!decWhat) {
      const whatInput = await p.text({
        message: 'What is the new decision?',
        placeholder: 'Use CockroachDB for horizontal scaling',
        validate(value) {
          if (!value) return 'New decision is required';
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
        message: 'Why are you superseding this decision?',
        placeholder: 'Need horizontal scaling for increased load',
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

    if (!decContext) {
      const contextInput = await p.text({
        message: 'Context (optional - what is true now that makes this change necessary?):',
        placeholder: 'Scaling to 10x users, need distributed database',
      });
      if (!p.isCancel(contextInput) && contextInput) {
        decContext = contextInput as string;
      }
    }

    if (!decRelatesTo) {
      // Ask if they want to keep the same relations
      const keepRelations = await p.confirm({
        message: 'Keep the same entity relations?',
        initialValue: true,
      });
      if (p.isCancel(keepRelations)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }

      if (!keepRelations) {
        const relatesInput = await p.text({
          message: 'Relates to (format: domain:Name,capability:Name):',
          placeholder: 'domain:Order,capability:Checkout',
        });
        if (!p.isCancel(relatesInput) && relatesInput) {
          decRelatesTo = relatesInput as string;
        }
      }
    }
  } else {
    if (!decWhat || !decWhy) {
      console.error('Error: --what and --why are required in non-interactive mode');
      console.error('Usage: mental supersede decision <id> --what "..." --why "..."');
      process.exit(1);
    }
  }

  // Parse relates_to if provided
  let relates_to: Decision['relates_to'] | undefined;
  if (decRelatesTo) {
    relates_to = {};
    const parts = decRelatesTo.split(',').map((part) => part.trim());
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

  // Build input for pure command function
  const input: SupersedeDecisionInput = {
    decisionId,
    what: decWhat!,
    why: decWhy!,
    ...(decContext && { context: decContext }),
    ...(relates_to && { relates_to }),
  };

  // Use pure command function
  const result = createSupersedeDecisionEvents(model, input);

  if (!result.ok) {
    if (interactive) {
      p.cancel(result.error);
    } else {
      console.error(`Error: ${result.error}`);
    }
    process.exit(1);
  }

  // Persist the events
  storage.appendEvents(result.events);

  // Get the new decision ID from the first event (EntityCreated)
  const newDecision = result.events[0].payload as Decision;

  if (options.json) {
    console.log(JSON.stringify({ success: true, oldDecisionId: decisionId, newDecision }));
  } else if (interactive) {
    p.outro(`Superseded ${decisionId} with ${newDecision.id}`);
  } else {
    console.log(`Superseded ${decisionId} with ${newDecision.id}`);
  }
}
