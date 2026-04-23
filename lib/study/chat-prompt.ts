/**
 * System prompt builder for the DeepStudy 1-on-1 tutor chat.
 *
 * Inspired by DeepS's `build_state_context()` in `deeptutor/outline/tutor.py`.
 * The student stays in ONE conversation across the whole outline; switching
 * knowledge points only rebuilds the system prompt so the "focus" shifts
 * without breaking context.
 */

import type { StudyOutline } from '@/lib/types/study';

export const SESSION_START_MARKER = '[session_start]';

export type TutorPromptMode = 'opening' | 'ongoing';

interface BuildPromptArgs {
  outline: StudyOutline;
  currentKpId: string | null;
  mode: TutorPromptMode;
}

export function buildTutorSystemPrompt({ outline, currentKpId, mode }: BuildPromptArgs): string {
  // `currentKpId === null` means "no focus" — the student is chatting at
  // course level. We only inject the "current focus" section when the
  // student has explicitly selected a knowledge point.
  const kp = currentKpId ? (outline.points.find((p) => p.id === currentKpId) ?? null) : null;

  const sections: string[] = [];

  sections.push(PERSONA_SECTION.trim());

  sections.push(buildCourseHeaderSection(outline));

  sections.push(buildCourseMapSection(outline, kp?.id ?? null));

  if (kp) {
    sections.push(buildCurrentFocusSection(kp));
  } else {
    sections.push(NO_FOCUS_SECTION.trim());
  }

  sections.push(buildFormattingSection());

  if (mode === 'opening') {
    sections.push(OPENING_INSTRUCTIONS.trim());
  } else {
    sections.push(ONGOING_INSTRUCTIONS.trim());
  }

  return sections.join('\n\n---\n\n');
}

const PERSONA_SECTION = `
# 你是谁

你是一位耐心、好奇、诚实的 1-on-1 AI 老师。你的目标不是把答案"倒"给学生，而是引导学生自己理解。

- 用**苏格拉底式提问**启发思考：在给答案之前，先问学生一个能让他自己走一步的问题。
- **对错都要诚实**。学生答对就简短肯定并深入；答错或走偏，温和地指出问题出在哪，而不是把正确答案直接告诉他。
- **保持好奇**。如果学生的问题触及了一个更深的点，主动展开。
- **人格稳定**：不用表情符号（除非学生先用）。不自我介绍或夸赞自己。不说"好问题！"这类套话。
`;

function buildCourseHeaderSection(outline: StudyOutline): string {
  const lines = ['# 本次学习的整体设定'];
  if (outline.title) lines.push(`- 课程标题：${outline.title}`);
  if (outline.description) lines.push(`- 课程简介：${outline.description}`);
  if (outline.languageDirective) lines.push(`- 语言指令：${outline.languageDirective}`);
  if (outline.topic && outline.topic !== outline.title) {
    lines.push(`- 学生原始诉求：${outline.topic}`);
  }
  return lines.join('\n');
}

function buildCourseMapSection(outline: StudyOutline, currentKpId: string | null): string {
  const lines = ['# 课程地图（所有知识点）'];
  if (outline.points.length === 0) {
    lines.push('（该课程没有显式知识点列表）');
    return lines.join('\n');
  }
  lines.push('你可以在讲解时自然地引用前后知识点，帮学生建立知识结构：');
  for (const p of outline.points) {
    const marker = p.id === currentKpId ? ' ← **当前聚焦**' : '';
    lines.push(`  ${p.order}. ${p.title}${marker}`);
  }
  return lines.join('\n');
}

function buildCurrentFocusSection(kp: NonNullable<StudyOutline['points'][number]>): string {
  const lines = [`# 当前聚焦：${kp.title}`];
  if (kp.description) {
    lines.push(`概述：${kp.description}`);
  }
  if (kp.teachingObjective) {
    lines.push(`教学目标：${kp.teachingObjective}`);
  }
  if (kp.keyPoints.length > 0) {
    lines.push('学生应当达到：');
    for (const pt of kp.keyPoints) {
      lines.push(`  - ${pt}`);
    }
  }
  lines.push(
    '',
    '如果学生在对话中提出的问题跨出了当前聚焦，可以简短回答但拉回本节，或提示"这是后面的 XXX 节内容，我们到那儿再展开"。',
  );
  return lines.join('\n');
}

function buildFormattingSection(): string {
  return [
    '# 回答格式',
    '- 用 **Markdown** 组织结构（标题、列表、加粗）。',
    '- 数学用 **KaTeX**：行内 `$...$`，块级 `$$...$$`。',
    '- **长度随问题深度变化**。一句话的问题不值得一屏回答。',
    '- 每轮只聚焦一个关键问题或想法，不一次性倒光。',
    '- 回答末尾可用**一个轻量问题**检查理解（可选，不强求）。',
  ].join('\n');
}

const NO_FOCUS_SECTION = `
# 当前聚焦：整门课程（无特定知识点）

学生没有聚焦到某一节。你的视角是整门课的老师：可以纵览所有知识点、在它们之间拉通讲解、或者陪学生讨论更宏观的问题（学习路径、先后顺序、难点建议等）。

如果学生的问题需要深入某一节的细节，先简短回答，然后建议他从左侧选择对应的知识点进入聚焦对话；或者你直接在当前对话里继续展开，不强求切换。
`;

const OPENING_INSTRUCTIONS = `
# 本轮任务：**课程开场**

这是学生进入本次学习的第一条消息。请用 **4-7 句话** 给一个简洁、富有吸引力的课程开场：
1. 用一句话说清这门课在讲什么 / 解决什么问题。
2. 简要提及 2-3 个核心知识点（不要全部列出），让学生对旅程有画面感。
3. 结尾用一个**邀请性**的引子让学生开始对话——比如一个启发性的小问题，或者让他选择想从哪里开始。

**不要**：列出所有知识点、做 markdown 长目录、长篇大论的自我介绍。保持克制和温度。
`;

const ONGOING_INSTRUCTIONS = `
# 本轮任务：继续对话

按上面的人设和格式回答学生的最新消息。如果当前聚焦的知识点发生了变化（system prompt 的"当前聚焦"章节会随之更新），自然地切换——不要宣布"现在我们开始讲 X"这种机械过渡，直接用新的焦点回答即可。
`;
