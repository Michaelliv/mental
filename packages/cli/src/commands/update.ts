/**
 * Update command - updates entities by emitting events
 * - Name changes emit EntityRenamed
 * - Other changes emit EntityUpdated with field-level operations
 *
 * This is a thin wrapper around the pure update functions.
 */

import { createFileStorage, type Storage } from '../lib/storage';
import {
  createUpdateDomainEvents,
  createUpdateCapabilityEvents,
  createUpdateAspectEvents,
  createUpdateDecisionEvents,
} from '@mentalmodel/shared';
import type { Decision } from '@mentalmodel/shared';

interface UpdateDomainOptions {
  name?: string;
  description?: string;
  desc?: string;
  references?: string;
  refs?: string;
  files?: string;
  cascade?: boolean;
  json?: boolean;
}

interface UpdateCapabilityOptions {
  name?: string;
  description?: string;
  desc?: string;
  operatesOn?: string;
  composes?: string;
  files?: string;
  cascade?: boolean;
  json?: boolean;
}

interface UpdateAspectOptions {
  name?: string;
  description?: string;
  desc?: string;
  appliesTo?: string;
  files?: string;
  cascade?: boolean;
  json?: boolean;
}

interface UpdateDecisionOptions {
  what?: string;
  why?: string;
  context?: string;
  relatesTo?: string;
  docs?: string;
  json?: boolean;
}

export async function updateDomain(
  currentName: string | undefined,
  options: UpdateDomainOptions,
  storageOrCommand?: Storage | unknown
): Promise<void> {
  // Handle Commander passing Command object as third argument
  const storage: Storage =
    storageOrCommand && typeof (storageOrCommand as Storage).readModel === 'function'
      ? (storageOrCommand as Storage)
      : createFileStorage();
  if (!currentName) {
    console.error('Error: Name is required');
    console.error('Usage: mental update domain <name> [options]');
    process.exit(1);
  }

  const newName = options.name;
  const description = options.description || options.desc;
  const references = options.references || options.refs;
  const files = options.files;

  // Use pure command function
  const model = storage.readModel();
  const result = createUpdateDomainEvents(model, {
    currentName,
    newName,
    description,
    references: references ? references.split(',').map((r) => r.trim()) : undefined,
    files: files ? files.split(',').map((f) => f.trim()) : undefined,
    cascade: options.cascade,
  });

  if (!result.ok) {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }

  // Persist all events
  storage.appendEvents(result.events);

  // Output
  if (options.json) {
    const entityId = newName || currentName;
    console.log(JSON.stringify({ success: true, domain: { name: entityId } }));
  } else {
    const renamed = newName && newName !== currentName;
    const hasFieldChanges = result.events.some((e) => e.eventType === 'EntityUpdated');

    if (renamed) {
      const cascadeMsg = options.cascade ? ' (references updated)' : '';
      console.log(`Renamed domain "${currentName}" to "${newName}"${cascadeMsg}`);
    }
    if (hasFieldChanges) {
      const entityId = newName || currentName;
      console.log(`Updated domain "${entityId}"`);
    }
    if (!renamed && !hasFieldChanges) {
      console.log(`No changes to domain "${currentName}"`);
    }
  }
}

export async function updateCapability(
  currentName: string | undefined,
  options: UpdateCapabilityOptions,
  storageOrCommand?: Storage | unknown
): Promise<void> {
  // Handle Commander passing Command object as third argument
  const storage: Storage =
    storageOrCommand && typeof (storageOrCommand as Storage).readModel === 'function'
      ? (storageOrCommand as Storage)
      : createFileStorage();
  if (!currentName) {
    console.error('Error: Name is required');
    console.error('Usage: mental update capability <name> [options]');
    process.exit(1);
  }

  const newName = options.name;
  const description = options.description || options.desc;
  const operatesOn = options.operatesOn;
  const composes = options.composes;
  const files = options.files;

  // Use pure command function
  const model = storage.readModel();
  const result = createUpdateCapabilityEvents(model, {
    currentName,
    newName,
    description,
    operates_on: operatesOn ? operatesOn.split(',').map((d) => d.trim()) : undefined,
    composes: composes ? composes.split(',').map((c) => c.trim()) : undefined,
    files: files ? files.split(',').map((f) => f.trim()) : undefined,
    cascade: options.cascade,
  });

  if (!result.ok) {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }

  // Persist all events
  storage.appendEvents(result.events);

  // Output
  if (options.json) {
    const entityId = newName || currentName;
    console.log(JSON.stringify({ success: true, capability: { name: entityId } }));
  } else {
    const renamed = newName && newName !== currentName;
    const hasFieldChanges = result.events.some((e) => e.eventType === 'EntityUpdated');

    if (renamed) {
      const cascadeMsg = options.cascade ? ' (references updated)' : '';
      console.log(`Renamed capability "${currentName}" to "${newName}"${cascadeMsg}`);
    }
    if (hasFieldChanges) {
      const entityId = newName || currentName;
      console.log(`Updated capability "${entityId}"`);
    }
    if (!renamed && !hasFieldChanges) {
      console.log(`No changes to capability "${currentName}"`);
    }
  }
}

