/**
 * Inputs Tab Component
 * 
 * Edit input_transforms for the selected module.
 */

import { useState } from 'react';
import { Plus, Trash2, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useSelectedModule, useEditorStore } from '@/hooks/useEditorStore';
import type { InputTransform } from '@/models/openflow';
import { isRawScript, isPathScript } from '@/models/openflow';

export function InputsTab() {
  const selectedModule = useSelectedModule();
  const updateModule = useEditorStore((state) => state.updateModule);

  const [newInputKey, setNewInputKey] = useState('');

  if (!selectedModule) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-center text-sm text-gray-500">
          Select a module to edit its inputs
        </p>
      </div>
    );
  }

  // Only RawScript and PathScript have input_transforms
  if (!isRawScript(selectedModule.value) && !isPathScript(selectedModule.value)) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-center text-sm text-gray-500">
          This module type does not have input transforms
        </p>
      </div>
    );
  }

  const inputTransforms = selectedModule.value.input_transforms;
  const inputKeys = Object.keys(inputTransforms);

  const handleAddInput = () => {
    if (!newInputKey.trim()) return;

    const newTransform: InputTransform = {
      type: 'static',
      value: '',
    };

    updateModule(selectedModule.id, {
      value: {
        ...selectedModule.value,
        input_transforms: {
          ...inputTransforms,
          [newInputKey]: newTransform,
        },
      },
    });

    setNewInputKey('');
  };

  const handleDeleteInput = (key: string) => {
    const { [key]: _, ...rest } = inputTransforms;
    updateModule(selectedModule.id, {
      value: {
        ...selectedModule.value,
        input_transforms: rest,
      },
    });
  };

  const handleUpdateTransform = (key: string, transform: InputTransform) => {
    updateModule(selectedModule.id, {
      value: {
        ...selectedModule.value,
        input_transforms: {
          ...inputTransforms,
          [key]: transform,
        },
      },
    });
  };

  const toggleTransformType = (key: string) => {
    const current = inputTransforms[key];
    const newTransform: InputTransform =
      current.type === 'static'
        ? { type: 'javascript', expr: '' }
        : { type: 'static', value: '' };

    handleUpdateTransform(key, newTransform);
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <h3 className="mb-2 text-sm font-medium">Input Transforms</h3>
        <p className="text-xs text-gray-500">
          Define how inputs are passed to this module from previous steps
        </p>
      </div>

      {/* Add new input */}
      <div className="space-y-2">
        <Label htmlFor="new-input">Add Input</Label>
        <div className="flex gap-2">
          <Input
            id="new-input"
            placeholder="Input name (e.g., email)"
            value={newInputKey}
            onChange={(e) => setNewInputKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddInput();
            }}
          />
          <Button onClick={handleAddInput} size="sm" disabled={!newInputKey.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Existing inputs */}
      {inputKeys.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 p-4 text-center">
          <p className="text-sm text-gray-500">No inputs defined</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inputKeys.map((key) => {
            const transform = inputTransforms[key];
            return (
              <div key={key} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">{key}</Label>
                    <Badge variant="outline" className="text-xs">
                      {transform.type === 'static' ? 'Static' : 'JavaScript'}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTransformType(key)}
                      title="Toggle transform type"
                    >
                      <Code2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteInput(key)}
                      title="Delete input"
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>

                {transform.type === 'static' ? (
                  <Input
                    placeholder="Static value"
                    value={(transform.value as string) || ''}
                    onChange={(e) =>
                      handleUpdateTransform(key, { type: 'static', value: e.target.value })
                    }
                  />
                ) : (
                  <Textarea
                    placeholder="JavaScript expression (e.g., flow_input.email)"
                    value={transform.expr}
                    rows={3}
                    className="font-mono text-xs"
                    onChange={(e) =>
                      handleUpdateTransform(key, { type: 'javascript', expr: e.target.value })
                    }
                  />
                )}

                {transform.type === 'javascript' && (
                  <p className="text-xs text-gray-500">
                    Use <code className="rounded bg-gray-100 px-1">flow_input</code> or{' '}
                    <code className="rounded bg-gray-100 px-1">results.previous_step</code>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
