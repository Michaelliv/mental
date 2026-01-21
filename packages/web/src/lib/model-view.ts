import type { MentalModel, ModelView, Entity, Connection } from '@mentalmodel/shared';

export function buildModelView(model: MentalModel): ModelView {
  const entities: Entity[] = [];
  const connections: Connection[] = [];

  // Add domain entities
  for (const [name, domain] of Object.entries(model.domains)) {
    entities.push({
      id: `domain:${name}`,
      type: 'domain',
      label: name,
      description: domain.description,
      files: domain.files,
      decisions: domain.decisions,
      timestamp: domain.timestamp,
    });

    // Add references connections (domain → domain)
    if (domain.references) {
      for (const ref of domain.references) {
        connections.push({
          from: `domain:${name}`,
          to: `domain:${ref}`,
          type: 'references',
        });
      }
    }
  }

  // Add capability entities
  for (const [name, capability] of Object.entries(model.capabilities)) {
    entities.push({
      id: `capability:${name}`,
      type: 'capability',
      label: name,
      description: capability.description,
      files: capability.files,
      decisions: capability.decisions,
      timestamp: capability.timestamp,
    });

    // Add operates_on connections (capability → domain)
    if (capability.operates_on) {
      for (const domainName of capability.operates_on) {
        connections.push({
          from: `capability:${name}`,
          to: `domain:${domainName}`,
          type: 'operates_on',
        });
      }
    }

    // Add composes connections (capability → capability)
    if (capability.composes) {
      for (const capName of capability.composes) {
        connections.push({
          from: `capability:${name}`,
          to: `capability:${capName}`,
          type: 'composes',
        });
      }
    }
  }

  // Add aspect entities
  for (const [name, aspect] of Object.entries(model.aspects)) {
    entities.push({
      id: `aspect:${name}`,
      type: 'aspect',
      label: name,
      description: aspect.description,
      files: aspect.files,
      decisions: aspect.decisions,
      timestamp: aspect.timestamp,
    });

    // Add applies_to connections (aspect → capability/domain)
    if (aspect.applies_to?.capabilities) {
      for (const capName of aspect.applies_to.capabilities) {
        connections.push({
          from: `aspect:${name}`,
          to: `capability:${capName}`,
          type: 'applies_to',
        });
      }
    }
    if (aspect.applies_to?.domains) {
      for (const domainName of aspect.applies_to.domains) {
        connections.push({
          from: `aspect:${name}`,
          to: `domain:${domainName}`,
          type: 'applies_to',
        });
      }
    }
  }

  return { entities, connections };
}
