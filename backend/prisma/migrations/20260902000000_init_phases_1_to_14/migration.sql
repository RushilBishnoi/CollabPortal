-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'FACULTY', 'INDUSTRY', 'INSTITUTION_ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('INTERNSHIP', 'JOB', 'APPRENTICESHIP', 'LIVE_PROJECT');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SAVED', 'APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('RESUME', 'TRANSCRIPT', 'CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "InterviewMode" AS ENUM ('ONLINE_MEETING', 'IN_PERSON', 'TELEPHONIC');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'RESCHEDULED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProficiencyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('MULTIPLE_CHOICE', 'CODING', 'PROJECT_BASED');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'TIMED_OUT', 'ABANDONED');

-- CreateEnum
CREATE TYPE "CollaborationType" AS ENUM ('GUEST_LECTURE', 'WORKSHOP', 'FDP', 'INDUSTRIAL_TRAINING', 'RESEARCH', 'CONSULTANCY', 'LIVE_PROJECT');

-- CreateEnum
CREATE TYPE "CollaborationStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CollaborationAudience" AS ENUM ('FACULTY', 'STUDENT', 'BOTH');

-- CreateEnum
CREATE TYPE "CollaborationMode" AS ENUM ('ONLINE', 'IN_PERSON', 'HYBRID');

-- CreateEnum
CREATE TYPE "LearningResourceType" AS ENUM ('VIDEO', 'ARTICLE', 'DOCUMENTATION', 'COURSE', 'INTERACTIVE_LAB', 'PRACTICE_PROJECT', 'BOOK');

