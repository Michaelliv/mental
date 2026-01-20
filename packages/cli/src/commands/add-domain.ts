/**
 * Add domain command - supports both interactive and non-interactive modes
 *
 * This is a thin wrapper around the pure createDomainEvent function.
 * It handles CLI concerns (interactive prompts, output formatting)
 * while delegating business logic to the shared package.
 */

import * as p from '@clack/prompts';
import { isInteractive, hasAllArgs } from '../lib/interactive';
import { createFileStorage, type Storage } from '../lib/storage';
import { createDomainEvent, type AddDomainInput } from '@mentalmodel/shared';

interface AddDomainOptions {
  description?: string;
  desc?: string; // alias
  references?: string;
  refs?: string; // alias
  files?: string;
  json?: boolean;
}

export async function addDomain(
  name: string | undefined,
  options: AddDomainOptions,
  storageOrCommand?: Storage | unknown
): Promise<void> {
  // Handle Commander passing Command object as third argument
  const storage: Storage =
    storageOrCommand && typeof (storageOrCommand as Storage).readModel === 'function'
      ? (storageOrCommand as Storage)
      : createFileStorage();
  // Normalize aliases
  const description = options.description || options.desc;
  const references = options.references || options.refs;
  const files = options.files;

  // Check if we have all required args
  const hasAll = hasAllArgs({ name, description }, ['name', 'description']);
  const interactive = isInteractive(options) && !hasAll;

  let domainName = name;
  let domainDesc = description;
  let domainRefs = references;
  let domainFiles = files;

  if (interactive) {
    // Interactive mode - use Clack prompts
    p.intro('Add a domain');

    if (!domainName) {
      const nameInput = await p.text({
        message: 'Domain name:',
        placeholder: 'Order',
        validate(value) {
          if (!value) return 'Name is required';
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
            return 'Name must be PascalCase (e.g., Order, UserProfile)';
          }
        },
      });

      if (p.isCancel(nameInput)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }

      domainName = nameInput as string;
    }

    if (!domainDesc) {
      const descInput = await p.text({
        message: 'Description:',
        placeholder: 'A purchase transaction',
        validate(value) {
          if (!value) return 'Description is required';
        },
      });

      if (p.isCancel(descInput)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }

      domainDesc = descInput as string;
    }

    if (!domainRefs) {
      const refsInput = await p.text({
        message: 'References (comma-separated, optional):',
        placeholder: 'User, Account',
      });

      if (!p.isCancel(refsInput) && refsInput) {
        domainRefs = refsInput as string;
      }
    }

    if (!domainFiles) {
      const filesInput = await p.text({
        message: 'Files (comma-separated, optional):',
        placeholder: 'src/models/order.ts, src/types/order.ts',
      });

      if (!p.isCancel(filesInput) && filesInput) {
        domainFiles = filesInput as string;
      }
    }
  } else {
    // Non-interactive mode - validate required args
    if (!domainName || !domainDesc) {
      console.error('Error: --desc is required in non-interactive mode');
      console.error('Usage: mental add domain <name> --desc "description"');
      process.exit(1);
    }
  }

  // Build input for pure command function
  const input: AddDomainInput = {
    name: domainName!,
    description: domainDesc!,
  };

  if (domainRefs) {
    input.references = domainRefs.split(',').map((r) => r.trim());
  }

  if (domainFiles) {
    input.files = domainFiles.split(',').map((f) => f.trim());
  }

  // Use pure command function
  const model = storage.readModel();
  const result = createDomainEvent(model, input);

  if (!result.ok) {
    if (interactive) {
      p.cancel(result.error);
      process.exit(1);
    } else {
      console.error(`Error: ${result.error}`);
      process.exit(1);
    }
  }

  // Persist the event
  storage.appendEvent(result.event);

  // Output
  if (options.json) {
    console.log(JSON.stringify({ success: true, domain: result.event.payload }));
  } else if (interactive) {
    p.outro(`Added domain "${domainName}"`);
  } else {
    console.log(`Added domain "${domainName}"`);
  }
}
