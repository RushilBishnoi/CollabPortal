import { apiClient } from './api-client';
import {
  StudentProfileResponse,
  FacultyProfileData,
  IndustryProfileData,
  InstitutionProfileData,
  InstitutionSimple,
  StudentProject,
  StudentCertification,
} from '../types/profile';

export const profileApi = {
  // Student Profiles
  getStudentProfileMe: (): Promise<StudentProfileResponse> =>
    apiClient.get<StudentProfileResponse>('/profiles/student/me'),

  updateStudentProfileMe: (data: any): Promise<StudentProfileResponse> =>
    apiClient.put<StudentProfileResponse>('/profiles/student/me', data),

  addStudentProject: (data: { title: string; description: string; repoUrl?: string; demoUrl?: string; technologies?: string[] }): Promise<StudentProject> =>
    apiClient.post<StudentProject>('/profiles/student/me/projects', data),

  deleteStudentProject: (id: string): Promise<{ success: boolean; message: string }> =>
    apiClient.delete<{ success: boolean; message: string }>(`/profiles/student/me/projects/${id}`),

  addStudentCertification: (data: { name: string; issuingOrganization: string; issueDate: string; credentialUrl?: string; credentialId?: string }): Promise<StudentCertification> =>
    apiClient.post<StudentCertification>('/profiles/student/me/certifications', data),

  deleteStudentCertification: (id: string): Promise<{ success: boolean; message: string }> =>
    apiClient.delete<{ success: boolean; message: string }>(`/profiles/student/me/certifications/${id}`),

  // Faculty Profiles
  getFacultyProfileMe: (): Promise<FacultyProfileData> =>
    apiClient.get<FacultyProfileData>('/profiles/faculty/me'),

  updateFacultyProfileMe: (data: Partial<FacultyProfileData>): Promise<FacultyProfileData> =>
    apiClient.put<FacultyProfileData>('/profiles/faculty/me', data),

  // Industry Profiles
  getIndustryProfileMe: (): Promise<IndustryProfileData> =>
    apiClient.get<IndustryProfileData>('/profiles/industry/me'),

  updateIndustryProfileMe: (data: Partial<IndustryProfileData>): Promise<IndustryProfileData> =>
    apiClient.put<IndustryProfileData>('/profiles/industry/me', data),

  // Institution Profiles
  getInstitutionProfileMe: (): Promise<InstitutionProfileData> =>
    apiClient.get<InstitutionProfileData>('/profiles/institution/me'),

  updateInstitutionProfileMe: (data: Partial<InstitutionProfileData>): Promise<InstitutionProfileData> =>
    apiClient.put<InstitutionProfileData>('/profiles/institution/me', data),

  listInstitutions: (): Promise<InstitutionSimple[]> =>
    apiClient.get<InstitutionSimple[]>('/profiles/institution'),
};
