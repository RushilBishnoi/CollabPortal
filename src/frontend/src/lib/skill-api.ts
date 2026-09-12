import { apiClient } from './api-client';
import {
  SkillCategory,
  Skill,
  StudentSkill,
  StudentSkillsResponse,
  CreateStudentSkillPayload,
  UpdateStudentSkillPayload,
} from '../types/skill';

export const skillApi = {
  // Skill Taxonomy
  listCategories: (): Promise<SkillCategory[]> =>
    apiClient.get<SkillCategory[]>('/skills/categories'),

  listSkills: (categoryId?: string): Promise<Skill[]> => {
    const url = categoryId ? `/skills?categoryId=${encodeURIComponent(categoryId)}` : '/skills';
    return apiClient.get<Skill[]>(url);
  },

  searchSkills: (query: string): Promise<Skill[]> => {
    if (!query || query.trim().length < 2) {
      return Promise.resolve([]);
    }
    return apiClient.get<Skill[]>(`/skills/search?q=${encodeURIComponent(query.trim())}`);
  },

  getSkillById: (id: string): Promise<Skill> =>
    apiClient.get<Skill>(`/skills/${id}`),

  // Student Skills Management
  getMySkills: (): Promise<StudentSkillsResponse> =>
    apiClient.get<StudentSkillsResponse>('/skills/student/me'),

  addSkill: (payload: CreateStudentSkillPayload): Promise<StudentSkill> =>
    apiClient.post<StudentSkill>('/skills/student/me', payload),

  updateSkillProficiency: (
    skillId: string,
    payload: UpdateStudentSkillPayload,
  ): Promise<StudentSkill> =>
    apiClient.put<StudentSkill>(`/skills/student/me/${skillId}`, payload),

  removeSkill: (skillId: string): Promise<{ success: boolean; message: string }> =>
    apiClient.delete<{ success: boolean; message: string }>(`/skills/student/me/${skillId}`),
};
