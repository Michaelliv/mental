/**
 * Delete command - removes entities by emitting EntityDeleted events
 *
 * This is a thin wrapper around the pure createDeleteEvent function.
 */

import { createFileStorage, type Storage } from '../lib/storage';
import { createDeleteEvent } from '@mentalmodel/shared';
import type { EntityType } from '@mentalmodel/shared';

interface DeleteOptions {
  json?: boolean;
}

export async function deleteEntity(
  type: EntityType,
  name: string | undefined,
  options: DeleteOptions,
  storageOrCommand?: Storage | unknown
): Promise<void> {
  // Handle Commander passing Command object as third argument
  const storage: Storage =
    storageOrCommand && typeof (storageOrCommand as Storage).readModel === 'function'
      ? (storageOrCommand as Storage)
      : createFileStorage();
  if (!name) {
    console.error(`Error: Name is required`);
    console.error(`Usage: mental delete ${type} <name>`);
    process.exit(1);
  }

  // Use pure command function
  const model = storage.readModel();
  const result = createDeleteEvent(model, { entityType: type, name });

  if (!result.ok) {
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: result.error }));
    } else {
      console.error(`Error: ${result.error}`);
    }
    process.exit(1);
  }

  // Persist the event
  storage.appendEvent(result.event);

  // Output
  if (options.json) {
    console.log(JSON.stringify({ success: true, deleted: { type, name } }));
  } else {
    console.log(`Deleted ${type} "${name}"`);
  }
}
