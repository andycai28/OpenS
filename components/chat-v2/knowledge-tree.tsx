'use client';

import * as React from 'react';
import { BookOpen, ChevronRight, LayoutGrid } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { StudyKnowledgePoint } from '@/lib/types/study';

interface KnowledgeTreeProps {
  title?: string;
  points: StudyKnowledgePoint[];
  selectedId: string | null;
  /** Called with a KP id to focus, or `null` to return to course overview. */
  onSelect: (knowledgePointId: string | null) => void;
  className?: string;
}

export function KnowledgeTree({
  title = '学习大纲',
  points,
  selectedId,
  onSelect,
  className,
}: KnowledgeTreeProps) {
  const isOverview = selectedId === null;

  return (
    <aside
      className={cn(
        'flex h-full w-[280px] shrink-0 flex-col border-r border-border bg-muted/20',
        className,
      )}
    >
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <BookOpen className="size-4 text-muted-foreground" />
        <h2 className="truncate text-sm font-semibold" title={title}>
          {title}
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            'mb-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
            isOverview
              ? 'bg-primary/10 font-medium text-primary'
              : 'text-foreground/80 hover:bg-muted hover:text-foreground',
          )}
        >
          <LayoutGrid className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">课程总览</span>
        </button>

        {points.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            暂无知识点
          </p>
        ) : (
          <ol className="space-y-0.5">
            {points.map((point) => (
              <PointItem
                key={point.id}
                point={point}
                isSelected={point.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </ol>
        )}
      </div>
    </aside>
  );
}

function PointItem({
  point,
  isSelected,
  onSelect,
}: {
  point: StudyKnowledgePoint;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const isOpen = isSelected || expanded;
  const hasKeyPoints = point.keyPoints.length > 0;

  return (
    <li>
      <div className="flex items-stretch">
        {hasKeyPoints ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="flex w-5 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            aria-label={isOpen ? '折叠' : '展开'}
          >
            <ChevronRight
              className={cn('size-3.5 transition-transform', isOpen && 'rotate-90')}
            />
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <button
          type="button"
          onClick={() => onSelect(point.id)}
          className={cn(
            'flex flex-1 items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
            isSelected
              ? 'bg-primary/10 font-medium text-primary'
              : 'text-foreground/80 hover:bg-muted hover:text-foreground',
          )}
        >
          <span
            className={cn(
              'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs',
              isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
            )}
          >
            {point.order}
          </span>
          <span className="min-w-0 flex-1 truncate">{point.title}</span>
        </button>
      </div>

      {isOpen && hasKeyPoints && (
        <ul className="ml-10 mt-0.5 mb-1 space-y-0.5 border-l border-border/60 pl-3">
          {point.keyPoints.map((kp, i) => (
            <li
              key={i}
              className="flex items-start gap-1.5 py-0.5 text-xs text-muted-foreground"
            >
              <span className="mt-0.5">·</span>
              <span>{kp}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
