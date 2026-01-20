import type { Connection } from '@mentalmodel/shared';

export interface ConnectionStats {
  direct: Set<string>;
  transitive: Set<string>;
  inbound: number;
  outbound: number;
  total: number;
}

export function getConnectionStats(
  entityId: string,
  connections: Connection[]
): ConnectionStats {
  const direct = new Set<string>();
  let inbound = 0;
  let outbound = 0;

  for (const conn of connections) {
    if (conn.from === entityId) {
      direct.add(conn.to);
      outbound++;
    }
    if (conn.to === entityId) {
      direct.add(conn.from);
      inbound++;
    }
  }

  return {
    direct,
    transitive: new Set(), // Computed on hover
    inbound,
    outbound,
    total: direct.size,
  };
}

export function getDirectConnections(entityId: string, connections: Connection[]): Set<string> {
  const connected = new Set<string>();
  for (const conn of connections) {
    if (conn.from === entityId) connected.add(conn.to);
    if (conn.to === entityId) connected.add(conn.from);
  }
  return connected;
}

export function getTransitiveConnections(
  entityId: string,
  connections: Connection[],
  depth: number = 2
): { direct: Set<string>; transitive: Set<string> } {
  const direct = getDirectConnections(entityId, connections);
  const transitive = new Set<string>();

  if (depth > 1) {
    for (const directId of direct) {
      const secondDegree = getDirectConnections(directId, connections);
      for (const id of secondDegree) {
        if (id !== entityId && !direct.has(id)) {
          transitive.add(id);
        }
      }
    }
  }

  return { direct, transitive };
}

export function sortByConnections(
  entities: Array<{ id: string; label: string }>,
  connections: Connection[],
  direction: 'asc' | 'desc' = 'desc'
): Array<{ id: string; label: string }> {
  return [...entities].sort((a, b) => {
    const aCount = getDirectConnections(a.id, connections).size;
    const bCount = getDirectConnections(b.id, connections).size;
    return direction === 'desc' ? bCount - aCount : aCount - bCount;
  });
}

export function sortByName(
  entities: Array<{ id: string; label: string }>,
  direction: 'asc' | 'desc' = 'asc'
): Array<{ id: string; label: string }> {
  return [...entities].sort((a, b) => {
    const cmp = a.label.localeCompare(b.label);
    return direction === 'desc' ? -cmp : cmp;
  });
}
