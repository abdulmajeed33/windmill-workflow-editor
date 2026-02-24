/**
 * React Flow Node Components
 * 
 * Memoized node components for each OpenFlow module type.
 * Each node displays module-specific information and visual indicators.
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Code,
  FileCode,
  ArrowRight,
  Repeat,
  GitBranch,
  GitMerge,
  Clock,
  RotateCw,
  Pause,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { FlowModule } from '@/models/openflow';
import { useEditorStore } from '@/hooks/useEditorStore';
import { cn } from '@/lib/utils';
import {
  formatModuleType,
  hasRetry,
  hasSleep,
  hasSuspend,
  hasStopAfterIf,
  truncateText,
  getModuleSummary,
} from '@/utils/helpers';

// ============================================================================
// Node Data Type
// ============================================================================

interface NodeData {
  module: FlowModule;
}

// ============================================================================
// Base Node Component
// ============================================================================

interface BaseNodeProps {
  module: FlowModule;
  icon: React.ReactNode;
  color: string;
  children?: React.ReactNode;
}

const BaseNode = memo<BaseNodeProps>(({ module, icon, color, children }) => {
  const selectedModuleId = useEditorStore((state) => state.selectedModuleId);
  const isSelected = selectedModuleId === module.id;

  return (
    <div
      className={cn(
        'min-w-[200px] max-w-[300px] rounded-lg border-2 bg-white shadow-md transition-all',
        isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-300',
        'hover:shadow-lg'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />

      {/* Header */}
      <div className={cn('flex items-center gap-2 rounded-t-md px-3 py-2 text-white', color)}>
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1 overflow-hidden">
          <div className="text-xs font-medium opacity-90">
            {formatModuleType(module.value.type)}
          </div>
          <div className="truncate text-sm font-semibold" title={getModuleSummary(module)}>
            {truncateText(getModuleSummary(module), 35)}
          </div>
        </div>
      </div>

      {/* Body */}
      {children && <div className="px-3 py-2 text-sm text-gray-700">{children}</div>}

      {/* Indicators */}
      {(hasRetry(module) || hasSleep(module) || hasSuspend(module) || hasStopAfterIf(module)) && (
        <div className="flex flex-wrap gap-1 border-t border-gray-200 px-3 py-2">
          {hasRetry(module) && (
            <Badge variant="secondary" className="text-xs">
              <RotateCw className="mr-1 h-3 w-3" />
              Retry
            </Badge>
          )}
          {hasSleep(module) && (
            <Badge variant="secondary" className="text-xs">
              <Clock className="mr-1 h-3 w-3" />
              Sleep
            </Badge>
          )}
          {hasSuspend(module) && (
            <Badge variant="secondary" className="text-xs">
              <Pause className="mr-1 h-3 w-3" />
              Suspend
            </Badge>
          )}
          {hasStopAfterIf(module) && (
            <Badge variant="secondary" className="text-xs">
              <AlertCircle className="mr-1 h-3 w-3" />
              Stop If
            </Badge>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
});

BaseNode.displayName = 'BaseNode';

// ============================================================================
// Identity Node
// ============================================================================

export const IdentityNode = memo<NodeProps<NodeData>>(({ data }) => {
  return (
    <BaseNode module={data.module} icon={<ArrowRight className="h-5 w-5" />} color="bg-gray-500">
      <div className="text-center italic text-gray-500">Pass-through</div>
    </BaseNode>
  );
});

IdentityNode.displayName = 'IdentityNode';

// ============================================================================
// Raw Script Node
// ============================================================================

export const RawScriptNode = memo<NodeProps<NodeData>>(({ data }) => {
  const { module } = data;
  
  if (module.value.type !== 'rawscript') return null;

  const { language, content } = module.value;
  const lineCount = content.split('\n').length;

  return (
    <BaseNode module={module} icon={<Code className="h-5 w-5" />} color="bg-blue-500">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          {language}
        </Badge>
        <span className="text-xs text-gray-500">{lineCount} lines</span>
      </div>
    </BaseNode>
  );
});

RawScriptNode.displayName = 'RawScriptNode';

// ============================================================================
// Path Script Node
// ============================================================================

export const PathScriptNode = memo<NodeProps<NodeData>>(({ data }) => {
  const { module } = data;
  
  if (module.value.type !== 'script') return null;

  const { path } = module.value;
  const isHub = path.startsWith('hub/');

  return (
    <BaseNode module={module} icon={<FileCode className="h-5 w-5" />} color="bg-purple-500">
      <div>
        {isHub && (
          <Badge variant="outline" className="mb-1 text-xs">
            Hub Script
          </Badge>
        )}
        <div className="truncate font-mono text-xs text-gray-600" title={path}>
          {path || '(no path)'}
        </div>
      </div>
    </BaseNode>
  );
});

PathScriptNode.displayName = 'PathScriptNode';

// ============================================================================
// For Loop Node
// ============================================================================

export const ForloopFlowNode = memo<NodeProps<NodeData>>(({ data }) => {
  const { module } = data;
  
  if (module.value.type !== 'forloopflow') return null;

  const { modules, skip_failures, parallel } = module.value;

  return (
    <BaseNode module={module} icon={<Repeat className="h-5 w-5" />} color="bg-green-500">
      <div className="space-y-1">
        <div className="text-xs text-gray-600">
          {modules.length} module{modules.length !== 1 ? 's' : ''} in loop
        </div>
        <div className="flex gap-1">
          {skip_failures && (
            <Badge variant="outline" className="text-xs">
              Skip Failures
            </Badge>
          )}
          {parallel && (
            <Badge variant="outline" className="text-xs">
              Parallel
            </Badge>
          )}
        </div>
      </div>
    </BaseNode>
  );
});

ForloopFlowNode.displayName = 'ForloopFlowNode';

// ============================================================================
// Branch One Node
// ============================================================================

export const BranchOneNode = memo<NodeProps<NodeData>>(({ data }) => {
  const { module } = data;
  
  if (module.value.type !== 'branchone') return null;

  const { branches, default: defaultBranch } = module.value;

  return (
    <BaseNode module={module} icon={<GitBranch className="h-5 w-5" />} color="bg-yellow-500">
      <div className="space-y-1">
        <div className="text-xs text-gray-600">
          {branches.length} branch{branches.length !== 1 ? 'es' : ''}
        </div>
        {defaultBranch.length > 0 && (
          <Badge variant="outline" className="text-xs">
            Has Default
          </Badge>
        )}
      </div>
    </BaseNode>
  );
});

BranchOneNode.displayName = 'BranchOneNode';

// ============================================================================
// Branch All Node
// ============================================================================

export const BranchAllNode = memo<NodeProps<NodeData>>(({ data }) => {
  const { module } = data;
  
  if (module.value.type !== 'branchall') return null;

  const { branches, default: defaultBranch, parallel } = module.value;

  return (
    <BaseNode module={module} icon={<GitMerge className="h-5 w-5" />} color="bg-orange-500">
      <div className="space-y-1">
        <div className="text-xs text-gray-600">
          {branches.length} parallel branch{branches.length !== 1 ? 'es' : ''}
        </div>
        <div className="flex gap-1">
          {parallel && (
            <Badge variant="outline" className="text-xs">
              Parallel
            </Badge>
          )}
          {defaultBranch.length > 0 && (
            <Badge variant="outline" className="text-xs">
              Has Default
            </Badge>
          )}
        </div>
      </div>
    </BaseNode>
  );
});

BranchAllNode.displayName = 'BranchAllNode';

// ============================================================================
// Node Types Registry
// ============================================================================

export const nodeTypes = {
  identity: IdentityNode,
  rawscript: RawScriptNode,
  script: PathScriptNode,
  forloopflow: ForloopFlowNode,
  branchone: BranchOneNode,
  branchall: BranchAllNode,
};
