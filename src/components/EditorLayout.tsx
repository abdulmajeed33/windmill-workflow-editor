/**
 * Editor Layout Component
 * 
 * Top-level layout container with fixed panels:
 * - Toolbar (top)
 * - Left Panel (settings/inputs tabs)
 * - Canvas Graph (center)
 * - Action Editor (right)
 */

import { Toolbar } from './Toolbar';
import { LeftPanel } from './LeftPanel/LeftPanel';
import { CanvasGraph } from './CanvasGraph/CanvasGraph';
import { ActionEditor } from './ActionEditor/ActionEditor';

export function EditorLayout() {
  return (
    <div className="flex h-screen w-screen flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b bg-white shadow-sm">
        <Toolbar />
      </div>

      {/* Main content area with three-column grid */}
      <div className="grid flex-1 grid-cols-[320px_1fr_380px] overflow-hidden">
        {/* Left Panel */}
        <div className="overflow-y-auto border-r bg-white">
          <LeftPanel />
        </div>

        {/* Center Canvas */}
        <div className="relative overflow-hidden bg-gray-50">
          <CanvasGraph />
        </div>

        {/* Right Action Editor */}
        <div className="overflow-y-auto border-l bg-white">
          <ActionEditor />
        </div>
      </div>
    </div>
  );
}
