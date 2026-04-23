'use client';

import { Sparkles } from 'lucide-react';

interface ChatHeaderProps {
  title: string;
  subtitle?: string;
}

export function ChatHeader({ title, subtitle }: ChatHeaderProps) {
  return (
    <header className="flex items-center gap-3 border-b border-border px-6 py-3">
      <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Sparkles className="size-4" />
      </div>
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </header>
  );
}
