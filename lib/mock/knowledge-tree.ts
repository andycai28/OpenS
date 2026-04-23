import type { StudyOutline } from '@/lib/types/study';

/**
 * Mock outline used when `/chat` is accessed without a real outlineId.
 * Mirrors the shape produced by `/api/generate/outline-study`.
 */
export const mockStudyOutline: StudyOutline = {
  id: 'ol-mock',
  topic: '高中数学核心概念串讲',
  title: '高中数学核心概念',
  description: '面向高中生的一次函数到概率统计的核心概念复盘。',
  languageDirective: 'Teach in Chinese.',
  createdAt: 0,
  points: [
    {
      id: 'kp-exponential',
      order: 1,
      title: '指数函数',
      description: '从 aˣ 的定义出发，讨论定义域、单调性与图像变换。',
      keyPoints: [
        '理解指数函数的定义域与值域',
        '掌握 y=aˣ 的单调性与图像变换',
        '会求解简单指数方程',
      ],
      teachingObjective: '能够识别并画出任意底数下指数函数的图像与变换。',
    },
    {
      id: 'kp-logarithm',
      order: 2,
      title: '对数函数',
      description: '对数是指数的反函数，重点理解换底公式与单调性。',
      keyPoints: ['理解对数的定义与换底公式', '掌握对数函数的单调性'],
      teachingObjective: '能够在指数和对数之间自由切换并求解简单方程。',
    },
    {
      id: 'kp-power',
      order: 3,
      title: '幂函数',
      description: '通过几个典型指数（1、2、1/2、-1）建立幂函数图像直觉。',
      keyPoints: ['区分常见幂函数图像', '比较不同幂函数的增长速度'],
      teachingObjective: '能够按指数判断幂函数的图像形状与增长趋势。',
    },
    {
      id: 'kp-spatial-angle',
      order: 4,
      title: '空间角',
      description: '异面直线所成角、线面角、二面角的求法。',
      keyPoints: ['理解异面直线所成角', '掌握线面角、二面角的求法'],
      teachingObjective: '能用向量或几何方法求解任意空间角。',
    },
    {
      id: 'kp-distance',
      order: 5,
      title: '空间距离',
      description: '以"投影"为核心理解空间距离问题。',
      keyPoints: ['掌握点到面的距离公式', '运用向量法求空间距离'],
      teachingObjective: '能够灵活选择几何法或向量法求空间距离。',
    },
    {
      id: 'kp-conditional',
      order: 6,
      title: '条件概率',
      description: '条件概率、全概率公式、贝叶斯公式三者的关系。',
      keyPoints: ['理解条件概率的定义', '掌握全概率公式与贝叶斯公式'],
      teachingObjective: '能够用贝叶斯公式解决后验概率问题。',
    },
    {
      id: 'kp-distribution',
      order: 7,
      title: '离散型随机变量',
      description: '从分布列到期望、方差，再到二项分布。',
      keyPoints: ['理解期望与方差', '掌握二项分布与超几何分布'],
      teachingObjective: '能写出常见离散分布的分布列并计算期望与方差。',
    },
  ],
};

export const defaultMockKnowledgePointId = mockStudyOutline.points[0].id;
