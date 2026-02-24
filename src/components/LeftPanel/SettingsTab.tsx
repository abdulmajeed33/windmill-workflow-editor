/**
 * Settings Tab Component
 * 
 * Flow-level settings editor.
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCurrentFlow, useEditorStore } from '@/hooks/useEditorStore';

interface SettingsFormData {
  summary: string;
  description: string;
  same_worker: boolean;
}

export function SettingsTab() {
  const currentFlow = useCurrentFlow();
  const updateFlowMetadata = useEditorStore((state) => state.updateFlowMetadata);
  const updateSameWorker = useEditorStore((state) => state.updateSameWorker);

  const { register, watch, setValue } = useForm<SettingsFormData>({
    defaultValues: {
      summary: currentFlow?.summary || '',
      description: currentFlow?.description || '',
      same_worker: currentFlow?.value.same_worker || false,
    },
  });

  // Update form when flow changes
  useEffect(() => {
    if (currentFlow) {
      setValue('summary', currentFlow.summary || '');
      setValue('description', currentFlow.description || '');
      setValue('same_worker', currentFlow.value.same_worker);
    }
  }, [currentFlow, setValue]);

  // Watch for changes and update store
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (!currentFlow) return;

      if (name === 'summary' || name === 'description') {
        updateFlowMetadata({
          summary: value.summary,
          description: value.description,
        });
      } else if (name === 'same_worker') {
        updateSameWorker(value.same_worker ?? false);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, currentFlow, updateFlowMetadata, updateSameWorker]);

  if (!currentFlow) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-center text-sm text-gray-500">No flow loaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-2">
        <Label htmlFor="summary">Flow Summary</Label>
        <Input
          id="summary"
          placeholder="Brief one-line summary"
          {...register('summary')}
        />
        <p className="text-xs text-gray-500">A short description of what this flow does</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Detailed description (optional)"
          rows={4}
          {...register('description')}
        />
        <p className="text-xs text-gray-500">Optional detailed explanation</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="same_worker">Same Worker</Label>
            <p className="text-xs text-gray-500">
              Execute all modules on the same worker to share mounted folders
            </p>
          </div>
          <Switch
            id="same_worker"
            checked={watch('same_worker')}
            onCheckedChange={(checked) => setValue('same_worker', checked)}
          />
        </div>
      </div>

      <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
        <h4 className="mb-2 text-sm font-medium text-gray-700">Flow Statistics</h4>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Total Modules:</span>
            <span className="font-medium">{currentFlow.value.modules.length}</span>
          </div>
          {currentFlow.value.failure_module && (
            <div className="flex justify-between">
              <span>Has Failure Handler:</span>
              <span className="font-medium">Yes</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
