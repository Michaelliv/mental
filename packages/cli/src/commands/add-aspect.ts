/**
 * Add aspect command
 *
 * This is a thin wrapper around the pure createAspectEvent function.
 */

import * as p from '@clack/prompts';
import { isInteractive, hasAllArgs } from '../lib/interactive';
import { createFileStorage, type Storage } from '../lib/storage';
import { createAspectEvent, type AddAspectInput } from '@mentalmodel/shared';

interface AddAspectOptions {
  description?: string;
  desc?: string;
  appliesTo?: string;
  'applies-to'?: string;
  files?: string;
  json?: boolean;
}

export async function addAspect(
  name: string | undefined,
  options: AddAspectOptions,
  storageOrCommand?: Storage | unknown
): Promise<void> {
  // Handle Commander passing Command object as third argument
  const storage: Storage =
    storageOrCommand && typeof (storageOrCommand as Storage).readModel === 'function'
      ? (storageOrCommand as Storage)
      : createFileStorage();
  const description = options.description || options.desc;
  const appliesTo = options.appliesTo || options['applies-to'];
  const files = options.files;

  const hasAll = hasAllArgs({ name, description }, ['name', 'description']);
  const interactive = isInteractive(options) && !hasAll;

  let aspectName = name;
  let aspectDesc = description;
  let aspectAppliesTo = appliesTo;
  let aspectFiles = files;

  if (interactive) {
    p.intro('Add an aspect');

    if (!aspectName) {
      const nameInput = await p.text({
        message: 'Aspect name:',
        placeholder: 'Auth',
        validate(value) {
          if (!value) return 'Name is required';
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
            return 'Name must be PascalCase (e.g., Auth, Logging)';
          }
        },
      });
      if (p.isCancel(nameInput)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }
      aspectName = nameInput as string;
    }

    if (!aspectDesc) {
      const descInput = await p.text({
        message: 'Description:',
        placeholder: 'Authentication and authorization',
        validate(value) {
          if (!value) return 'Description is required';
        },
      });
      if (p.isCancel(descInput)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }
      aspectDesc = descInput as string;
    }

    if (!aspectAppliesTo) {
      const appliesInput = await p.text({
        message: 'Applies to capabilities (comma-separated, optional):',
        placeholder: 'Checkout, AccountSettings',
      });
      if (!p.isCancel(appliesInput) && appliesInput) {
        aspectAppliesTo = appliesInput as string;
      }
    }

    if (!aspectFiles) {
      const filesInput = await p.text({
        message: 'Files (comma-separated, optional):',
        placeholder: 'src/middleware/auth.ts',
      });
      if (!p.isCancel(filesInput) && filesInput) {
        aspectFiles = filesInput as string;
      }
    }
  } else {
    if (!aspectName || !aspectDesc) {
      console.error('Error: --desc is required in non-interactive mode');
      console.error('Usage: mental add aspect <name> --desc "description"');
      process.exit(1);
    }
  }

  // Build input for pure command function
  const input: AddAspectInput = {
    name: aspectName!,
    description: aspectDesc!,
  };

  if (aspectAppliesTo) {
    input.applies_to = {
      capabilities: aspectAppliesTo.split(',').map((c) => c.trim()),
    };
  }

  if (aspectFiles) {
    input.files = aspectFiles.split(',').map((f) => f.trim());
  }

  // Use pure command function
  const model = storage.readModel();
  const result = createAspectEvent(model, input);

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

  if (options.json) {
    console.log(JSON.stringify({ success: true, aspect: result.event.payload }));
  } else if (interactive) {
    p.outro(`Added aspect "${aspectName}"`);
  } else {
    console.log(`Added aspect "${aspectName}"`);
  }
}
