'use client';

import * as React from 'react';
import { BookOpen, ChevronRight, Dot } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { KnowledgeChapter } from '@/lib/mock/knowledge-tree';

interface KnowledgeTreeProps {
  chapters: KnowledgeChapter[];
  selectedId: string | null;
  onSelect: (knowledgePointId: string) => void;
  className?: string;
}

export function KnowledgeTree({ chapters, selectedId, onSelect, className }: KnowledgeTreeProps) {
  return (
    <aside
      className={cn(
        'flex h-full w-[280px] shrink-0 flex-col border-r border-border bg-muted/20',
        className,
      )}
    >
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <BookOpen className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">学习大纲</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {chapters.map((chapter) => (
          <ChapterItem
            key={chapter.id}
            chapter={chapter}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </aside>
  );
}

function ChapterItem({
  chapter,
  selectedId,
  onSelect,
}: {
  chapter: KnowledgeChapter;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-1">
      <CollapsibleTrigger className="group flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-left text-sm font-medium text-foreground/80 hover:bg-muted">
        <ChevronRight
          className={cn(
            'size-3.5 shrink-0 transition-transform',
            open && 'rotate-90',
          )}
        />
        <span className="truncate">{chapter.title}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-0.5">
        {chapter.points.map((point) => {
          const isSelected = point.id === selectedId;
          return (
            <div key={point.id} className="ml-3">
              <button
                type="button"
                onClick={() => onSelect(point.id)}
                className={cn(
                  'flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                  isSelected
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-foreground/70 hover:bg-muted hover:text-foreground',
                )}
              >
                <span className="truncate">{point.title}</span>
              </button>
              {isSelected && point.requirements.length > 0 && (
                <ul className="ml-4 mt-1 space-y-0.5 border-l border-border/60 pl-3">
                  {point.requirements.map((req) => (
                    <li
                      key={req.id}
                      className="flex items-start gap-1 py-0.5 text-xs text-muted-foreground"
                    >
                      <Dot className="mt-0.5 size-3 shrink-0" />
                      <span>{req.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
