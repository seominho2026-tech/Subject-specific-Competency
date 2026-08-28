export interface AttachedFile {
  id: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  title: string;       // 학생이 작성한 자료 제목
  summary: string;     // 학생이 작성한 핵심 내용 요약
  uploadedAt: string;
}

export interface ExplorationStage {
  topic: string;             // 탐구 주제 / 핵심 과제
  motivation: string;        // 탐구 동기 및 필요성
  question: string;          // 핵심 탐구 질문 / 가설
  backgroundResearch: string;// 선행 자료 조사 및 이론적 배경
}

export interface DesignStage {
  plan: string;              // 연구/개발/실험 수행 계획 및 일정
  roles: string;             // 모둠 내 역할 분담 및 협력 내용
  toolsAndTech: string;      // 활용 도구, 기술, 기자재, 소프트웨어
  processDesign: string;     // 구체적 알고리즘/실험 절차/제작 설계도
}

export interface OutcomeStage {
  finalResult: string;       // 최종 산출물 내용 및 주요 기능
  problemSolving: string;    // 진행 중 직면한 문제점 및 해결 과정 (오류 극복)
  insights: string;          // 프로젝트를 통해 새롭게 알게 된 점 및 성찰
}

export interface SelfEvaluationStage {
  competencyGrowth: string;  // 핵심 역량 기여도 (창의융합, 비판적사고, 협업 등)
  reflection: string;        // 활동에 대한 자기 성찰 및 아쉬운 점
  futurePlans: string;       // 향후 심화 탐구 및 후속 발전 계획
}

export interface PortfolioStages {
  exploration: ExplorationStage;
  design: DesignStage;
  outcome: OutcomeStage;
  selfEvaluation: SelfEvaluationStage;
}

export interface AiDraft {
  content: string;
  tone: 'competency' | 'creativity' | 'growth' | 'collaboration';
  generatedAt: string;
  charCount: number;
  byteCount: number;
  teacherNotes?: string;
  customPrompt?: string;
}

export interface StudentRecord {
  id: string;                // Document ID (e.g. roomCode_studentNumber or uid)
  roomCode: string;
  studentNumber: string;     // 학번 (예: 10101, 20315 등)
  studentName: string;       // 이름
  authUid?: string;
  authEmail?: string;
  stages: PortfolioStages;
  attachments: AttachedFile[];
  completedStageCount: number; // 0 ~ 4
  aiDraft?: AiDraft;
  createdAt: string;
  updatedAt: string;
}

export interface ClassRoom {
  id: string;                // Room Code (e.g. tech2, bio2026, etc.)
  title: string;             // 수업/프로젝트명
  subject: string;           // 교과목명 (예: 정보, 과학탐구실험, 통합사회)
  grade: string;             // 대상 학년/학급 (예: 고등학교 1학년)
  description: string;       // 수업 안내 및 과제 설명
  achievementStandards: string; // AI 세특 생성용 교육과정 성취기준
  teacherName?: string;
  createdAt: string;
  studentCount?: number;
}