export async function updateAspect(
  currentName: string | undefined,
  options: UpdateAspectOptions,
  storageOrCommand?: Storage | unknown
): Promise<void> {
  // Handle Commander passing Command object as third argument
  const storage: Storage =
    storageOrCommand && typeof (storageOrCommand as Storage).readModel === 'function'
      ? (storageOrCommand as Storage)
      : createFileStorage();
  if (!currentName) {
    console.error('Error: Name is required');
    console.error('Usage: mental update aspect <name> [options]');
    process.exit(1);
  }

  const newName = options.name;
  const description = options.description || options.desc;
  const appliesTo = options.appliesTo;
  const files = options.files;

  // Use pure command function
  const model = storage.readModel();
  const result = createUpdateAspectEvents(model, {
    currentName,
    newName,
    description,
    applies_to: appliesTo
      ? { capabilities: appliesTo.split(',').map((c) => c.trim()) }
      : undefined,
    files: files ? files.split(',').map((f) => f.trim()) : undefined,
    cascade: options.cascade,
  });

  if (!result.ok) {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }

  // Persist all events
  storage.appendEvents(result.events);

  // Output
  if (options.json) {
    const entityId = newName || currentName;
    console.log(JSON.stringify({ success: true, aspect: { name: entityId } }));
  } else {
    const renamed = newName && newName !== currentName;
    const hasFieldChanges = result.events.some((e) => e.eventType === 'EntityUpdated');

    if (renamed) {
      const cascadeMsg = options.cascade ? ' (references updated)' : '';
      console.log(`Renamed aspect "${currentName}" to "${newName}"${cascadeMsg}`);
    }
    if (hasFieldChanges) {
      const entityId = newName || currentName;
      console.log(`Updated aspect "${entityId}"`);
    }
    if (!renamed && !hasFieldChanges) {
      console.log(`No changes to aspect "${currentName}"`);
    }
  }
}

export async function updateDecision(
  id: string | undefined,
  options: UpdateDecisionOptions,
  storageOrCommand?: Storage | unknown
): Promise<void> {
  // Handle Commander passing Command object as third argument
  const storage: Storage =
    storageOrCommand && typeof (storageOrCommand as Storage).readModel === 'function'
      ? (storageOrCommand as Storage)
      : createFileStorage();

  if (!id) {
    console.error('Error: Decision ID is required');
    console.error('Usage: mental update decision <id> [options]');
    process.exit(1);
  }

  const what = options.what;
  const why = options.why;
  const context = options.context;
  const relatesTo = options.relatesTo;
  const docs = options.docs;

  // Parse relates_to
  let relates_to: Decision['relates_to'] | undefined;
  if (relatesTo) {
    relates_to = {};
    const parts = relatesTo.split(',').map((part) => part.trim());
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

  // Use pure command function
  const model = storage.readModel();
  const result = createUpdateDecisionEvents(model, {
    id,
    what,
    why,
    context,
    relates_to,
    docs: docs ? docs.split(',').map((d) => d.trim()) : undefined,
  });

  if (!result.ok) {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }

  // Persist all events
  storage.appendEvents(result.events);

  // Output
  if (options.json) {
    console.log(JSON.stringify({ success: true, decision: { id } }));
  } else {
    const hasFieldChanges = result.events.some((e) => e.eventType === 'EntityUpdated');

    if (hasFieldChanges) {
      console.log(`Updated decision "${id}"`);
    } else {
      console.log(`No changes to decision "${id}"`);
    }
  }
}
