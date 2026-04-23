'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, BookOpen, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
              setState((s) => ({ ...s, retryCount: event.attempt }));
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
    }, 600);
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
  const inProgress = !done && !error;

  return (
    <div className="flex min-h-dvh w-full flex-col items-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-12 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-3xl space-y-8">
        <header className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
            {inProgress ? (
              <>
                <Sparkles className="size-3.5 animate-pulse" />
                正在生成学习大纲…
              </>
            ) : done ? (
              <>
                <BookOpen className="size-3.5" />
                已生成 · 即将进入学习
              </>
            ) : (
              <>
                <AlertCircle className="size-3.5" />
                生成失败
              </>
            )}
          </div>
          {requirement && (
            <p className="text-sm text-muted-foreground">
              主题：<span className="text-foreground">{requirement}</span>
            </p>
          )}
          {retryCount > 0 && inProgress && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              第 {retryCount} 次重试生成…
            </p>
          )}
        </header>

        {(title || description) && (
          <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
            {title && <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>}
            {description && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            )}
          </section>
        )}

        {points.length > 0 && (
          <section className="space-y-3">
            <h2 className="px-1 text-sm font-medium text-muted-foreground">
              知识点（{points.length}）
            </h2>
            <ol className="space-y-3">
              {points.map((kp, i) =>
                kp ? (
                  <li
                    key={kp.id || `pending-${i}`}
                    className="rounded-lg border border-border bg-background p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {kp.order || i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium">{kp.title}</h3>
                        {kp.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{kp.description}</p>
                        )}
                        {kp.keyPoints.length > 0 && (
                          <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                            {kp.keyPoints.map((pt, j) => (
                              <li key={j} className="flex items-start gap-1.5">
                                <span className="mt-0.5">·</span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </li>
                ) : null,
              )}
            </ol>
          </section>
        )}

        {error && (
          <section className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="font-medium">生成失败</p>
                <p className="text-xs opacity-80">{error}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                <ArrowLeft className="mr-1.5 size-3.5" />
                返回首页
              </Button>
              <Button size="sm" onClick={() => window.location.reload()}>
                重试
              </Button>
            </div>
          </section>
        )}

        {inProgress && points.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-block size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
              <span className="inline-block size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
              <span className="inline-block size-1.5 animate-bounce rounded-full bg-current" />
              <span className="ml-1">AI 正在思考…</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
