import { useEffect, useState } from 'react';
import type { MentalModel, GraphData, GraphNode } from '@mentalmodel/shared';
import { Graph } from './components/Graph';
import { DetailsPanel } from './components/DetailsPanel';
import { buildGraphData } from './lib/graph';

export default function App() {
  const [model, setModel] = useState<MentalModel | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/model')
      .then((res) => res.json())
      .then((data: MentalModel) => {
        setModel(data);
        setGraphData(buildGraphData(data));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400 text-xl">Loading mental model...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    );
  }

  if (!graphData || !model) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400 text-xl">No mental model found</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Graph
        data={graphData}
        selectedNode={selectedNode}
        onSelectNode={setSelectedNode}
      />
      <DetailsPanel
        node={selectedNode}
        model={model}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}
