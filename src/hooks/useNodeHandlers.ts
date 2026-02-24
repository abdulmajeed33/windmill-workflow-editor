/**
 * React Flow Event Handlers Hook
 * 
 * Encapsulates all React Flow event handling logic:
 * - Node selection
 * - Node position updates
 * - Node deletion
 * - Edge connections
 */

import { useCallback } from 'react';
import type { Node, Connection } from '@xyflow/react';
import { useEditorStore } from './useEditorStore';

export function useNodeHandlers() {
  const selectModule = useEditorStore((state) => state.selectModule);
  const deleteModule = useEditorStore((state) => state.deleteModule);
  const updateNodePosition = useEditorStore((state) => state.updateNodePosition);

  /**
   * Handle node click - select the corresponding module
   */
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      selectModule(node.id);
    },
    [selectModule]
  );

  /**
   * Handle node drag stop - persist position
   */
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      updateNodePosition(node.id, node.position);
    },
    [updateNodePosition]
  );

  /**
   * Handle node deletion
   */
  const onNodesDelete = useCallback(
    (nodes: Node[]) => {
      nodes.forEach((node) => {
        deleteModule(node.id);
      });
    },
    [deleteModule]
  );

  /**
   * Handle edge connection
   * In OpenFlow, edges are derived from module sequence, so we don't allow manual connections
   * This could be extended to reorder modules based on connection attempts
   */
  const onConnect = useCallback((_connection: Connection) => {
    // For now, we don't allow manual edge creation
    // The edges are derived from the module sequence
    console.log('Manual edge creation not supported - edges are derived from module order');
  }, []);

  /**
   * Handle canvas click (deselect when clicking empty space)
   */
  const onPaneClick = useCallback(() => {
    selectModule(null);
  }, [selectModule]);

  return {
    onNodeClick,
    onNodeDragStop,
    onNodesDelete,
    onConnect,
    onPaneClick,
  };
}
