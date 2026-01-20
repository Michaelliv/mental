/**
 * Add decision command
 *
 * This is a thin wrapper around the pure createDecisionEvent function.
 */

import * as p from '@clack/prompts';
import { isInteractive, hasAllArgs } from '../lib/interactive';
import { createFileStorage, type Storage } from '../lib/storage';
import { createDecisionEvent, type AddDecisionInput } from '@mentalmodel/shared';
import type { Decision } from '@mentalmodel/shared';

interface AddDecisionOptions {
  why?: string;
  context?: string;
  relates?: string;
  relatesTo?: string;
  docs?: string;
  json?: boolean;
}

export async function addDecision(
  what: string | undefined,
  options: AddDecisionOptions,
  storageOrCommand?: Storage | unknown
): Promise<void> {
  // Handle Commander passing Command object as third argument
  const storage: Storage =
    storageOrCommand && typeof (storageOrCommand as Storage).readModel === 'function'
      ? (storageOrCommand as Storage)
      : createFileStorage();
  const why = options.why;
  const context = options.context;
  const relatesTo = options.relates || options.relatesTo;
  const docs = options.docs;

  const hasAll = hasAllArgs({ what, why }, ['what', 'why']);
  const interactive = isInteractive(options) && !hasAll;

  let decWhat = what;
  let decWhy = why;
  let decContext = context;
  let decRelatesTo = relatesTo;
  let decDocs = docs;

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

    if (!decContext) {
      const contextInput = await p.text({
        message: 'Context (optional - what was true when this decision was made?):',
        placeholder: 'Small team, familiar with SQL, needed ACID compliance',
      });
      if (!p.isCancel(contextInput) && contextInput) {
        decContext = contextInput as string;
      }
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

    if (!decDocs) {
      const docsInput = await p.text({
        message: 'Related docs (comma-separated paths or URLs):',
        placeholder: 'docs/adr/database.md,https://notion.so/analysis',
      });
      if (!p.isCancel(docsInput) && docsInput) {
        decDocs = docsInput as string;
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

  // Parse docs into array
  const docsArray = decDocs
    ? decDocs.split(',').map((d) => d.trim()).filter((d) => d.length > 0)
    : undefined;

  // Build input for pure command function
  const input: AddDecisionInput = {
    what: decWhat!,
    why: decWhy!,
    ...(decContext && { context: decContext }),
    relates_to,
    ...(docsArray && docsArray.length > 0 && { docs: docsArray }),
  };

  // Use pure command function
  const model = storage.readModel();
  const result = createDecisionEvent(model, input);

  if (!result.ok) {
    if (interactive) {
      p.cancel(result.error);
    } else {
      console.error(`Error: ${result.error}`);
    }
    process.exit(1);
  }

  // Persist the event
  storage.appendEvent(result.event);

  // Get the decision ID from the event payload
  const decision = result.event.payload as Decision;

  if (options.json) {
    console.log(JSON.stringify({ success: true, decision }));
  } else if (interactive) {
    p.outro(`Added decision (ID: ${decision.id})`);
  } else {
    console.log(`Added decision (ID: ${decision.id})`);
  }
}
