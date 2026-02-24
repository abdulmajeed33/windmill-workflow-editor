/**
 * Flow Inputs Tab Component
 * 
 * Edit the JSON Schema for the flow's input.
 */

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCurrentFlow, useEditorStore } from '@/hooks/useEditorStore';

export function FlowInputsTab() {
  const currentFlow = useCurrentFlow();
  const updateFlowMetadata = useEditorStore((state) => state.updateFlowMetadata);

  const [schemaText, setSchemaText] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load schema into text area
  useEffect(() => {
    if (currentFlow?.schema) {
      setSchemaText(JSON.stringify(currentFlow.schema, null, 2));
      setIsValid(true);
      setError(null);
    }
  }, [currentFlow]);

  // Validate JSON as user types
  const handleSchemaChange = (value: string) => {
    setSchemaText(value);

    if (!value.trim()) {
      setIsValid(true);
      setError(null);
      return;
    }

    try {
      JSON.parse(value);
      setIsValid(true);
      setError(null);
    } catch (e) {
      setIsValid(false);
      setError((e as Error).message);
    }
  };

  // Save schema to store
  const handleSave = () => {
    if (!isValid) return;

    try {
      const schema = schemaText.trim() ? JSON.parse(schemaText) : {};
      updateFlowMetadata({ schema });
    } catch (e) {
      console.error('Failed to save schema:', e);
    }
  };

  // Reset to default schema
  const handleReset = () => {
    const defaultSchema = {
      type: 'object',
      properties: {},
      required: [],
    };
    setSchemaText(JSON.stringify(defaultSchema, null, 2));
    setIsValid(true);
    setError(null);
  };

  if (!currentFlow) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-center text-sm text-gray-500">No flow loaded</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-4 p-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label htmlFor="schema">Flow Input Schema</Label>
          {isValid ? (
            <Badge variant="outline" className="text-green-600">
              Valid
            </Badge>
          ) : (
            <Badge variant="outline" className="text-red-600">
              Invalid
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Define the JSON Schema that constrains the flow's input parameters
        </p>
      </div>

      <div className="flex-1">
        <Textarea
          id="schema"
          value={schemaText}
          onChange={(e) => handleSchemaChange(e.target.value)}
          className="h-full min-h-[300px] font-mono text-xs"
          placeholder='{\n  "type": "object",\n  "properties": {\n    "email": { "type": "string" }\n  }\n}'
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-xs font-medium text-red-800">JSON Error:</p>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={!isValid} className="flex-1">
          Save Schema
        </Button>
        <Button onClick={handleReset} variant="outline">
          Reset
        </Button>
      </div>

      <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
        <h4 className="mb-2 text-xs font-medium text-gray-700">Schema Example</h4>
        <pre className="overflow-auto text-xs text-gray-600">
          {JSON.stringify(
            {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' },
                name: { type: 'string' },
                age: { type: 'number', minimum: 0 },
              },
              required: ['email', 'name'],
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}
