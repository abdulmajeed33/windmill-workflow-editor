import { useEffect } from 'react';
import { EditorLayout } from '@/components/EditorLayout';
import { useEditorStore } from '@/hooks/useEditorStore';
import temperatureFlowData from '@/data/temperature-flow.json';

export default function App() {
  const loadFromJson = useEditorStore((state) => state.loadFromJson);

  // Load temperature validation flow on first mount
  useEffect(() => {
    try {
      loadFromJson(temperatureFlowData);
    } catch (error) {
      console.error('Failed to load temperature flow:', error);
    }
  }, [loadFromJson]);

  return <EditorLayout />;
}