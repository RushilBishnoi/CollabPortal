export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'TIMED_OUT' | 'ABANDONED';
export type AssessmentType = 'MULTIPLE_CHOICE' | 'CODING' | 'PROJECT_BASED';

export interface AssessmentListItem {
  id: string;
  title: string;
  description?: string;
  type: AssessmentType;
  passingScore: number;
  durationMinutes: number;
  totalQuestions: number;
  skillId: string;
  skill: {
    id: string;
    name: string;
    category?: { id: string; name: string };
  };
}

export interface QuestionOptionSimple {
  id: string;
  questionId: string;
  optionText: string;
  order: number;
}

export interface AssessmentQuestionSanitized {
  id: string;
  questionText: string;
  points: number;
  order: number;
  options: QuestionOptionSimple[];
}

export interface StartAttemptResponse {
  attemptId: string;
  startedAt: string;
  durationMinutes: number;
  passingScore: number;
  assessment: {
    id: string;
    title: string;
    description?: string;
    skill: { id: string; name: string };
    totalQuestions: number;
  };
  questions: AssessmentQuestionSanitized[];
}

export interface GradedOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
}

export interface ReviewQuestion {
  id: string;
  questionText: string;
  explanation?: string;
  points: number;
  selectedOptionId: string | null;
  isCorrect: boolean;
  earnedPoints: number;
  options: GradedOption[];
}

export interface AttemptResultResponse {
  attemptId: string;
  assessmentTitle: string;
  skillName: string;
  status: AttemptStatus;
  score: number;
  passed: boolean;
  passingScore: number;
  earnedPoints: number;
  totalPoints: number;
  startedAt: string;
  submittedAt?: string;
  questions: ReviewQuestion[];
}

export interface MyAttemptItem {
  id: string;
  status: AttemptStatus;
  score?: number | null;
  passed?: boolean | null;
  startedAt: string;
  submittedAt?: string | null;
  assessment: {
    id: string;
    title: string;
    passingScore: number;
    skill: { id: string; name: string };
  };
}
