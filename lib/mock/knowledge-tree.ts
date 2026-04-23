export interface KnowledgeRequirement {
  id: string;
  title: string;
}

export interface KnowledgePoint {
  id: string;
  title: string;
  requirements: KnowledgeRequirement[];
}

export interface KnowledgeChapter {
  id: string;
  title: string;
  points: KnowledgePoint[];
}

export const mockKnowledgeTree: KnowledgeChapter[] = [
  {
    id: 'ch-function',
    title: '第一章　函数',
    points: [
      {
        id: 'kp-exponential',
        title: '指数函数',
        requirements: [
          { id: 'req-exp-1', title: '理解指数函数的定义域与值域' },
          { id: 'req-exp-2', title: '掌握 y=aˣ 的单调性与图像变换' },
          { id: 'req-exp-3', title: '会求解简单指数方程' },
        ],
      },
      {
        id: 'kp-logarithm',
        title: '对数函数',
        requirements: [
          { id: 'req-log-1', title: '理解对数的定义与换底公式' },
          { id: 'req-log-2', title: '掌握对数函数的单调性' },
        ],
      },
      {
        id: 'kp-power',
        title: '幂函数',
        requirements: [
          { id: 'req-pow-1', title: '区分常见幂函数图像' },
          { id: 'req-pow-2', title: '比较不同幂函数的增长速度' },
        ],
      },
    ],
  },
  {
    id: 'ch-geometry',
    title: '第二章　立体几何',
    points: [
      {
        id: 'kp-spatial-angle',
        title: '空间角',
        requirements: [
          { id: 'req-ang-1', title: '理解异面直线所成角' },
          { id: 'req-ang-2', title: '掌握线面角、二面角的求法' },
        ],
      },
      {
        id: 'kp-distance',
        title: '空间距离',
        requirements: [
          { id: 'req-dist-1', title: '掌握点到面的距离公式' },
          { id: 'req-dist-2', title: '运用向量法求空间距离' },
        ],
      },
    ],
  },
  {
    id: 'ch-probability',
    title: '第三章　概率与统计',
    points: [
      {
        id: 'kp-conditional',
        title: '条件概率',
        requirements: [
          { id: 'req-con-1', title: '理解条件概率的定义' },
          { id: 'req-con-2', title: '掌握全概率公式与贝叶斯公式' },
        ],
      },
      {
        id: 'kp-distribution',
        title: '离散型随机变量',
        requirements: [
          { id: 'req-dist-1', title: '理解期望与方差' },
          { id: 'req-dist-2', title: '掌握二项分布与超几何分布' },
        ],
      },
    ],
  },
];
