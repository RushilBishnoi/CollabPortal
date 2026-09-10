import { apiClient } from './api-client';
import {
  AssessmentListItem,
  StartAttemptResponse,
  AttemptResultResponse,
  MyAttemptItem,
} from '../types/assessment';

export const assessmentApi = {
  listAssessments: (skillId?: string): Promise<AssessmentListItem[]> => {
    const url = skillId ? `/assessments?skillId=${encodeURIComponent(skillId)}` : '/assessments';
    return apiClient.get<AssessmentListItem[]>(url);
  },

  getAssessmentById: (id: string): Promise<AssessmentListItem> =>
    apiClient.get<AssessmentListItem>(`/assessments/${id}`),

  startAttempt: (assessmentId: string): Promise<StartAttemptResponse> =>
    apiClient.post<StartAttemptResponse>(`/assessments/${assessmentId}/start`),

  saveAnswer: (
    attemptId: string,
    questionId: string,
    selectedOptionId: string,
  ): Promise<{ id: string; selectedOptionId: string }> =>
    apiClient.post<{ id: string; selectedOptionId: string }>(
      `/assessments/attempts/${attemptId}/answer`,
      { questionId, selectedOptionId },
    ),

  submitAttempt: (attemptId: string): Promise<AttemptResultResponse> =>
    apiClient.post<AttemptResultResponse>(`/assessments/attempts/${attemptId}/submit`),

  getAttemptResult: (attemptId: string): Promise<AttemptResultResponse> =>
    apiClient.get<AttemptResultResponse>(`/assessments/attempts/${attemptId}/result`),

  getMyAttempts: (): Promise<MyAttemptItem[]> =>
    apiClient.get<MyAttemptItem[]>('/assessments/student/my-attempts'),
};
