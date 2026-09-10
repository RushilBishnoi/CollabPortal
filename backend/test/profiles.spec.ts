import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudentProfilesService } from '../src/modules/profiles/services/student-profiles.service';
import { FacultyProfilesService } from '../src/modules/profiles/services/faculty-profiles.service';
import { IndustryProfilesService } from '../src/modules/profiles/services/industry-profiles.service';
import { InstitutionProfilesService } from '../src/modules/profiles/services/institution-profiles.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('Phase 4 Profiles Module Unit & Security Tests', () => {
  let studentService: StudentProfilesService;
  let facultyService: FacultyProfilesService;
  let industryService: IndustryProfilesService;
  let institutionService: InstitutionProfilesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      studentProfile: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      studentProject: {
        create: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      studentCertification: {
        create: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      facultyProfile: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      industryProfile: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      institutionProfile: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
    };

    studentService = new StudentProfilesService(mockPrisma);
    facultyService = new FacultyProfilesService(mockPrisma);
    industryService = new IndustryProfilesService(mockPrisma);
    institutionService = new InstitutionProfilesService(mockPrisma);
  });

  describe('Student Profile Completeness Calculation', () => {
    it('should calculate 0% for empty profile', () => {
      const { score, breakdown } = studentService.calculateCompleteness({});
      expect(score).toBe(0);
      expect(breakdown.basicInfo).toBe(0);
      expect(breakdown.education).toBe(0);
      expect(breakdown.careerPreferences).toBe(0);
      expect(breakdown.projectsAndCertifications).toBe(0);
    });

    it('should calculate partial score for basic info and education', () => {
      const profile = {
        fullName: 'Jane Student',
        phoneNumber: '+1-555-0100',
        degree: 'B.Tech',
        department: 'CSE',
        graduationYear: 2026,
      };

      const { score, breakdown } = studentService.calculateCompleteness(profile);
      expect(breakdown.basicInfo).toBe(10); // fullName (5) + phoneNumber (5)
      expect(breakdown.education).toBe(25); // degree (10) + department (10) + year (5)
      expect(score).toBe(35);
    });

    it('should calculate 100% for fully populated student profile', () => {
      const fullProfile = {
        fullName: 'Jane Student',
        phoneNumber: '+1-555-0100',
        bio: 'Passionate software engineer',
        avatarUrl: 'https://example.com/avatar.jpg',
        degree: 'B.Tech',
        department: 'CSE',
        graduationYear: 2026,
        institutionId: 'inst-1',
        careerInterests: ['Web Dev'],
        preferredRoles: ['Fullstack'],
        preferredLocations: ['Remote'],
        projects: [{ id: 'p1', title: 'Repo' }],
        certifications: [{ id: 'c1', name: 'AWS' }],
      };

      const { score } = studentService.calculateCompleteness(fullProfile);
      expect(score).toBe(100);
    });
  });

  describe('StudentProfilesService CRUD & Authorization', () => {
    it('should fetch existing student profile', async () => {
      const mockProfile = {
        id: 'sp-1',
        userId: 'u-1',
        fullName: 'Jane Student',
        projects: [],
        certifications: [],
        experiences: [],
      };
      mockPrisma.studentProfile.findUnique.mockResolvedValue(mockProfile);

      const res = await studentService.getMyProfile('u-1');
      expect(res.profile.id).toBe('sp-1');
      expect(res.completenessScore).toBeGreaterThan(0);
    });

    it('should auto-create profile if missing on first access', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-1', email: 'alex@uni.edu' });
      mockPrisma.studentProfile.create.mockResolvedValue({
        id: 'sp-new',
        userId: 'u-1',
        fullName: 'alex',
        projects: [],
        certifications: [],
      });

      const res = await studentService.getMyProfile('u-1');
      expect(res.profile.id).toBe('sp-new');
      expect(mockPrisma.studentProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'u-1', fullName: 'alex' }),
        }),
      );
    });

    it('should reject deleting project belonging to another student (IDOR protection)', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        userId: 'user-1',
        projects: [],
      });

      // Project belongs to sp-2 instead of sp-1
      mockPrisma.studentProject.findUnique.mockResolvedValue({
        id: 'project-99',
        studentProfileId: 'sp-2',
      });

      await expect(studentService.deleteProject('user-1', 'project-99')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should reject deleting certification belonging to another student (IDOR protection)', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        userId: 'user-1',
        certifications: [],
      });

      mockPrisma.studentCertification.findUnique.mockResolvedValue({
        id: 'cert-99',
        studentProfileId: 'sp-2',
      });

      await expect(studentService.deleteCertification('user-1', 'cert-99')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('Faculty, Industry & Institution Services', () => {
    it('should update faculty profile for logged in faculty user', async () => {
      mockPrisma.facultyProfile.findUnique.mockResolvedValue({
        id: 'fp-1',
        userId: 'faculty-1',
        fullName: 'Dr. Vance',
      });
      mockPrisma.facultyProfile.update.mockResolvedValue({
        id: 'fp-1',
        userId: 'faculty-1',
        fullName: 'Dr. Robert Vance',
        designation: 'Professor',
      });

      const updated = await facultyService.updateMyProfile('faculty-1', {
        fullName: 'Dr. Robert Vance',
        designation: 'Professor',
      });

      expect(updated.designation).toBe('Professor');
    });

    it('should update industry profile for authorized company user', async () => {
      mockPrisma.industryProfile.findUnique.mockResolvedValue({
        id: 'ip-1',
        userId: 'industry-1',
        companyName: 'Acme Corp',
      });
      mockPrisma.industryProfile.update.mockResolvedValue({
        id: 'ip-1',
        userId: 'industry-1',
        companyName: 'Acme Technologies',
        website: 'https://acme.com',
      });

      const updated = await industryService.updateMyProfile('industry-1', {
        companyName: '  Acme Technologies  ',
        website: 'https://acme.com',
      });

      expect(mockPrisma.industryProfile.update).toHaveBeenCalledWith({
        where: { id: 'ip-1' },
        data: expect.objectContaining({ companyName: 'Acme Technologies' }),
      });
      expect(updated.companyName).toBe('Acme Technologies');
    });

    it('should reject updating companyName to empty string or whitespace', async () => {
      mockPrisma.industryProfile.findUnique.mockResolvedValue({
        id: 'ip-1',
        userId: 'industry-1',
        companyName: 'Acme Corp',
      });

      await expect(
        industryService.updateMyProfile('industry-1', { companyName: '   ' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject updating industryType to empty string or whitespace', async () => {
      mockPrisma.industryProfile.findUnique.mockResolvedValue({
        id: 'ip-1',
        userId: 'industry-1',
        industryType: 'Technology',
      });

      await expect(
        industryService.updateMyProfile('industry-1', { industryType: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should list institutions for selection dropdown', async () => {
      mockPrisma.institutionProfile.findMany.mockResolvedValue([
        { id: 'inst-1', name: 'MIT', code: 'MIT01' },
        { id: 'inst-2', name: 'Stanford', code: 'STAN01' },
      ]);

      const list = await institutionService.listInstitutions();
      expect(list.length).toBe(2);
      expect(list[0].name).toBe('MIT');
    });
  });
});
