export interface InstitutionSimple {
  id: string;
  name: string;
  code?: string;
  type?: string;
  city?: string;
}

export interface StudentProject {
  id: string;
  title: string;
  description: string;
  repoUrl?: string;
  demoUrl?: string;
  technologies: string[];
}

export interface StudentCertification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  credentialUrl?: string;
  credentialId?: string;
}

export interface StudentProfileData {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber?: string;
  bio?: string;
  avatarUrl?: string;
  institutionId?: string;
  institution?: InstitutionSimple;
  degree?: string;
  department?: string;
  graduationYear?: number;
  cgpa?: number;
  careerInterests: string[];
  preferredRoles: string[];
  preferredLocations: string[];
  projects: StudentProject[];
  certifications: StudentCertification[];
}

export interface StudentProfileResponse {
  profile: StudentProfileData;
  completenessScore: number;
  completenessBreakdown: {
    basicInfo: number;
    education: number;
    careerPreferences: number;
    projectsAndCertifications: number;
  };
}

export interface FacultyProfileData {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber?: string;
  designation?: string;
  department?: string;
  institutionId?: string;
  institution?: InstitutionSimple;
  academicBackground?: string;
  areasOfExpertise: string[];
  researchInterests: string[];
  industryInterests: string[];
}

export interface IndustryProfileData {
  id: string;
  userId: string;
  companyName: string;
  industryType: string;
  description?: string;
  website?: string;
  companySize?: string;
  headquarters?: string;
  contactEmail?: string;
  contactPhone?: string;
  isVerified: boolean;
}

export interface InstitutionProfileData {
  id: string;
  userId: string;
  name: string;
  code?: string;
  type: string;
  address?: string;
  city?: string;
  state?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  departments: string[];
  isVerified: boolean;
}
