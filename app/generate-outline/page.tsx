'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, ArrowLeft, BookOpen, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { StreamingOutlineVisualizer } from '@/components/generate-outline/streaming-outline-visualizer';

type OutlineProgressPhase = 'idle' | 'waiting' | 'streaming' | 'done' | 'error';
import { useStudyStore } from '@/lib/store/study';
import { streamStudyOutline } from '@/lib/study/outline-stream';
import type { StudyKnowledgePoint, StudyOutline } from '@/lib/types/study';

interface StreamState {
  languageDirective: string;
  title: string;
  description: string;
  points: StudyKnowledgePoint[];
  outline: StudyOutline | null;
  retryCount: number;
  error: string | null;
  done: boolean;
}

function readRequirementFromSession(): string | null {
  try {
    const raw = sessionStorage.getItem('generationSession');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { requirements?: { requirement?: string } };
    return parsed.requirements?.requirement?.trim() || null;
  } catch {
    return null;
  }
}

export default function GenerateOutlinePage() {
  const router = useRouter();
  const setOutline = useStudyStore((s) => s.setOutline);

  const [requirement, setRequirement] = React.useState<string | null>(null);
  const [missing, setMissing] = React.useState(false);
  const [state, setState] = React.useState<StreamState>({
    languageDirective: '',
    title: '',
    description: '',
    points: [],
    outline: null,
    retryCount: 0,
    error: null,
    done: false,
  });

  React.useEffect(() => {
    const r = readRequirementFromSession();
    if (!r) {
      setMissing(true);
      return;
    }
    setRequirement(r);
  }, []);

  React.useEffect(() => {
    if (!requirement) return;

    const abortController = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        for await (const event of streamStudyOutline(requirement, abortController.signal)) {
          if (cancelled) return;
          switch (event.type) {
            case 'languageDirective':
              setState((s) => ({ ...s, languageDirective: event.data }));
              break;
            case 'courseTitle':
              setState((s) => ({ ...s, title: event.data }));
              break;
            case 'courseDescription':
              setState((s) => ({ ...s, description: event.data }));
              break;
            case 'outline':
              setState((s) => {
                const next = [...s.points];
                next[event.index] = event.data;
                return { ...s, points: next };
              });
              break;
            case 'retry':
              setState((s) => ({
                ...s,
                retryCount: event.attempt,
                points: [],
                title: '',
                description: '',
              }));
              break;
            case 'done':
              setOutline(event.outline);
              try {
                sessionStorage.setItem(
                  `deepstudy.outline.${event.outline.id}`,
                  JSON.stringify(event.outline),
                );
              } catch {
                // ignore quota errors — store is the source of truth
              }
              setState((s) => ({ ...s, outline: event.outline, done: true }));
              break;
            case 'error':
              setState((s) => ({ ...s, error: event.error }));
              break;
          }
        }
      } catch (err) {
        if (cancelled) return;
        if ((err as { name?: string } | undefined)?.name === 'AbortError') return;
        setState((s) => ({
          ...s,
          error: err instanceof Error ? err.message : String(err),
        }));
      }
    })();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [requirement, setOutline]);

  React.useEffect(() => {
    if (!state.done || !state.outline) return;
    const id = state.outline.id;
    const timer = window.setTimeout(() => {
      router.replace(`/chat?outlineId=${encodeURIComponent(id)}`);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [state.done, state.outline, router]);

  if (missing) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <AlertCircle className="size-8 text-muted-foreground" />
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">没有找到学习需求</h1>
          <p className="text-sm text-muted-foreground">请回到首页输入你想学习的主题</p>
        </div>
        <Button onClick={() => router.push('/')} variant="outline">
          <ArrowLeft className="mr-1.5 size-4" />
          返回首页
        </Button>
      </div>
    );
  }

  const { title, description, points, retryCount, error, done } = state;
  const phase: OutlineProgressPhase = error
    ? 'error'
    : done
      ? 'done'
      : points.length === 0
        ? 'waiting'
        : 'streaming';
  const filledPoints = points.filter(Boolean);

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Floating blur decorations */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-40 size-[28rem] rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-600/10"
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-10">
        {/* Back */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="-ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1.5 size-3.5" />
            返回首页
          </Button>
        </motion.div>

        {/* Status chip */}
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4"
        >
          <StatusChip phase={phase} retryCount={retryCount} />
        </motion.div>

        {/* Topic echo */}
        {requirement && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-3 text-sm text-muted-foreground"
          >
            <span className="text-muted-foreground/70">学习主题 · </span>
            <span className="text-foreground">{requirement}</span>
          </motion.div>
        )}

        {/* Course header card */}
        <AnimatePresence>
          {(title || description) && (
            <motion.section
              key="course-header"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 rounded-2xl border border-border/80 bg-background/80 p-6 shadow-sm backdrop-blur"
            >
              {title && (
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              )}
              {description && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Knowledge points area */}
        <section className="mt-6 flex-1">
          {filledPoints.length > 0 && (
            <div className="mb-3 flex items-baseline gap-2 px-1">
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                知识点
              </h2>
              <span className="text-xs text-muted-foreground/70">
                {filledPoints.length}
              </span>
            </div>
          )}
          <StreamingOutlineVisualizer
            points={filledPoints}
            isStreaming={phase === 'waiting' || phase === 'streaming'}
          />
        </section>

        {/* Error card */}
        <AnimatePresence>
          {error && (
            <motion.section
              key="error-card"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                  <AlertCircle className="size-4 text-destructive" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium text-destructive">生成失败</p>
                  <p className="text-xs text-destructive/80">{error}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                  <ArrowLeft className="mr-1.5 size-3.5" />
                  返回首页
                </Button>
                <Button size="sm" onClick={() => window.location.reload()}>
                  重试
                </Button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatusChip({
  phase,
  retryCount,
}: {
  phase: OutlineProgressPhase;
  retryCount: number;
}) {
  switch (phase) {
    case 'waiting':
      return (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
          <Sparkles className="size-3.5 animate-pulse" />
          {retryCount > 0 ? `第 ${retryCount} 次重试 · AI 正在思考…` : 'AI 正在思考…'}
        </div>
      );
    case 'streaming':
      return (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
          <Sparkles className="size-3.5 animate-pulse" />
          正在生成学习大纲…
        </div>
      );
    case 'done':
      return (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-600 dark:text-emerald-400">
          <BookOpen className="size-3.5" />
          已生成 · 即将进入学习
        </div>
      );
    case 'error':
      return (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs text-destructive">
          <AlertCircle className="size-3.5" />
          生成失败
        </div>
      );
    default:
      return null;
  }
}
