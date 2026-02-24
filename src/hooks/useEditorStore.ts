/**
 * Zustand Store for OpenFlow Editor
 * 
 * Central state management for:
 * - OpenFlow document state
 * - UI state (selected module, tab, etc.)
 * - Module CRUD operations
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { OpenFlow, FlowModule, ModuleValue } from '@/models/openflow';
import { fromJson, toJson } from '@/models/openflow';

// ============================================================================
// State Types
// ============================================================================

export type EditorTab = 'settings' | 'inputs' | 'flow-inputs';

export interface NodePosition {
  x: number;
  y: number;
}

interface EditorState {
  // Document state
  currentFlow: OpenFlow | null;
  isDirty: boolean;

  // UI state
  selectedModuleId: string | null;
  selectedTab: EditorTab;

  // Node positions (for React Flow)
  nodePositions: Record<string, NodePosition>;

  // Actions - Flow operations
  setFlow: (flow: OpenFlow) => void;
  loadFromJson: (json: unknown) => void;
  exportToJson: () => Record<string, unknown> | null;
  newFlow: () => void;
  updateFlowMetadata: (updates: Partial<Pick<OpenFlow, 'summary' | 'description' | 'schema'>>) => void;
  updateSameWorker: (sameWorker: boolean) => void;

  // Actions - Module operations
  selectModule: (id: string | null) => void;
  addModule: (moduleType: ModuleValue['type'], afterId?: string) => void;
  updateModule: (id: string, updates: Partial<FlowModule>) => void;
  deleteModule: (id: string) => void;
  reorderModules: (fromIndex: number, toIndex: number) => void;

  // Actions - Node positioning
  updateNodePosition: (id: string, position: NodePosition) => void;

  // Actions - Tab navigation
  setSelectedTab: (tab: EditorTab) => void;

  // Actions - Utility
  markDirty: () => void;
  markClean: () => void;
}

// ============================================================================
// Module Factory
// ============================================================================

function createDefaultModule(type: ModuleValue['type'], id: string): FlowModule {
  const baseModule: Omit<FlowModule, 'value'> = {
    id,
    summary: undefined,
  };

  switch (type) {
    case 'identity':
      return {
        ...baseModule,
        value: { type: 'identity' },
        summary: 'Identity (pass-through)',
      };

    case 'rawscript':
      return {
        ...baseModule,
        value: {
          type: 'rawscript',
          content: '// Write your script here\n\nexport function main() {\n  return "Hello, World!";\n}',
          language: 'deno',
          input_transforms: {},
        },
        summary: 'Raw Script',
      };

    case 'script':
      return {
        ...baseModule,
        value: {
          type: 'script',
          path: '',
          input_transforms: {},
        },
        summary: 'Script from Path',
      };

    case 'forloopflow':
      return {
        ...baseModule,
        value: {
          type: 'forloopflow',
          modules: [],
          iterator: { type: 'javascript', expr: '[1, 2, 3]' },
          skip_failures: false,
        },
        summary: 'For Loop',
      };

    case 'branchone':
      return {
        ...baseModule,
        value: {
          type: 'branchone',
          branches: [
            {
              expr: 'true',
              modules: [],
              summary: 'Branch 1',
            },
          ],
          default: [],
        },
        summary: 'Branch (One)',
      };

    case 'branchall':
      return {
        ...baseModule,
        value: {
          type: 'branchall',
          branches: [
            {
              skip_failure: false,
              modules: [],
              summary: 'Parallel Branch 1',
            },
          ],
          default: [],
        },
        summary: 'Branch (All)',
      };

    default:
      // Exhaustive check
      { const _exhaustive: never = type;
      throw new Error(`Unknown module type: ${_exhaustive}`); }
  }
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useEditorStore = create<EditorState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      currentFlow: null,
      isDirty: false,
      selectedModuleId: null,
      selectedTab: 'settings',
      nodePositions: {},

      // Flow operations
      setFlow: (flow) => {
        set((state) => {
          state.currentFlow = flow;
          state.isDirty = false;
          state.selectedModuleId = null;
          state.nodePositions = {};
        });
      },

      loadFromJson: (json) => {
        try {
          const flow = fromJson(json);
          get().setFlow(flow);
        } catch (error) {
          console.error('Failed to load OpenFlow from JSON:', error);
          throw error;
        }
      },

      exportToJson: () => {
        const { currentFlow } = get();
        if (!currentFlow) return null;
        return toJson(currentFlow);
      },

      newFlow: () => {
        const emptyFlow: OpenFlow = {
          summary: 'New Flow',
          description: '',
          value: {
            modules: [],
            same_worker: false,
          },
          schema: {
            type: 'object',
            properties: {},
          },
        };
        get().setFlow(emptyFlow);
      },

      updateFlowMetadata: (updates) => {
        set((state) => {
          if (!state.currentFlow) return;
          
          if (updates.summary !== undefined) {
            state.currentFlow.summary = updates.summary;
          }
          if (updates.description !== undefined) {
            state.currentFlow.description = updates.description;
          }
          if (updates.schema !== undefined) {
            state.currentFlow.schema = updates.schema;
          }
          
          state.isDirty = true;
        });
      },

      updateSameWorker: (sameWorker) => {
        set((state) => {
          if (!state.currentFlow) return;
          state.currentFlow.value.same_worker = sameWorker;
          state.isDirty = true;
        });
      },

      // Module operations
      selectModule: (id) => {
        set((state) => {
          state.selectedModuleId = id;
        });
      },

      addModule: (moduleType, afterId) => {
        set((state) => {
          if (!state.currentFlow) return;

          const newId = `module_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const newModule = createDefaultModule(moduleType, newId);

          if (afterId) {
            const index = state.currentFlow.value.modules.findIndex((m) => m.id === afterId);
            if (index !== -1) {
              state.currentFlow.value.modules.splice(index + 1, 0, newModule);
            } else {
              state.currentFlow.value.modules.push(newModule);
            }
          } else {
            state.currentFlow.value.modules.push(newModule);
          }

          state.selectedModuleId = newId;
          state.isDirty = true;
        });
      },

      updateModule: (id, updates) => {
        set((state) => {
          if (!state.currentFlow) return;

          const module = state.currentFlow.value.modules.find((m) => m.id === id);
          if (!module) return;

          // Apply updates
          Object.assign(module, updates);
          state.isDirty = true;
        });
      },

      deleteModule: (id) => {
        set((state) => {
          if (!state.currentFlow) return;

          const index = state.currentFlow.value.modules.findIndex((m) => m.id === id);
          if (index !== -1) {
            state.currentFlow.value.modules.splice(index, 1);
            
            // Clear selection if deleted module was selected
            if (state.selectedModuleId === id) {
              state.selectedModuleId = null;
            }
            
            // Remove node position
            delete state.nodePositions[id];
            
            state.isDirty = true;
          }
        });
      },

      reorderModules: (fromIndex, toIndex) => {
        set((state) => {
          if (!state.currentFlow) return;

          const modules = state.currentFlow.value.modules;
          const [movedModule] = modules.splice(fromIndex, 1);
          modules.splice(toIndex, 0, movedModule);
          
          state.isDirty = true;
        });
      },

      // Node positioning
      updateNodePosition: (id, position) => {
        set((state) => {
          state.nodePositions[id] = position;
        });
      },

      // Tab navigation
      setSelectedTab: (tab) => {
        set((state) => {
          state.selectedTab = tab;
        });
      },

      // Utility
      markDirty: () => {
        set((state) => {
          state.isDirty = true;
        });
      },

      markClean: () => {
        set((state) => {
          state.isDirty = false;
        });
      },
    })),
    { name: 'OpenFlow Editor' }
  )
);

// ============================================================================
// Typed Selectors
// ============================================================================

// Stable empty array to prevent infinite re-render loops
const EMPTY_MODULES: FlowModule[] = [];

export const useCurrentFlow = () => useEditorStore((state) => state.currentFlow);
export const useIsDirty = () => useEditorStore((state) => state.isDirty);
export const useSelectedModuleId = () => useEditorStore((state) => state.selectedModuleId);
export const useSelectedTab = () => useEditorStore((state) => state.selectedTab);
export const useModules = () => useEditorStore((state) => state.currentFlow?.value.modules ?? EMPTY_MODULES);
export const useSelectedModule = () => {
  return useEditorStore((state) => {
    if (!state.selectedModuleId || !state.currentFlow) return null;
    return state.currentFlow.value.modules.find((m) => m.id === state.selectedModuleId) ?? null;
  });
};
export const useNodePositions = () => useEditorStore((state) => state.nodePositions);
