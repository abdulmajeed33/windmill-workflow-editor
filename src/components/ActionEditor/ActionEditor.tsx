/**
 * Action Editor Component
 * 
 * Right panel for editing the selected module's core content.
 * Displays dynamic forms based on module type.
 */

import { useSelectedModule, useEditorStore } from '@/hooks/useEditorStore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import type { FlowModule, RawScript, PathScript, ForloopFlow, BranchOne, BranchAll } from '@/models/openflow';

export function ActionEditor() {
  const selectedModule = useSelectedModule();
  const updateModule = useEditorStore((state) => state.updateModule);

  if (!selectedModule) {
    return (
      <div className="flex h-full items-center justify-center bg-white p-4">
        <p className="text-center text-sm text-gray-500">
          Select a module to edit its configuration
        </p>
      </div>
    );
  }

  const handleUpdateValue = (updates: Partial<FlowModule['value']>) => {
    updateModule(selectedModule.id, {
      value: {
        ...selectedModule.value,
        ...updates,
      },
    });
  };

  const handleUpdateCommon = (updates: Partial<Omit<FlowModule, 'id' | 'value'>>) => {
    updateModule(selectedModule.id, updates);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">Module Editor</h2>
        <p className="text-sm text-gray-500">Configure the selected module</p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 space-y-6 overflow-auto p-4">
        {/* Module Summary */}
        <div className="space-y-2">
          <Label htmlFor="module-summary">Module Summary</Label>
          <Input
            id="module-summary"
            value={selectedModule.summary || ''}
            onChange={(e) => handleUpdateCommon({ summary: e.target.value })}
            placeholder="Brief description of this module"
          />
        </div>

        <Separator />

        {/* Module-specific editors */}
        {selectedModule.value.type === 'identity' && <IdentityEditor />}
        {selectedModule.value.type === 'rawscript' && (
          <RawScriptEditor value={selectedModule.value} onUpdate={handleUpdateValue} />
        )}
        {selectedModule.value.type === 'script' && (
          <PathScriptEditor value={selectedModule.value} onUpdate={handleUpdateValue} />
        )}
        {selectedModule.value.type === 'forloopflow' && (
          <ForloopEditor value={selectedModule.value} onUpdate={handleUpdateValue} />
        )}
        {selectedModule.value.type === 'branchone' && (
          <BranchOneEditor value={selectedModule.value} onUpdate={handleUpdateValue} />
        )}
        {selectedModule.value.type === 'branchall' && (
          <BranchAllEditor value={selectedModule.value} onUpdate={handleUpdateValue} />
        )}

        <Separator />

        {/* Common module options */}
        <CommonModuleOptions module={selectedModule} onUpdate={handleUpdateCommon} />
      </div>
    </div>
  );
}

// ============================================================================
// Module-specific Editors
// ============================================================================

function IdentityEditor() {
  return (
    <div className="rounded-md bg-gray-50 p-4 text-center">
      <p className="text-sm text-gray-600">
        Identity module passes its input directly to output without modification.
      </p>
      <p className="mt-2 text-xs text-gray-500">
        Useful for debugging and testing flow execution.
      </p>
    </div>
  );
}

interface RawScriptEditorProps {
  value: RawScript;
  onUpdate: (updates: Partial<RawScript>) => void;
}

function RawScriptEditor({ value, onUpdate }: RawScriptEditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="language">Language</Label>
        <Select value={value.language} onValueChange={(lang) => onUpdate({ language: lang as RawScript['language'] })}>
          <SelectTrigger id="language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deno">TypeScript (Deno)</SelectItem>
            <SelectItem value="python3">Python 3</SelectItem>
            <SelectItem value="go">Go</SelectItem>
            <SelectItem value="bash">Bash</SelectItem>
            <SelectItem value="postgresql">PostgreSQL</SelectItem>
            <SelectItem value="mysql">MySQL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Script Content</Label>
        <Textarea
          id="content"
          value={value.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="min-h-[300px] font-mono text-sm"
          placeholder="// Write your script here"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="path">Path (optional)</Label>
        <Input
          id="path"
          value={value.path || ''}
          onChange={(e) => onUpdate({ path: e.target.value })}
          placeholder="e.g., scripts/my_script"
        />
        <p className="text-xs text-gray-500">Optional path for organizing scripts</p>
      </div>
    </div>
  );
}

interface PathScriptEditorProps {
  value: PathScript;
  onUpdate: (updates: Partial<PathScript>) => void;
}

