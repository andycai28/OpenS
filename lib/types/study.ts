/**
 * Study-mode outline types.
 * A lightweight 1-layer knowledge-point list used by the DeepStudy
 * `/chat` tutor flow. Independent of OpenMAIC's full SceneOutline
 * (which carries scene types, quiz/pbl configs, media generations).
 */

export interface StudyKnowledgePoint {
  id: string;
  order: number;
  title: string;
  description: string;
  keyPoints: string[];
  teachingObjective?: string;
}

export interface StudyOutline {
  id: string;
  topic: string;
  title: string;
  description: string;
  languageDirective: string;
  createdAt: number;
  points: StudyKnowledgePoint[];
}
