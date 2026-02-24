/**
 * Toolbar Component
 * 
 * Top toolbar with file operations and module creation controls.
 */

import { useState } from 'react';
import {
  FileText,
  FolderOpen,
  Download,
  Plus,
  ChevronDown,
  Code,
  FileCode,
  ArrowRight,
  Repeat,
  GitBranch,
  GitMerge,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEditorStore, useIsDirty, useCurrentFlow } from '@/hooks/useEditorStore';
import { downloadJson, uploadJson } from '@/utils/helpers';
import type { ModuleValue } from '@/models/openflow';

export function Toolbar() {
  const currentFlow = useCurrentFlow();
  const isDirty = useIsDirty();
  const newFlow = useEditorStore((state) => state.newFlow);
  const exportToJson = useEditorStore((state) => state.exportToJson);
  const loadFromJson = useEditorStore((state) => state.loadFromJson);
  const addModule = useEditorStore((state) => state.addModule);
  const markClean = useEditorStore((state) => state.markClean);

  const [isLoading, setIsLoading] = useState(false);

  const handleNew = () => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Create a new flow anyway?');
      if (!confirmed) return;
    }
    newFlow();
  };

  const handleOpen = async () => {
    if (isDirty) {
      const confirmed = window.confirm('You have unsaved changes. Open a file anyway?');
      if (!confirmed) return;
    }

    try {
      setIsLoading(true);
      const json = await uploadJson();
      loadFromJson(json);
      markClean();
    } catch (error) {
      console.error('Failed to open file:', error);
      alert('Failed to open file. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const json = exportToJson();
    if (!json) {
      alert('No flow to export');
      return;
    }

    const filename = currentFlow?.summary
      ? `${currentFlow.summary.toLowerCase().replace(/\s+/g, '-')}.json`
      : 'openflow.json';

    downloadJson(json, filename);
    markClean();
  };

  const handleAddModule = (moduleType: ModuleValue['type']) => {
    addModule(moduleType);
  };

  const moduleTypes: Array<{
    type: ModuleValue['type'];
    label: string;
    icon: React.ReactNode;
  }> = [
    { type: 'rawscript', label: 'Raw Script', icon: <Code className="h-4 w-4" /> },
    { type: 'script', label: 'Script (Path)', icon: <FileCode className="h-4 w-4" /> },
    { type: 'forloopflow', label: 'For Loop', icon: <Repeat className="h-4 w-4" /> },
    { type: 'branchone', label: 'Branch One', icon: <GitBranch className="h-4 w-4" /> },
    { type: 'branchall', label: 'Branch All', icon: <GitMerge className="h-4 w-4" /> },
    { type: 'identity', label: 'Identity', icon: <ArrowRight className="h-4 w-4" /> },
  ];

  return (
    <div className="flex items-center gap-2 border-b bg-white px-4 py-2 shadow-sm">
      {/* File operations */}
      <Button variant="ghost" size="sm" onClick={handleNew}>
        <FileText className="mr-2 h-4 w-4" />
        New
      </Button>

      <Button variant="ghost" size="sm" onClick={handleOpen} disabled={isLoading}>
        <FolderOpen className="mr-2 h-4 w-4" />
        Open
      </Button>

      <Button variant="ghost" size="sm" onClick={handleExport} disabled={!currentFlow}>
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Add module */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm" disabled={!currentFlow}>
            <Plus className="mr-2 h-4 w-4" />
            Add Module
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {moduleTypes.map((moduleType) => (
            <DropdownMenuItem
              key={moduleType.type}
              onClick={() => handleAddModule(moduleType.type)}
            >
              <span className="mr-2">{moduleType.icon}</span>
              {moduleType.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status indicators */}
      <div className="flex-1" />

      {currentFlow && (
        <div className="flex items-center gap-2">
          {currentFlow.summary && (
            <span className="text-sm font-medium text-gray-700">{currentFlow.summary}</span>
          )}
          {isDirty && (
            <Badge variant="secondary" className="text-xs">
              Unsaved
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