function PathScriptEditor({ value, onUpdate }: PathScriptEditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="script-path">Script Path</Label>
        <Input
          id="script-path"
          value={value.path}
          onChange={(e) => onUpdate({ path: e.target.value })}
          placeholder="hub/postgres/query or u/username/my_script"
        />
        <p className="text-xs text-gray-500">
          Use <code className="rounded bg-gray-100 px-1">hub/</code> prefix for Hub scripts
        </p>
      </div>

      {value.path.startsWith('hub/') && (
        <div className="rounded-md bg-blue-50 p-3">
          <Badge variant="outline" className="mb-2">Hub Script</Badge>
          <p className="text-xs text-gray-600">
            This script references a shared script from Windmill Hub
          </p>
        </div>
      )}
    </div>
  );
}

interface ForloopEditorProps {
  value: ForloopFlow;
  onUpdate: (updates: Partial<ForloopFlow>) => void;
}

function ForloopEditor({ value, onUpdate }: ForloopEditorProps) {
  const handleUpdateIterator = (expr: string) => {
    onUpdate({ iterator: { type: 'javascript', expr } });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="iterator">Iterator Expression</Label>
        <Textarea
          id="iterator"
          value={value.iterator.type === 'javascript' ? value.iterator.expr : ''}
          onChange={(e) => handleUpdateIterator(e.target.value)}
          rows={3}
          className="font-mono text-sm"
          placeholder="[1, 2, 3] or results.previous_step"
        />
        <p className="text-xs text-gray-500">
          JavaScript expression that returns an array to iterate over
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Skip Failures</Label>
          <p className="text-xs text-gray-500">Continue loop even if an iteration fails</p>
        </div>
        <Switch
          checked={value.skip_failures || false}
          onCheckedChange={(checked) => onUpdate({ skip_failures: checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Parallel Execution</Label>
          <p className="text-xs text-gray-500">Run iterations in parallel</p>
        </div>
        <Switch
          checked={value.parallel || false}
          onCheckedChange={(checked) => onUpdate({ parallel: checked })}
        />
      </div>

      <div className="rounded-md bg-gray-50 p-3">
        <p className="text-sm font-medium text-gray-700">Nested Modules</p>
        <p className="text-xs text-gray-600">
          {value.modules.length} module{value.modules.length !== 1 ? 's' : ''} will execute for each iteration
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Add nested modules in the canvas (not yet implemented in this editor)
        </p>
      </div>
    </div>
  );
}

interface BranchOneEditorProps {
  value: BranchOne;
  onUpdate: (updates: Partial<BranchOne>) => void;
}

function BranchOneEditor({ value, onUpdate }: BranchOneEditorProps) {
  const handleAddBranch = () => {
    onUpdate({
      branches: [
        ...value.branches,
        {
          expr: 'true',
          modules: [],
          summary: `Branch ${value.branches.length + 1}`,
        },
      ],
    });
  };

  const handleUpdateBranch = (index: number, updates: Partial<typeof value.branches[0]>) => {
    const newBranches = [...value.branches];
    newBranches[index] = { ...newBranches[index], ...updates };
    onUpdate({ branches: newBranches });
  };

  const handleDeleteBranch = (index: number) => {
    onUpdate({ branches: value.branches.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700">Branch One</p>
        <p className="text-xs text-gray-500">First matching branch will execute</p>
      </div>

      {value.branches.map((branch, index) => (
        <div key={index} className="space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <Label>Branch {index + 1}</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteBranch(index)}
            >
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          </div>

          <Input
            placeholder="Branch summary"
            value={branch.summary || ''}
            onChange={(e) => handleUpdateBranch(index, { summary: e.target.value })}
          />

          <Textarea
            placeholder="Condition (e.g., flow_input.status === 'active')"
            value={branch.expr}
            onChange={(e) => handleUpdateBranch(index, { expr: e.target.value })}
            rows={2}
            className="font-mono text-xs"
          />

          <p className="text-xs text-gray-500">
            {branch.modules.length} nested module{branch.modules.length !== 1 ? 's' : ''}
          </p>
        </div>
      ))}

      <Button onClick={handleAddBranch} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add Branch
      </Button>

      <div className="rounded-md bg-gray-50 p-3">
        <p className="text-xs text-gray-600">
          Default branch: {value.default.length} module{value.default.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

interface BranchAllEditorProps {
  value: BranchAll;
  onUpdate: (updates: Partial<BranchAll>) => void;
}

function BranchAllEditor({ value, onUpdate }: BranchAllEditorProps) {
  const handleAddBranch = () => {
    onUpdate({
      branches: [
        ...value.branches,
        {
          skip_failure: false,
          modules: [],
          summary: `Branch ${value.branches.length + 1}`,
        },
      ],
    });
  };

  const handleUpdateBranch = (index: number, updates: Partial<typeof value.branches[0]>) => {
    const newBranches = [...value.branches];
    newBranches[index] = { ...newBranches[index], ...updates };
    onUpdate({ branches: newBranches });
  };

  const handleDeleteBranch = (index: number) => {
    onUpdate({ branches: value.branches.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700">Branch All</p>
        <p className="text-xs text-gray-500">All branches execute in parallel</p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Parallel Execution</Label>
          <p className="text-xs text-gray-500">Run all branches simultaneously</p>
        </div>
        <Switch
          checked={value.parallel || false}
          onCheckedChange={(checked) => onUpdate({ parallel: checked })}
        />
      </div>

      {value.branches.map((branch, index) => (
        <div key={index} className="space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <Label>Branch {index + 1}</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteBranch(index)}
            >
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          </div>

          <Input
            placeholder="Branch summary"
            value={branch.summary || ''}
            onChange={(e) => handleUpdateBranch(index, { summary: e.target.value })}
          />

          <div className="flex items-center justify-between">
            <Label className="text-xs">Skip Failure</Label>
            <Switch
              checked={branch.skip_failure}
              onCheckedChange={(checked) => handleUpdateBranch(index, { skip_failure: checked })}
            />
          </div>

          <p className="text-xs text-gray-500">
            {branch.modules.length} nested module{branch.modules.length !== 1 ? 's' : ''}
          </p>
        </div>
      ))}

      <Button onClick={handleAddBranch} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add Branch
      </Button>
    </div>
  );
}

// ============================================================================
// Common Module Options
// ============================================================================

interface CommonModuleOptionsProps {
  module: FlowModule;
  onUpdate: (updates: Partial<Omit<FlowModule, 'id' | 'value'>>) => void;
}

function CommonModuleOptions({ module, onUpdate }: CommonModuleOptionsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">Advanced Options</h3>

      {/* Stop After If */}
      <div className="space-y-2">
        <Label htmlFor="stop-expr">Stop After If (conditional stop)</Label>
        <Textarea
          id="stop-expr"
          value={module.stop_after_if?.expr || ''}
          onChange={(e) =>
            onUpdate({
              stop_after_if: e.target.value
                ? {
                    expr: e.target.value,
                    skip_if_stopped: module.stop_after_if?.skip_if_stopped || false,
                  }
                : undefined,
            })
          }
          rows={2}
          className="font-mono text-xs"
          placeholder="e.g., result.changes === 0"
        />
        {module.stop_after_if && (
          <div className="flex items-center gap-2">
            <Switch
              checked={module.stop_after_if.skip_if_stopped}
              onCheckedChange={(checked) =>
                onUpdate({
                  stop_after_if: { ...module.stop_after_if!, skip_if_stopped: checked },
                })
              }
            />
            <Label className="text-xs">Skip if stopped</Label>
          </div>
        )}
      </div>

      {/* Sleep */}
      <div className="space-y-2">
        <Label htmlFor="sleep">Sleep (seconds)</Label>
        <Input
          id="sleep"
          type="number"
          value={
            module.sleep
              ? module.sleep.type === 'static'
                ? (module.sleep.value as number) || ''
                : ''
              : ''
          }
          onChange={(e) => {
            const value = e.target.value ? parseInt(e.target.value) : undefined;
            onUpdate({
              sleep: value ? { type: 'static', value } : undefined,
            });
          }}
          placeholder="0"
        />
      </div>

      {/* Retry */}
      <div className="space-y-2">
        <Label>Retry Policy</Label>
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Attempts"
              value={module.retry?.constant?.attempts || ''}
              onChange={(e) => {
                const attempts = e.target.value ? parseInt(e.target.value) : undefined;
                onUpdate({
                  retry: attempts
                    ? {
                        constant: {
                          attempts,
                          seconds: module.retry?.constant?.seconds || 10,
                        },
                      }
                    : undefined,
                });
              }}
            />
            <Input
              type="number"
              placeholder="Delay (sec)"
              value={module.retry?.constant?.seconds || ''}
              onChange={(e) => {
                const seconds = e.target.value ? parseInt(e.target.value) : undefined;
                if (module.retry?.constant && seconds !== undefined) {
                  onUpdate({
                    retry: {
                      constant: { ...module.retry.constant, seconds },
                    },
                  });
                }
              }}
            />
          </div>
          <p className="text-xs text-gray-500">Retry with constant delay</p>
        </div>
      </div>
    </div>
  );
}
