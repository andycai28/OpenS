export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

export interface MockConversation {
  seed: ChatMessage[];
  cannedReply: string;
}

export const mockConversations: Record<string, MockConversation> = {
  'kp-exponential': {
    seed: [
      {
        id: 'msg-exp-1',
        role: 'assistant',
        content:
          '我们从指数函数 y = aˣ 开始。先想一个问题：为什么要求底数 a > 0 且 a ≠ 1？',
      },
      {
        id: 'msg-exp-2',
        role: 'user',
        content: '如果 a=0 或 a<0 会怎样？',
      },
      {
        id: 'msg-exp-3',
        role: 'assistant',
        content:
          '好问题。a = 0 时 0ˣ 对很多 x 无定义；a < 0 时如 (-2)^(1/2) 在实数范围无意义，所以限制 a > 0 且 a ≠ 1 才能得到处处有定义的连续函数。',
      },
    ],
    cannedReply:
      '（Mock 回复）这是一个关于指数函数的示例回答。接入真实模型后，这里会流式返回 AI 的讲解内容。',
  },
  'kp-logarithm': {
    seed: [
      {
        id: 'msg-log-1',
        role: 'assistant',
        content:
          '对数是指数的反函数。如果 aˣ = N，那么 x = logₐN。先理解这一点，再看单调性和图像。',
      },
    ],
    cannedReply: '（Mock 回复）关于对数函数的示例回答。',
  },
  'kp-power': {
    seed: [
      {
        id: 'msg-pow-1',
        role: 'assistant',
        content: '幂函数 y = xᵃ 的形状由指数 a 决定。我们先看几个典型例子：a=1、a=2、a=1/2、a=-1。',
      },
    ],
    cannedReply: '（Mock 回复）关于幂函数的示例回答。',
  },
  'kp-spatial-angle': {
    seed: [
      {
        id: 'msg-ang-1',
        role: 'assistant',
        content:
          '空间角有三种：异面直线所成角、线面角、二面角。我们按这个顺序讨论，先从最简单的异面直线所成角开始。',
      },
    ],
    cannedReply: '（Mock 回复）关于空间角的示例回答。',
  },
  'kp-distance': {
    seed: [
      {
        id: 'msg-dist-1',
        role: 'assistant',
        content: '空间距离的核心思路是"投影"。无论是点到面、线到面，都可以归约到法向量投影问题。',
      },
    ],
    cannedReply: '（Mock 回复）关于空间距离的示例回答。',
  },
  'kp-conditional': {
    seed: [
      {
        id: 'msg-con-1',
        role: 'assistant',
        content:
          '条件概率 P(A|B) 描述的是"在 B 已经发生的前提下，A 发生的概率"。公式：P(A|B) = P(AB) / P(B)。',
      },
    ],
    cannedReply: '（Mock 回复）关于条件概率的示例回答。',
  },
  'kp-distribution': {
    seed: [
      {
        id: 'msg-dist-1',
        role: 'assistant',
        content: '离散型随机变量的关键是分布列。有了分布列，期望、方差都可以直接计算。',
      },
    ],
    cannedReply: '（Mock 回复）关于离散型随机变量的示例回答。',
  },
};

export const defaultSelectedKnowledgePointId = 'kp-exponential';
