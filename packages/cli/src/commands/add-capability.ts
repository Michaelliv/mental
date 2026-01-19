/**
 * Add capability command
 */

import * as p from '@clack/prompts';
import { isInteractive, hasAllArgs } from '../lib/interactive';
import { appendEntity, readModel } from '../lib/storage';
import type { Capability } from '@mentalmodel/shared';

interface AddCapabilityOptions {
  description?: string;
  desc?: string;
  operatesOn?: string;
  'operates-on'?: string;
  composes?: string;
  files?: string;
  json?: boolean;
}

export async function addCapability(
  name: string | undefined,
  options: AddCapabilityOptions
): Promise<void> {
  const description = options.description || options.desc;
  const operatesOn = options.operatesOn || options['operates-on'];
  const composes = options.composes;
  const files = options.files;

  const hasAll = hasAllArgs({ name, description }, ['name', 'description']);
  const interactive = isInteractive(options) && !hasAll;

  let capName = name;
  let capDesc = description;
  let capOperatesOn = operatesOn;
  let capComposes = composes;
  let capFiles = files;

  if (interactive) {
    p.intro('Add a capability');

    if (!capName) {
      const nameInput = await p.text({
        message: 'Capability name:',
        placeholder: 'Checkout',
        validate(value) {
          if (!value) return 'Name is required';
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
            return 'Name must be PascalCase (e.g., Checkout, ProcessPayment)';
          }
        },
      });
      if (p.isCancel(nameInput)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }
      capName = nameInput as string;
    }

    if (!capDesc) {
      const descInput = await p.text({
        message: 'Description:',
        placeholder: 'Completes a purchase',
        validate(value) {
          if (!value) return 'Description is required';
        },
      });
      if (p.isCancel(descInput)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }
      capDesc = descInput as string;
    }

    if (!capOperatesOn) {
      const opsInput = await p.text({
        message: 'Operates on domains (comma-separated, optional):',
        placeholder: 'Order, User',
      });
      if (!p.isCancel(opsInput) && opsInput) {
        capOperatesOn = opsInput as string;
      }
    }

    if (!capComposes) {
      const composesInput = await p.text({
        message: 'Composes capabilities (comma-separated, optional):',
        placeholder: 'Payment, Inventory',
      });
      if (!p.isCancel(composesInput) && composesInput) {
        capComposes = composesInput as string;
      }
    }

    if (!capFiles) {
      const filesInput = await p.text({
        message: 'Files (comma-separated, optional):',
        placeholder: 'src/flows/checkout.ts',
      });
      if (!p.isCancel(filesInput) && filesInput) {
        capFiles = filesInput as string;
      }
    }
  } else {
    if (!capName || !capDesc) {
      console.error('Error: --desc is required in non-interactive mode');
      console.error('Usage: mental add capability <name> --desc "description"');
      process.exit(1);
    }
  }

  const model = readModel();
  if (model.capabilities[capName!]) {
    const error = `Capability "${capName}" already exists`;
    if (interactive) {
      p.cancel(error);
    } else {
      console.error(`Error: ${error}`);
    }
    process.exit(1);
  }

  const capability: Capability = {
    name: capName!,
    description: capDesc!,
  };

  if (capOperatesOn) {
    capability.operates_on = capOperatesOn.split(',').map((d) => d.trim());
  }

  if (capComposes) {
    capability.composes = capComposes.split(',').map((c) => c.trim());
  }

  if (capFiles) {
    capability.files = capFiles.split(',').map((f) => f.trim());
  }

  appendEntity('capability', capability);

  if (options.json) {
    console.log(JSON.stringify({ success: true, capability }));
  } else if (interactive) {
    p.outro(`✓ Added capability "${capName}"`);
  } else {
    console.log(`✓ Added capability "${capName}"`);
  }
}
