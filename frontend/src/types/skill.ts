export type ProficiencyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface SkillCategorySimple {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
}

export interface SkillCategory extends SkillCategorySimple {
  children?: SkillCategorySimple[];
}

export interface Skill {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: SkillCategorySimple;
}

export interface StudentSkill {
  id: string;
  studentProfileId: string;
  skillId: string;
  proficiency: ProficiencyLevel;
  score?: number | null;
  source: string;
  verificationStatus: VerificationStatus;
  lastAssessedAt?: string | null;
  createdAt: string;
  skill: Skill;
}

export interface StudentSkillsResponse {
  studentProfileId: string;
  skills: StudentSkill[];
}

export interface CreateStudentSkillPayload {
  skillId: string;
  proficiency: ProficiencyLevel;
}

export interface UpdateStudentSkillPayload {
  proficiency: ProficiencyLevel;
}
