'use client';

import { AnimatePresence, motion } from 'motion/react';

import { cn } from '@/lib/utils';
import type { StudyKnowledgePoint } from '@/lib/types/study';

interface StreamingOutlineVisualizerProps {
  points: StudyKnowledgePoint[];
  /** When true and points is empty, render skeleton placeholders. */
  isStreaming: boolean;
}

export function StreamingOutlineVisualizer({
  points,
  isStreaming,
}: StreamingOutlineVisualizerProps) {
  const showSkeleton = isStreaming && points.length === 0;

  return (
    <ol className="space-y-3">
      <AnimatePresence initial={false}>
        {points.map((point, index) =>
          point ? (
            <motion.li
              key={point.id || `pending-${index}`}
              layout
              initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <KnowledgePointCard point={point} />
            </motion.li>
          ) : null,
        )}
      </AnimatePresence>

      {showSkeleton && <SkeletonCards />}
    </ol>
  );
}

function KnowledgePointCard({ point }: { point: StudyKnowledgePoint }) {
  return (
    <article className="rounded-xl border border-border bg-background p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {point.order}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium leading-snug">{point.title}</h3>
          {point.description && (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {point.description}
            </p>
          )}
          {point.keyPoints.length > 0 && (
            <ul className="mt-2.5 space-y-1">
              {point.keyPoints.map((kp, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
                >
                  <span
                    aria-hidden
                    className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/60"
                  />
                  <span>{kp}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}

function SkeletonCards() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.li
          key={`skeleton-${i}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.3 }}
        >
          <SkeletonCard index={i} />
        </motion.li>
      ))}
    </>
  );
}

function SkeletonCard({ index }: { index: number }) {
  // Vary widths so it looks like real content of different lengths.
  const titleWidths = ['w-3/5', 'w-2/3', 'w-1/2'];
  const descWidths = ['w-11/12', 'w-5/6', 'w-4/5'];

  return (
    <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="size-7 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div
            className={cn(
              'h-4 animate-pulse rounded-md bg-muted',
              titleWidths[index % titleWidths.length],
            )}
          />
          <div
            className={cn(
              'h-3 animate-pulse rounded-md bg-muted/70',
              descWidths[index % descWidths.length],
            )}
            style={{ animationDelay: '0.15s' }}
          />
          <div className="mt-1 space-y-1.5">
            <div
              className="h-2.5 w-4/6 animate-pulse rounded bg-muted/50"
              style={{ animationDelay: '0.3s' }}
            />
            <div
              className="h-2.5 w-3/5 animate-pulse rounded bg-muted/50"
              style={{ animationDelay: '0.4s' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
