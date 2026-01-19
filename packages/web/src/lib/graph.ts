import type { MentalModel, GraphData, GraphNode, GraphEdge } from '@mentalmodel/shared';

export function buildGraphData(model: MentalModel): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Add domain nodes
  for (const [name, domain] of Object.entries(model.domains)) {
    nodes.push({
      id: `domain:${name}`,
      type: 'domain',
      label: name,
      description: domain.description,
      files: domain.files,
      decisions: domain.decisions,
    });

    // Add references edges (domain → domain)
    if (domain.references) {
      for (const ref of domain.references) {
        edges.push({
          from: `domain:${name}`,
          to: `domain:${ref}`,
          type: 'references',
        });
      }
    }
  }

  // Add capability nodes
  for (const [name, capability] of Object.entries(model.capabilities)) {
    nodes.push({
      id: `capability:${name}`,
      type: 'capability',
      label: name,
      description: capability.description,
      files: capability.files,
      decisions: capability.decisions,
    });

    // Add operates_on edges (capability → domain)
    if (capability.operates_on) {
      for (const domainName of capability.operates_on) {
        edges.push({
          from: `capability:${name}`,
          to: `domain:${domainName}`,
          type: 'operates_on',
        });
      }
    }

    // Add composes edges (capability → capability)
    if (capability.composes) {
      for (const capName of capability.composes) {
        edges.push({
          from: `capability:${name}`,
          to: `capability:${capName}`,
          type: 'composes',
        });
      }
    }
  }

  // Add aspect nodes
  for (const [name, aspect] of Object.entries(model.aspects)) {
    nodes.push({
      id: `aspect:${name}`,
      type: 'aspect',
      label: name,
      description: aspect.description,
      files: aspect.files,
      decisions: aspect.decisions,
    });

    // Add applies_to edges (aspect → capability/domain)
    if (aspect.applies_to?.capabilities) {
      for (const capName of aspect.applies_to.capabilities) {
        edges.push({
          from: `aspect:${name}`,
          to: `capability:${capName}`,
          type: 'applies_to',
        });
      }
    }
    if (aspect.applies_to?.domains) {
      for (const domainName of aspect.applies_to.domains) {
        edges.push({
          from: `aspect:${name}`,
          to: `domain:${domainName}`,
          type: 'applies_to',
        });
      }
    }
  }

  return { nodes, edges };
}
