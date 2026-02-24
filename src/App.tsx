import { useState, useCallback } from 'react';
import { 
  ReactFlow, 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge, 
  type Node,
  type Edge,
  type NodeChange, 
  type EdgeChange, 
  type Connection 
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
 
const initialNodes: Node[] = [
  { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: 'n2', position: { x: 0, y: 100 }, data: { label: 'Node 2' } },
];

const initialEdges: Edge[] = [
  { id: 'n1-n2', source: 'n1', target: 'n2' }
];
 
export default function App() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nodes) => applyNodeChanges(changes, nodes)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((edges) => applyEdgeChanges(changes, edges)),
    [],
  );
  const onConnect = useCallback(
    (params: Connection) => setEdges((edges) => addEdge(params, edges)),
    [],
  );
 
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      />
    </div>
  );
}