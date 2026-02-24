/**
 * Canvas Graph Component
 * 
 * Container component for React Flow canvas.
 * Derives nodes and edges from Zustand store and handles interactions.
 */

import { useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEditorStore, useModules, useNodePositions } from '@/hooks/useEditorStore';
import { useNodeHandlers } from '@/hooks/useNodeHandlers';
import { nodeTypes } from './NodeComponents';
import { deriveEdges, calculateVerticalLayout } from '@/utils/helpers';

export function CanvasGraph() {
  const modules = useModules();
  const nodePositions = useNodePositions();
  const currentFlow = useEditorStore((state) => state.currentFlow);
  const updateNodePosition = useEditorStore((state) => state.updateNodePosition);

  const hasAutoLayoutedRef = useRef(false);

  // Get event handlers
  const {
    onNodeClick,
    onNodeDragStop,
    onNodesDelete,
    onConnect,
    onPaneClick,
  } = useNodeHandlers();

  // Auto-layout effect - runs once when modules are first loaded
  useEffect(() => {
    if (!currentFlow || hasAutoLayoutedRef.current || modules.length === 0) return;
    
    // Only auto-layout if no positions exist
    if (Object.keys(nodePositions).length === 0) {
      const autoPositions = calculateVerticalLayout(modules);
      Object.entries(autoPositions).forEach(([id, position]) => {
        updateNodePosition(id, position);
      });
      hasAutoLayoutedRef.current = true;
    }
  }, [currentFlow, modules, nodePositions, updateNodePosition]);

  // Derive React Flow nodes from Zustand modules
  const nodes = useMemo(() => {
    if (!currentFlow) return [];

    const derivedNodes: Node[] = modules.map((module, index) => ({
      id: module.id,
      type: module.value.type,
      data: { module },
      position: nodePositions[module.id] || { x: 250, y: index * 150 },
      draggable: true,
      selectable: true,
    }));

    return derivedNodes;
  }, [modules, nodePositions, currentFlow]);

  // Derive React Flow edges from module sequence
  const edges = useMemo<Edge[]>(() => {
    if (!currentFlow) return [];
    return deriveEdges(modules);
  }, [modules, currentFlow]);

  if (!currentFlow) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-600">No flow loaded</p>
          <p className="text-sm text-gray-500">Create a new flow or open an existing one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes as any}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.5,
          maxZoom: 1.5,
        }}
        minZoom={0.1}
        maxZoom={4}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Control', 'Meta']}
        snapToGrid
        snapGrid={[15, 15]}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d1d5db" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            const colorMap: Record<string, string> = {
              identity: '#6b7280',
              rawscript: '#3b82f6',
              script: '#a855f7',
              forloopflow: '#22c55e',
              branchone: '#eab308',
              branchall: '#f97316',
            };
            return colorMap[node.type as string] || '#6b7280';
          }}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
