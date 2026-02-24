/**
 * Utility functions for OpenFlow Editor
 * 
 * Pure functions for:
 * - ID generation
 * - React Flow edge derivation
 * - DAG validation
 * - Display formatting
 */

import type { Edge } from '@xyflow/react';
import type { FlowModule, ModuleValue, OpenFlow } from '@/models/openflow';

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique ID for a new module
 */
export function generateModuleId(): string {
  return `module_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique ID for an edge
 */
export function generateEdgeId(source: string, target: string): string {
  return `${source}-${target}`;
}

// ============================================================================
// React Flow Edge Derivation
// ============================================================================

/**
 * Derive React Flow edges from a sequence of modules
 * Creates sequential connections between modules in the main flow
 */
export function deriveEdges(modules: FlowModule[]): Edge[] {
  const edges: Edge[] = [];

  // Sequential connections between modules
  for (let i = 0; i < modules.length - 1; i++) {
    const source = modules[i].id;
    const target = modules[i + 1].id;
    
    edges.push({
      id: generateEdgeId(source, target),
      source,
      target,
      type: 'default',
      animated: false,
    });
  }

  return edges;
}

/**
 * Derive edges including nested modules (for loops and branches)
 * This is a more complex version that handles nested structures
 */
export function deriveEdgesWithNested(modules: FlowModule[]): Edge[] {
  const edges: Edge[] = [];
  const visited = new Set<string>();

  function processModules(moduleList: FlowModule[], parentId?: string): string | null {
    let lastId: string | null = null;

    for (let i = 0; i < moduleList.length; i++) {
      const module = moduleList[i];

      // Connect to parent if this is the first module in a nested structure
      if (i === 0 && parentId && !visited.has(`${parentId}-${module.id}`)) {
        edges.push({
          id: generateEdgeId(parentId, module.id),
          source: parentId,
          target: module.id,
          type: 'default',
        });
        visited.add(`${parentId}-${module.id}`);
      }

      // Connect to previous sibling
      if (lastId && !visited.has(`${lastId}-${module.id}`)) {
        edges.push({
          id: generateEdgeId(lastId, module.id),
          source: lastId,
          target: module.id,
          type: 'default',
        });
        visited.add(`${lastId}-${module.id}`);
      }

      // Process nested modules
      const nestedLastId = processNestedModule(module);
      lastId = nestedLastId ?? module.id;
    }

    return lastId;
  }

  function processNestedModule(module: FlowModule): string | null {
    const { value } = module;

    switch (value.type) {
      case 'forloopflow':
        return processModules(value.modules, module.id);

      case 'branchone':
        // Process all branches
        value.branches.forEach((branch) => {
          processModules(branch.modules, module.id);
        });
        // Process default branch
        if (value.default.length > 0) {
          processModules(value.default, module.id);
        }
        return null;

      case 'branchall':
        // Process all branches
        value.branches.forEach((branch) => {
          processModules(branch.modules, module.id);
        });
        // Process default branch
        if (value.default.length > 0) {
          processModules(value.default, module.id);
        }
        return null;

      default:
        return null;
    }
  }

  processModules(modules);
  return edges;
}

// ============================================================================
// DAG Validation
// ============================================================================

/**
 * Validate that the flow is a Directed Acyclic Graph (no cycles)
 * Returns true if valid, false if cycles detected
 */
export function validateDAG(modules: FlowModule[]): boolean {
  const graph = new Map<string, string[]>();
  
  // Build adjacency list
  for (let i = 0; i < modules.length - 1; i++) {
    const source = modules[i].id;
    const target = modules[i + 1].id;
    
    if (!graph.has(source)) {
      graph.set(source, []);
    }
    graph.get(source)!.push(target);
  }

  // DFS to detect cycles
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true; // Cycle detected
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // Check all nodes
  for (const module of modules) {
    if (!visited.has(module.id)) {
      if (hasCycle(module.id)) {
        return false;
      }
    }
  }

  return true;
}

// ============================================================================
// Deep Cloning
// ============================================================================

/**
 * Deep clone an OpenFlow object
 * Useful for undo/redo functionality
 */
export function cloneFlow(flow: OpenFlow): OpenFlow {
  return JSON.parse(JSON.stringify(flow));
}

/**
 * Deep clone a FlowModule
 */
export function cloneModule(module: FlowModule): FlowModule {
  return JSON.parse(JSON.stringify(module));
}

// ============================================================================
// Display Formatting
// ============================================================================

/**
 * Format a module type for human-readable display
 */
export function formatModuleType(type: ModuleValue['type']): string {
  const typeMap: Record<ModuleValue['type'], string> = {
    identity: 'Identity',
    rawscript: 'Raw Script',
    script: 'Script',
    forloopflow: 'For Loop',
    branchone: 'Branch One',
    branchall: 'Branch All',
  };

  return typeMap[type] || type;
}

/**
 * Get a color for a module type (for visual distinction)
 */
export function getModuleColor(type: ModuleValue['type']): string {
  const colorMap: Record<ModuleValue['type'], string> = {
    identity: 'bg-gray-500',
    rawscript: 'bg-blue-500',
    script: 'bg-purple-500',
    forloopflow: 'bg-green-500',
    branchone: 'bg-yellow-500',
    branchall: 'bg-orange-500',
  };

  return colorMap[type] || 'bg-gray-500';
}

/**
 * Get an icon name for a module type (Lucide icon names)
 */
export function getModuleIcon(type: ModuleValue['type']): string {
  const iconMap: Record<ModuleValue['type'], string> = {
    identity: 'ArrowRight',
    rawscript: 'Code',
    script: 'FileCode',
    forloopflow: 'Repeat',
    branchone: 'GitBranch',
    branchall: 'GitMerge',
  };

  return iconMap[type] || 'Circle';
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Get a readable summary for a module
 * Falls back to module type if no summary provided
 */
export function getModuleSummary(module: FlowModule): string {
  return module.summary || formatModuleType(module.value.type);
}

// ============================================================================
// Auto-layout Helpers
// ============================================================================

/**
 * Calculate initial positions for modules in a vertical layout
 */
export function calculateVerticalLayout(
  modules: FlowModule[],
  startX: number = 250,
  startY: number = 100,
  verticalSpacing: number = 150
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};

  modules.forEach((module, index) => {
    positions[module.id] = {
      x: startX,
      y: startY + index * verticalSpacing,
    };
  });

  return positions;
}

/**
 * Calculate initial positions for modules in a horizontal layout
 */
export function calculateHorizontalLayout(
  modules: FlowModule[],
  startX: number = 100,
  startY: number = 250,
  horizontalSpacing: number = 250
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};

  modules.forEach((module, index) => {
    positions[module.id] = {
      x: startX + index * horizontalSpacing,
      y: startY,
    };
  });

  return positions;
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if a module has input transforms
 */
export function hasInputTransforms(module: FlowModule): boolean {
  const { value } = module;
  
  if (value.type === 'rawscript' || value.type === 'script') {
    return Object.keys(value.input_transforms).length > 0;
  }
  
  return false;
}

/**
 * Check if a module has retry configuration
 */
export function hasRetry(module: FlowModule): boolean {
  return !!(module.retry?.constant || module.retry?.exponential);
}

/**
 * Check if a module has sleep configuration
 */
export function hasSleep(module: FlowModule): boolean {
  return !!module.sleep;
}

/**
 * Check if a module has suspend configuration
 */
export function hasSuspend(module: FlowModule): boolean {
  return !!module.suspend;
}

/**
 * Check if a module has stop_after_if configuration
 */
export function hasStopAfterIf(module: FlowModule): boolean {
  return !!module.stop_after_if;
}

// ============================================================================
// Export Helpers
// ============================================================================

/**
 * Download a JSON file
 */
export function downloadJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Upload and parse a JSON file
 */
export function uploadJson(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    };
    
    input.click();
  });
}
