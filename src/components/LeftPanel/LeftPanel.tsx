/**
 * Left Panel Component
 * 
 * Container for Settings, Inputs, and Flow Inputs tabs.
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEditorStore, useSelectedTab } from '@/hooks/useEditorStore';
import { SettingsTab } from './SettingsTab';
import { InputsTab } from './InputsTab';
import { FlowInputsTab } from './FlowInputsTab';

export function LeftPanel() {
  const selectedTab = useSelectedTab();
  const setSelectedTab = useEditorStore((state) => state.setSelectedTab);

  return (
    <div className="flex h-full flex-col bg-white">
      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
        <TabsList className="w-full rounded-none border-b bg-white">
          <TabsTrigger value="settings" className="flex-1">
            Settings
          </TabsTrigger>
          <TabsTrigger value="inputs" className="flex-1">
            Inputs
          </TabsTrigger>
          <TabsTrigger value="flow-inputs" className="flex-1">
            Flow Inputs
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="settings" className="mt-0 h-full">
            <SettingsTab />
          </TabsContent>

          <TabsContent value="inputs" className="mt-0 h-full">
            <InputsTab />
          </TabsContent>

          <TabsContent value="flow-inputs" className="mt-0 h-full">
            <FlowInputsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
