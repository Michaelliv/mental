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
} from '@mentalmodel/shared';

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
