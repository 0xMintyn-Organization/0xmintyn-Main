'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  ChevronDown, 
  ChevronUp,
  X
} from 'lucide-react';
import P2PTrade from '@/components/Exchange/P2PTrade';

interface P2PTradeSidebarProps {
  isCollapsed?: boolean;
}

export default function P2PTradeSidebar({ isCollapsed = false }: P2PTradeSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isCollapsed) {
    return (
      <div className="p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-10 hover:bg-zinc-100 dark:hover:bg-zinc-700"
        >
          <Users className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-blue-600" />
          <div className="text-left">
            <p className="font-semibold text-sm">P2P Trading</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Buy/Sell OXM</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          Live
        </Badge>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-zinc-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 max-h-[calc(100vh-400px)] overflow-y-auto">
          <P2PTrade />
        </div>
      )}
    </div>
  );
}