-- CreateEnum
CREATE TYPE "LearningResourceDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "LearningPathStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StudentResourceStatus" AS ENUM ('SAVED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "StudentPathEnrollmentStatus" AS ENUM ('ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'ISSUED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PlacementStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'CONFIRMED', 'JOINED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PlacementDocumentType" AS ENUM ('OFFER_LETTER', 'JOINING_LETTER', 'PAYSLIP', 'NOC', 'COMPLETION_CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'INTERNSHIP_TO_JOB', 'CONTRACT', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "MentorRoleType" AS ENUM ('INDUSTRY', 'FACULTY');

-- CreateEnum
CREATE TYPE "MentorshipRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MentorshipStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "MentorshipSessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "MentorshipGoalStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'ACHIEVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "avatarUrl" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institution_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" TEXT NOT NULL DEFAULT 'UNIVERSITY',
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "website" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "departments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institution_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "institutionId" TEXT,
    "degree" TEXT,
    "department" TEXT,
    "graduationYear" INTEGER,
    "cgpa" DOUBLE PRECISION,
    "careerInterests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredLocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_skills" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "proficiency" "ProficiencyLevel" NOT NULL,
    "score" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'SELF_REPORTED',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "lastAssessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "skillId" TEXT NOT NULL,
    "type" "AssessmentType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "passingScore" INTEGER NOT NULL DEFAULT 70,
    "durationMinutes" INTEGER NOT NULL DEFAULT 20,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_questions" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionText" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_attempts" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" DOUBLE PRECISION,
    "passed" BOOLEAN,
    "totalPoints" INTEGER,
    "earnedPoints" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attempt_answers" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "isCorrect" BOOLEAN,
    "earnedPoints" INTEGER DEFAULT 0,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attempt_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_roles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "minExperienceYears" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_role_skills" (
    "id" TEXT NOT NULL,
    "careerRoleId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "requiredProficiency" "ProficiencyLevel" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_role_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "industryProfileId" TEXT NOT NULL,
    "careerRoleId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "opportunityType" "OpportunityType" NOT NULL DEFAULT 'INTERNSHIP',
    "status" "OpportunityStatus" NOT NULL DEFAULT 'PUBLISHED',
    "location" TEXT NOT NULL DEFAULT 'Remote',
    "isRemote" BOOLEAN NOT NULL DEFAULT false,
    "stipend" DOUBLE PRECISION,
    "stipendCurrency" TEXT NOT NULL DEFAULT 'INR',
    "stipendPeriod" TEXT NOT NULL DEFAULT 'MONTHLY',
    "minCgpa" DOUBLE PRECISION,
    "minGraduationYear" INTEGER,
    "maxGraduationYear" INTEGER,
    "eligibleDepartments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deadline" TIMESTAMP(3),
    "positionsCount" INTEGER NOT NULL DEFAULT 1,
    "maxApplications" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_skills" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "requiredProficiency" "ProficiencyLevel" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "coverLetter" TEXT,
    "matchScoreSnapshot" DOUBLE PRECISION NOT NULL,
    "matchBreakdownSnapshot" JSONB NOT NULL,
    "recruiterNotes" TEXT,
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_documents" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL DEFAULT 'RESUME',
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status_history" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStatus" "ApplicationStatus",
    "toStatus" "ApplicationStatus" NOT NULL,
    "changedByRole" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 45,
    "mode" "InterviewMode" NOT NULL DEFAULT 'ONLINE_MEETING',
    "meetingLink" TEXT,
    "interviewer" TEXT,
    "instructions" TEXT,
    "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
    "recruiterNotes" TEXT,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_experiences" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_projects" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "repoUrl" TEXT,
    "demoUrl" TEXT,
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_certifications" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuingOrganization" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "credentialUrl" TEXT,
    "credentialId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "designation" TEXT,
    "department" TEXT,
    "institutionId" TEXT,
    "academicBackground" TEXT,
    "areasOfExpertise" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "researchInterests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "industryInterests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculty_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industry_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "industryType" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "companySize" TEXT,
    "headquarters" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "industry_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_health_logs" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "uptime" DOUBLE PRECISION NOT NULL,
    "version" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_health_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaborations" (
    "id" TEXT NOT NULL,
    "industryProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "collaborationType" "CollaborationType" NOT NULL DEFAULT 'WORKSHOP',
    "status" "CollaborationStatus" NOT NULL DEFAULT 'DRAFT',
    "targetAudience" "CollaborationAudience" NOT NULL DEFAULT 'BOTH',
    "mode" "CollaborationMode" NOT NULL DEFAULT 'ONLINE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "durationDays" INTEGER,
    "sessionCount" INTEGER,
    "location" TEXT,
    "meetingLink" TEXT,
    "maxParticipants" INTEGER,
    "eligibleDepartments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "domainTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stipend" DOUBLE PRECISION,
    "stipendCurrency" TEXT NOT NULL DEFAULT 'INR',
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "instructions" TEXT,
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collaborations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaboration_participations" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "facultyProfileId" TEXT,
    "studentProfileId" TEXT,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'PENDING',
    "motivation" TEXT,
    "relevantExperience" TEXT,
    "industryNotes" TEXT,
    "rejectionReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collaboration_participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaboration_status_history" (
    "id" TEXT NOT NULL,
    "participationId" TEXT NOT NULL,
    "fromStatus" "ParticipationStatus",
    "toStatus" "ParticipationStatus" NOT NULL,
    "changedByRole" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collaboration_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "resourceType" "LearningResourceType" NOT NULL DEFAULT 'ARTICLE',
    "difficulty" "LearningResourceDifficulty" NOT NULL DEFAULT 'BEGINNER',
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 30,
    "skillId" TEXT NOT NULL,
    "targetProficiency" "ProficiencyLevel" NOT NULL DEFAULT 'BEGINNER',
    "authorRole" "UserRole" NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "provider" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rating" DOUBLE PRECISION DEFAULT 5.0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "careerRoleId" TEXT,
    "targetProficiency" "ProficiencyLevel" NOT NULL DEFAULT 'INTERMEDIATE',
    "status" "LearningPathStatus" NOT NULL DEFAULT 'PUBLISHED',
    "estimatedHours" INTEGER NOT NULL DEFAULT 10,
    "authorRole" "UserRole" NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "institutionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_path_items" (
    "id" TEXT NOT NULL,
    "learningPathId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "milestoneNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_path_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_resource_progress" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "status" "StudentResourceStatus" NOT NULL DEFAULT 'SAVED',
    "timeSpentMinutes" INTEGER NOT NULL DEFAULT 0,
    "rating" INTEGER,
    "notes" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_resource_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_path_enrollments" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "learningPathId" TEXT NOT NULL,
    "status" "StudentPathEnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "progressPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "completedItemsCount" INTEGER NOT NULL DEFAULT 0,
    "totalItemsCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_path_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_offers" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "industryProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
    "ctcAnnual" DOUBLE PRECISION,
    "baseSalaryMonthly" DOUBLE PRECISION,
    "stipendMonthly" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "offerExpiryDate" TIMESTAMP(3) NOT NULL,
    "workLocation" TEXT NOT NULL DEFAULT 'Remote',
    "workMode" TEXT NOT NULL DEFAULT 'IN_PERSON',
    "department" TEXT,
    "description" TEXT,
    "termsAndConditions" TEXT,
    "benefitsSummary" TEXT,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "studentResponseAt" TIMESTAMP(3),
    "studentDeclineReason" TEXT,
    "studentNotes" TEXT,
    "issuedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placements" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "institutionId" TEXT,
    "industryProfileId" TEXT NOT NULL,
    "status" "PlacementStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verifiedByUserId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "nocIssued" BOOLEAN NOT NULL DEFAULT false,
    "nocReferenceNumber" TEXT,
    "joiningConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "joiningConfirmedAt" TIMESTAMP(3),
    "actualJoiningDate" TIMESTAMP(3),
    "annualCtcSnapshot" DOUBLE PRECISION,
    "companyNameSnapshot" TEXT NOT NULL,
    "jobTitleSnapshot" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_documents" (
    "id" TEXT NOT NULL,
    "offerId" TEXT,
    "placementId" TEXT,
    "documentType" "PlacementDocumentType" NOT NULL DEFAULT 'OFFER_LETTER',
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "uploadedByRole" "UserRole" NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placement_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_status_history" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "fromStatus" "OfferStatus",
    "toStatus" "OfferStatus" NOT NULL,
    "changedByRole" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offer_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_status_history" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "fromStatus" "PlacementStatus",
    "toStatus" "PlacementStatus" NOT NULL,
    "changedByRole" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placement_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mentorRoleType" "MentorRoleType" NOT NULL DEFAULT 'INDUSTRY',
    "headline" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "companyOrInstitution" TEXT NOT NULL,
    "yearsOfExperience" INTEGER NOT NULL DEFAULT 1,
    "maxMentees" INTEGER NOT NULL DEFAULT 5,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "defaultMeetingPlatform" TEXT NOT NULL DEFAULT 'GOOGLE_MEET',
    "defaultMeetingLink" TEXT,
    "linkedInUrl" TEXT,
    "githubUrl" TEXT,
    "totalSessionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_skills" (
    "id" TEXT NOT NULL,
    "mentorProfileId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_career_roles" (
    "id" TEXT NOT NULL,
    "mentorProfileId" TEXT NOT NULL,
    "careerRoleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_career_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_availabilities" (
    "id" TEXT NOT NULL,
    "mentorProfileId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDurationMins" INTEGER NOT NULL DEFAULT 45,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorship_requests" (
    "id" TEXT NOT NULL,
    "mentorProfileId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "status" "MentorshipRequestStatus" NOT NULL DEFAULT 'PENDING',
    "statementOfPurpose" TEXT NOT NULL,
    "targetCareerRoleId" TEXT,
    "expectedDurationWeeks" INTEGER NOT NULL DEFAULT 8,
    "rejectionReason" TEXT,
    "mentorResponseNotes" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentorship_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorships" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "mentorProfileId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "status" "MentorshipStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentorships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorship_goals" (
    "id" TEXT NOT NULL,
    "mentorshipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3),
    "status" "MentorshipGoalStatus" NOT NULL DEFAULT 'PENDING',
    "linkedSkillId" TEXT,
    "linkedLearningPathId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentorship_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentorship_sessions" (
    "id" TEXT NOT NULL,
    "mentorshipId" TEXT,
    "mentorProfileId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 45,
    "status" "MentorshipSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "meetingPlatform" TEXT NOT NULL DEFAULT 'GOOGLE_MEET',
    "meetingLink" TEXT,
    "location" TEXT,
    "mentorNotes" TEXT,
    "studentNotes" TEXT,
    "sharedSummary" TEXT,
    "studentRating" INTEGER,
    "studentFeedback" TEXT,
    "cancellationReason" TEXT,
    "cancelledByRole" "UserRole",
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentorship_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "institution_profiles_userId_key" ON "institution_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "institution_profiles_code_key" ON "institution_profiles"("code");

-- CreateIndex
CREATE INDEX "institution_profiles_userId_idx" ON "institution_profiles"("userId");

-- CreateIndex
CREATE INDEX "institution_profiles_name_idx" ON "institution_profiles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE INDEX "student_profiles_userId_idx" ON "student_profiles"("userId");

-- CreateIndex
CREATE INDEX "student_profiles_institutionId_idx" ON "student_profiles"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_categories_name_key" ON "skill_categories"("name");

-- CreateIndex
CREATE INDEX "skill_categories_parentId_idx" ON "skill_categories"("parentId");

-- CreateIndex
CREATE INDEX "skill_categories_isActive_idx" ON "skill_categories"("isActive");

-- CreateIndex
CREATE INDEX "skills_categoryId_idx" ON "skills"("categoryId");

-- CreateIndex
CREATE INDEX "skills_name_idx" ON "skills"("name");

-- CreateIndex
CREATE INDEX "skills_isActive_idx" ON "skills"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_categoryId_key" ON "skills"("name", "categoryId");

-- CreateIndex
CREATE INDEX "student_skills_studentProfileId_idx" ON "student_skills"("studentProfileId");

-- CreateIndex
CREATE INDEX "student_skills_skillId_idx" ON "student_skills"("skillId");

-- CreateIndex
CREATE INDEX "student_skills_verificationStatus_idx" ON "student_skills"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "student_skills_studentProfileId_skillId_key" ON "student_skills"("studentProfileId", "skillId");

-- CreateIndex
CREATE INDEX "assessments_skillId_idx" ON "assessments"("skillId");

-- CreateIndex
CREATE INDEX "assessments_isActive_idx" ON "assessments"("isActive");

-- CreateIndex
CREATE INDEX "assessment_questions_assessmentId_idx" ON "assessment_questions"("assessmentId");

-- CreateIndex
CREATE INDEX "question_options_questionId_idx" ON "question_options"("questionId");

-- CreateIndex
CREATE INDEX "assessment_attempts_studentProfileId_idx" ON "assessment_attempts"("studentProfileId");

-- CreateIndex
CREATE INDEX "assessment_attempts_assessmentId_idx" ON "assessment_attempts"("assessmentId");

-- CreateIndex
CREATE INDEX "assessment_attempts_status_idx" ON "assessment_attempts"("status");

-- CreateIndex
CREATE INDEX "attempt_answers_attemptId_idx" ON "attempt_answers"("attemptId");

-- CreateIndex
CREATE INDEX "attempt_answers_questionId_idx" ON "attempt_answers"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "attempt_answers_attemptId_questionId_key" ON "attempt_answers"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "career_roles_slug_key" ON "career_roles"("slug");

-- CreateIndex
CREATE INDEX "career_roles_slug_idx" ON "career_roles"("slug");

-- CreateIndex
CREATE INDEX "career_roles_category_idx" ON "career_roles"("category");

-- CreateIndex
CREATE INDEX "career_roles_isActive_idx" ON "career_roles"("isActive");

-- CreateIndex
CREATE INDEX "career_role_skills_careerRoleId_idx" ON "career_role_skills"("careerRoleId");

-- CreateIndex
CREATE INDEX "career_role_skills_skillId_idx" ON "career_role_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "career_role_skills_careerRoleId_skillId_key" ON "career_role_skills"("careerRoleId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_slug_key" ON "opportunities"("slug");

-- CreateIndex
CREATE INDEX "opportunities_industryProfileId_idx" ON "opportunities"("industryProfileId");

-- CreateIndex
CREATE INDEX "opportunities_careerRoleId_idx" ON "opportunities"("careerRoleId");

-- CreateIndex
CREATE INDEX "opportunities_opportunityType_idx" ON "opportunities"("opportunityType");

-- CreateIndex
CREATE INDEX "opportunities_status_idx" ON "opportunities"("status");

-- CreateIndex
CREATE INDEX "opportunities_isRemote_idx" ON "opportunities"("isRemote");

-- CreateIndex
CREATE INDEX "opportunities_slug_idx" ON "opportunities"("slug");

-- CreateIndex
CREATE INDEX "opportunity_skills_opportunityId_idx" ON "opportunity_skills"("opportunityId");

-- CreateIndex
CREATE INDEX "opportunity_skills_skillId_idx" ON "opportunity_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_skills_opportunityId_skillId_key" ON "opportunity_skills"("opportunityId", "skillId");

-- CreateIndex
CREATE INDEX "applications_opportunityId_idx" ON "applications"("opportunityId");

-- CreateIndex
CREATE INDEX "applications_studentProfileId_idx" ON "applications"("studentProfileId");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE INDEX "applications_submittedAt_idx" ON "applications"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "applications_studentProfileId_opportunityId_key" ON "applications"("studentProfileId", "opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "application_documents_storageKey_key" ON "application_documents"("storageKey");

-- CreateIndex
CREATE INDEX "application_documents_applicationId_idx" ON "application_documents"("applicationId");

-- CreateIndex
CREATE INDEX "application_documents_storageKey_idx" ON "application_documents"("storageKey");

-- CreateIndex
CREATE INDEX "application_status_history_applicationId_idx" ON "application_status_history"("applicationId");

-- CreateIndex
CREATE INDEX "application_status_history_createdAt_idx" ON "application_status_history"("createdAt");

-- CreateIndex
CREATE INDEX "interviews_applicationId_idx" ON "interviews"("applicationId");

-- CreateIndex
CREATE INDEX "interviews_scheduledAt_idx" ON "interviews"("scheduledAt");

-- CreateIndex
CREATE INDEX "student_experiences_studentProfileId_idx" ON "student_experiences"("studentProfileId");

-- CreateIndex
CREATE INDEX "student_projects_studentProfileId_idx" ON "student_projects"("studentProfileId");

-- CreateIndex
CREATE INDEX "student_certifications_studentProfileId_idx" ON "student_certifications"("studentProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_profiles_userId_key" ON "faculty_profiles"("userId");

-- CreateIndex
CREATE INDEX "faculty_profiles_userId_idx" ON "faculty_profiles"("userId");

-- CreateIndex
CREATE INDEX "faculty_profiles_institutionId_idx" ON "faculty_profiles"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "industry_profiles_userId_key" ON "industry_profiles"("userId");

-- CreateIndex
CREATE INDEX "industry_profiles_userId_idx" ON "industry_profiles"("userId");

-- CreateIndex
CREATE INDEX "industry_profiles_companyName_idx" ON "industry_profiles"("companyName");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_tokenHash_idx" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "system_health_logs_createdAt_idx" ON "system_health_logs"("createdAt");

-- CreateIndex
CREATE INDEX "collaborations_industryProfileId_idx" ON "collaborations"("industryProfileId");

-- CreateIndex
CREATE INDEX "collaborations_collaborationType_idx" ON "collaborations"("collaborationType");

-- CreateIndex
CREATE INDEX "collaborations_status_idx" ON "collaborations"("status");

-- CreateIndex
CREATE INDEX "collaborations_targetAudience_idx" ON "collaborations"("targetAudience");

-- CreateIndex
CREATE INDEX "collaborations_mode_idx" ON "collaborations"("mode");

-- CreateIndex
CREATE INDEX "collaborations_deadline_idx" ON "collaborations"("deadline");

-- CreateIndex
CREATE INDEX "collaborations_startDate_idx" ON "collaborations"("startDate");

-- CreateIndex
CREATE INDEX "collaboration_participations_collaborationId_idx" ON "collaboration_participations"("collaborationId");

-- CreateIndex
CREATE INDEX "collaboration_participations_facultyProfileId_idx" ON "collaboration_participations"("facultyProfileId");

-- CreateIndex
CREATE INDEX "collaboration_participations_studentProfileId_idx" ON "collaboration_participations"("studentProfileId");

-- CreateIndex
CREATE INDEX "collaboration_participations_status_idx" ON "collaboration_participations"("status");

-- CreateIndex
CREATE INDEX "collaboration_participations_requestedAt_idx" ON "collaboration_participations"("requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "collaboration_participations_collaborationId_facultyProfile_key" ON "collaboration_participations"("collaborationId", "facultyProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "collaboration_participations_collaborationId_studentProfile_key" ON "collaboration_participations"("collaborationId", "studentProfileId");

-- CreateIndex
CREATE INDEX "collaboration_status_history_participationId_idx" ON "collaboration_status_history"("participationId");

-- CreateIndex
CREATE INDEX "collaboration_status_history_createdAt_idx" ON "collaboration_status_history"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "learning_resources_slug_key" ON "learning_resources"("slug");

-- CreateIndex
CREATE INDEX "learning_resources_skillId_idx" ON "learning_resources"("skillId");

-- CreateIndex
CREATE INDEX "learning_resources_resourceType_idx" ON "learning_resources"("resourceType");

-- CreateIndex
CREATE INDEX "learning_resources_difficulty_idx" ON "learning_resources"("difficulty");

-- CreateIndex
CREATE INDEX "learning_resources_authorRole_idx" ON "learning_resources"("authorRole");

-- CreateIndex
CREATE INDEX "learning_resources_isPublished_idx" ON "learning_resources"("isPublished");

-- CreateIndex
CREATE INDEX "learning_resources_slug_idx" ON "learning_resources"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "learning_paths_slug_key" ON "learning_paths"("slug");

-- CreateIndex
CREATE INDEX "learning_paths_careerRoleId_idx" ON "learning_paths"("careerRoleId");

-- CreateIndex
CREATE INDEX "learning_paths_status_idx" ON "learning_paths"("status");

-- CreateIndex
CREATE INDEX "learning_paths_authorRole_idx" ON "learning_paths"("authorRole");

-- CreateIndex
CREATE INDEX "learning_paths_slug_idx" ON "learning_paths"("slug");

-- CreateIndex
CREATE INDEX "learning_path_items_learningPathId_idx" ON "learning_path_items"("learningPathId");

-- CreateIndex
CREATE INDEX "learning_path_items_resourceId_idx" ON "learning_path_items"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_items_learningPathId_resourceId_key" ON "learning_path_items"("learningPathId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_items_learningPathId_order_key" ON "learning_path_items"("learningPathId", "order");

-- CreateIndex
CREATE INDEX "student_resource_progress_studentProfileId_idx" ON "student_resource_progress"("studentProfileId");

-- CreateIndex
CREATE INDEX "student_resource_progress_resourceId_idx" ON "student_resource_progress"("resourceId");

-- CreateIndex
CREATE INDEX "student_resource_progress_status_idx" ON "student_resource_progress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "student_resource_progress_studentProfileId_resourceId_key" ON "student_resource_progress"("studentProfileId", "resourceId");

-- CreateIndex
CREATE INDEX "student_path_enrollments_studentProfileId_idx" ON "student_path_enrollments"("studentProfileId");

-- CreateIndex
CREATE INDEX "student_path_enrollments_learningPathId_idx" ON "student_path_enrollments"("learningPathId");

-- CreateIndex
CREATE INDEX "student_path_enrollments_status_idx" ON "student_path_enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "student_path_enrollments_studentProfileId_learningPathId_key" ON "student_path_enrollments"("studentProfileId", "learningPathId");

-- CreateIndex
CREATE UNIQUE INDEX "placement_offers_applicationId_key" ON "placement_offers"("applicationId");

-- CreateIndex
CREATE INDEX "placement_offers_applicationId_idx" ON "placement_offers"("applicationId");

-- CreateIndex
CREATE INDEX "placement_offers_studentProfileId_idx" ON "placement_offers"("studentProfileId");

-- CreateIndex
CREATE INDEX "placement_offers_industryProfileId_idx" ON "placement_offers"("industryProfileId");

-- CreateIndex
CREATE INDEX "placement_offers_opportunityId_idx" ON "placement_offers"("opportunityId");

-- CreateIndex
CREATE INDEX "placement_offers_status_idx" ON "placement_offers"("status");

-- CreateIndex
CREATE INDEX "placement_offers_offerExpiryDate_idx" ON "placement_offers"("offerExpiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "placements_offerId_key" ON "placements"("offerId");

-- CreateIndex
CREATE INDEX "placements_offerId_idx" ON "placements"("offerId");

-- CreateIndex
CREATE INDEX "placements_studentProfileId_idx" ON "placements"("studentProfileId");

-- CreateIndex
CREATE INDEX "placements_institutionId_idx" ON "placements"("institutionId");

-- CreateIndex
CREATE INDEX "placements_industryProfileId_idx" ON "placements"("industryProfileId");

-- CreateIndex
CREATE INDEX "placements_status_idx" ON "placements"("status");

-- CreateIndex
CREATE UNIQUE INDEX "placement_documents_storageKey_key" ON "placement_documents"("storageKey");

-- CreateIndex
CREATE INDEX "placement_documents_offerId_idx" ON "placement_documents"("offerId");

-- CreateIndex
CREATE INDEX "placement_documents_placementId_idx" ON "placement_documents"("placementId");

-- CreateIndex
CREATE INDEX "placement_documents_storageKey_idx" ON "placement_documents"("storageKey");

-- CreateIndex
CREATE INDEX "offer_status_history_offerId_idx" ON "offer_status_history"("offerId");

-- CreateIndex
CREATE INDEX "offer_status_history_createdAt_idx" ON "offer_status_history"("createdAt");

-- CreateIndex
CREATE INDEX "placement_status_history_placementId_idx" ON "placement_status_history"("placementId");

-- CreateIndex
CREATE INDEX "placement_status_history_createdAt_idx" ON "placement_status_history"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_profiles_userId_key" ON "mentor_profiles"("userId");

-- CreateIndex
CREATE INDEX "mentor_profiles_userId_idx" ON "mentor_profiles"("userId");

-- CreateIndex
CREATE INDEX "mentor_profiles_mentorRoleType_idx" ON "mentor_profiles"("mentorRoleType");

-- CreateIndex
CREATE INDEX "mentor_profiles_isAvailable_idx" ON "mentor_profiles"("isAvailable");

-- CreateIndex
CREATE INDEX "mentor_profiles_averageRating_idx" ON "mentor_profiles"("averageRating");

-- CreateIndex
CREATE INDEX "mentor_skills_mentorProfileId_idx" ON "mentor_skills"("mentorProfileId");

-- CreateIndex
CREATE INDEX "mentor_skills_skillId_idx" ON "mentor_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_skills_mentorProfileId_skillId_key" ON "mentor_skills"("mentorProfileId", "skillId");

-- CreateIndex
CREATE INDEX "mentor_career_roles_mentorProfileId_idx" ON "mentor_career_roles"("mentorProfileId");

-- CreateIndex
CREATE INDEX "mentor_career_roles_careerRoleId_idx" ON "mentor_career_roles"("careerRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_career_roles_mentorProfileId_careerRoleId_key" ON "mentor_career_roles"("mentorProfileId", "careerRoleId");

-- CreateIndex
CREATE INDEX "mentor_availabilities_mentorProfileId_idx" ON "mentor_availabilities"("mentorProfileId");

-- CreateIndex
CREATE INDEX "mentor_availabilities_dayOfWeek_idx" ON "mentor_availabilities"("dayOfWeek");

-- CreateIndex
CREATE INDEX "mentorship_requests_mentorProfileId_idx" ON "mentorship_requests"("mentorProfileId");

-- CreateIndex
CREATE INDEX "mentorship_requests_studentProfileId_idx" ON "mentorship_requests"("studentProfileId");

-- CreateIndex
CREATE INDEX "mentorship_requests_status_idx" ON "mentorship_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "mentorships_requestId_key" ON "mentorships"("requestId");

-- CreateIndex
CREATE INDEX "mentorships_mentorProfileId_idx" ON "mentorships"("mentorProfileId");

-- CreateIndex
CREATE INDEX "mentorships_studentProfileId_idx" ON "mentorships"("studentProfileId");

-- CreateIndex
CREATE INDEX "mentorships_status_idx" ON "mentorships"("status");

-- CreateIndex
CREATE INDEX "mentorship_goals_mentorshipId_idx" ON "mentorship_goals"("mentorshipId");

-- CreateIndex
CREATE INDEX "mentorship_goals_status_idx" ON "mentorship_goals"("status");

-- CreateIndex
CREATE INDEX "mentorship_sessions_mentorProfileId_idx" ON "mentorship_sessions"("mentorProfileId");

-- CreateIndex
CREATE INDEX "mentorship_sessions_studentProfileId_idx" ON "mentorship_sessions"("studentProfileId");

-- CreateIndex
CREATE INDEX "mentorship_sessions_mentorshipId_idx" ON "mentorship_sessions"("mentorshipId");

-- CreateIndex
CREATE INDEX "mentorship_sessions_scheduledAt_idx" ON "mentorship_sessions"("scheduledAt");

-- CreateIndex
CREATE INDEX "mentorship_sessions_status_idx" ON "mentorship_sessions"("status");

-- AddForeignKey
ALTER TABLE "institution_profiles" ADD CONSTRAINT "institution_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institution_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_categories" ADD CONSTRAINT "skill_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "skill_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "skill_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_options" ADD CONSTRAINT "question_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "assessment_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "assessment_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "assessment_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_role_skills" ADD CONSTRAINT "career_role_skills_careerRoleId_fkey" FOREIGN KEY ("careerRoleId") REFERENCES "career_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_role_skills" ADD CONSTRAINT "career_role_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_industryProfileId_fkey" FOREIGN KEY ("industryProfileId") REFERENCES "industry_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_careerRoleId_fkey" FOREIGN KEY ("careerRoleId") REFERENCES "career_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_skills" ADD CONSTRAINT "opportunity_skills_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_skills" ADD CONSTRAINT "opportunity_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_experiences" ADD CONSTRAINT "student_experiences_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_projects" ADD CONSTRAINT "student_projects_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_certifications" ADD CONSTRAINT "student_certifications_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_profiles" ADD CONSTRAINT "faculty_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_profiles" ADD CONSTRAINT "faculty_profiles_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institution_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "industry_profiles" ADD CONSTRAINT "industry_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborations" ADD CONSTRAINT "collaborations_industryProfileId_fkey" FOREIGN KEY ("industryProfileId") REFERENCES "industry_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaboration_participations" ADD CONSTRAINT "collaboration_participations_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "collaborations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaboration_participations" ADD CONSTRAINT "collaboration_participations_facultyProfileId_fkey" FOREIGN KEY ("facultyProfileId") REFERENCES "faculty_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaboration_participations" ADD CONSTRAINT "collaboration_participations_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaboration_status_history" ADD CONSTRAINT "collaboration_status_history_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "collaboration_participations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_resources" ADD CONSTRAINT "learning_resources_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_careerRoleId_fkey" FOREIGN KEY ("careerRoleId") REFERENCES "career_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_items" ADD CONSTRAINT "learning_path_items_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_path_items" ADD CONSTRAINT "learning_path_items_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "learning_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_resource_progress" ADD CONSTRAINT "student_resource_progress_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_resource_progress" ADD CONSTRAINT "student_resource_progress_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "learning_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_path_enrollments" ADD CONSTRAINT "student_path_enrollments_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_path_enrollments" ADD CONSTRAINT "student_path_enrollments_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_industryProfileId_fkey" FOREIGN KEY ("industryProfileId") REFERENCES "industry_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "placement_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institution_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_industryProfileId_fkey" FOREIGN KEY ("industryProfileId") REFERENCES "industry_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_documents" ADD CONSTRAINT "placement_documents_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "placement_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_documents" ADD CONSTRAINT "placement_documents_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "placements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_status_history" ADD CONSTRAINT "offer_status_history_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "placement_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_status_history" ADD CONSTRAINT "placement_status_history_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "placements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_skills" ADD CONSTRAINT "mentor_skills_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "mentor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_skills" ADD CONSTRAINT "mentor_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_career_roles" ADD CONSTRAINT "mentor_career_roles_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "mentor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_career_roles" ADD CONSTRAINT "mentor_career_roles_careerRoleId_fkey" FOREIGN KEY ("careerRoleId") REFERENCES "career_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_availabilities" ADD CONSTRAINT "mentor_availabilities_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "mentor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "mentor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_targetCareerRoleId_fkey" FOREIGN KEY ("targetCareerRoleId") REFERENCES "career_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "mentorship_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "mentor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorships" ADD CONSTRAINT "mentorships_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_goals" ADD CONSTRAINT "mentorship_goals_mentorshipId_fkey" FOREIGN KEY ("mentorshipId") REFERENCES "mentorships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_goals" ADD CONSTRAINT "mentorship_goals_linkedSkillId_fkey" FOREIGN KEY ("linkedSkillId") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_goals" ADD CONSTRAINT "mentorship_goals_linkedLearningPathId_fkey" FOREIGN KEY ("linkedLearningPathId") REFERENCES "learning_paths"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_mentorshipId_fkey" FOREIGN KEY ("mentorshipId") REFERENCES "mentorships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_mentorProfileId_fkey" FOREIGN KEY ("mentorProfileId") REFERENCES "mentor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentorship_sessions" ADD CONSTRAINT "mentorship_sessions_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

