import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillsService, PROFICIENCY_SCORE_MAP } from '../src/modules/skills/services/skills.service';
import { StudentSkillsService } from '../src/modules/skills/services/student-skills.service';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProficiencyLevel } from '@prisma/client';

describe('Phase 5 Skills Module Unit & Security Tests', () => {
  let skillsService: SkillsService;
  let studentSkillsService: StudentSkillsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      studentProfile: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      skillCategory: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      skill: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      studentSkill: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };

    skillsService = new SkillsService(mockPrisma);
    studentSkillsService = new StudentSkillsService(mockPrisma);
  });

  describe('Proficiency Level Numeric Scoring', () => {
    it('should have deterministic centralized score mapping', () => {
      expect(PROFICIENCY_SCORE_MAP.BEGINNER).toBe(1);
      expect(PROFICIENCY_SCORE_MAP.INTERMEDIATE).toBe(2);
      expect(PROFICIENCY_SCORE_MAP.ADVANCED).toBe(3);
      expect(PROFICIENCY_SCORE_MAP.EXPERT).toBe(4);
    });
  });

  describe('SkillsService - Taxonomy & Search', () => {
    it('should list all active categories with child hierarchies', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Web Development', description: 'Web tech', parentId: null, children: [] },
        { id: 'cat-2', name: 'Databases', description: 'Storage', parentId: null, children: [] },
      ];
      mockPrisma.skillCategory.findMany.mockResolvedValue(mockCategories);

      const result = await skillsService.listCategories();
      expect(result).toHaveLength(2);
      expect(mockPrisma.skillCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });

    it('should list skills filtered by category ID when provided', async () => {
      mockPrisma.skill.findMany.mockResolvedValue([
        { id: 'sk-1', name: 'React', categoryId: 'cat-1' },
      ]);

      const result = await skillsService.listSkills('cat-1');
      expect(result).toHaveLength(1);
      expect(mockPrisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, categoryId: 'cat-1' },
        }),
      );
    });

    it('should return empty list if search query is less than 2 characters', async () => {
      const result = await skillsService.searchSkills('r');
      expect(result).toEqual([]);
      expect(mockPrisma.skill.findMany).not.toHaveBeenCalled();
    });

    it('should perform case-insensitive substring search for queries >= 2 chars', async () => {
      mockPrisma.skill.findMany.mockResolvedValue([
        { id: 'sk-1', name: 'React', categoryId: 'cat-1' },
      ]);

      const result = await skillsService.searchSkills('react');
      expect(result).toHaveLength(1);
      expect(mockPrisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            name: { contains: 'react', mode: 'insensitive' },
          },
        }),
      );
    });

    it('should throw NotFoundException when skill ID does not exist', async () => {
      mockPrisma.skill.findUnique.mockResolvedValue(null);

      await expect(skillsService.getSkillById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('StudentSkillsService - CRUD & Duplicate Prevention', () => {
    it('should retrieve authenticated student skills', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        userId: 'user-1',
      });
      mockPrisma.studentSkill.findMany.mockResolvedValue([
        { id: 'ss-1', skillId: 'sk-1', proficiency: ProficiencyLevel.ADVANCED },
      ]);

      const res = await studentSkillsService.getMySkills('user-1');
      expect(res.studentProfileId).toBe('sp-1');
      expect(res.skills).toHaveLength(1);
    });

    it('should add a valid canonical skill to student profile', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        userId: 'user-1',
      });
      mockPrisma.skill.findUnique.mockResolvedValue({
        id: 'sk-1',
        name: 'TypeScript',
        isActive: true,
      });
      mockPrisma.studentSkill.findUnique.mockResolvedValue(null); // No duplicate
      mockPrisma.studentSkill.create.mockResolvedValue({
        id: 'ss-new',
        studentProfileId: 'sp-1',
        skillId: 'sk-1',
        proficiency: ProficiencyLevel.INTERMEDIATE,
        verificationStatus: 'PENDING',
      });

      const added = await studentSkillsService.addSkill('user-1', {
        skillId: 'sk-1',
        proficiency: ProficiencyLevel.INTERMEDIATE,
      });

      expect(added.id).toBe('ss-new');
      expect(mockPrisma.studentSkill.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            studentProfileId: 'sp-1',
            skillId: 'sk-1',
            proficiency: ProficiencyLevel.INTERMEDIATE,
            source: 'SELF_REPORTED',
          }),
        }),
      );
    });

    it('should reject adding non-existent or inactive skill', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 'sp-1', userId: 'user-1' });
      mockPrisma.skill.findUnique.mockResolvedValue(null);

      await expect(
        studentSkillsService.addSkill('user-1', {
          skillId: 'fake-sk',
          proficiency: ProficiencyLevel.BEGINNER,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should prevent adding duplicate skill to profile and throw ConflictException', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 'sp-1', userId: 'user-1' });
      mockPrisma.skill.findUnique.mockResolvedValue({ id: 'sk-1', name: 'React', isActive: true });
      mockPrisma.studentSkill.findUnique.mockResolvedValue({ id: 'ss-existing', studentProfileId: 'sp-1', skillId: 'sk-1' });

      await expect(
        studentSkillsService.addSkill('user-1', {
          skillId: 'sk-1',
          proficiency: ProficiencyLevel.ADVANCED,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('IDOR & Server-Side Ownership Protection', () => {
    it('should reject Student A trying to update Student B skill record (IDOR defense)', async () => {
      // Authenticated user is Student A (sp-1)
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        userId: 'student-a',
      });

      // Target record belongs to Student B (sp-2)
      mockPrisma.studentSkill.findUnique.mockResolvedValue({
        id: 'ss-student-b',
        studentProfileId: 'sp-2', // Belong to student B!
        skillId: 'sk-1',
        proficiency: ProficiencyLevel.BEGINNER,
      });

      await expect(
        studentSkillsService.updateSkillProficiency('student-a', 'ss-student-b', {
          proficiency: ProficiencyLevel.EXPERT,
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.studentSkill.update).not.toHaveBeenCalled();
    });

    it('should reject Student A trying to delete Student B skill record (IDOR defense)', async () => {
      // Authenticated user is Student A (sp-1)
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        userId: 'student-a',
      });

      // Target record belongs to Student B (sp-2)
      mockPrisma.studentSkill.findUnique.mockResolvedValue({
        id: 'ss-student-b',
        studentProfileId: 'sp-2', // Belong to student B!
        skillId: 'sk-1',
      });

      await expect(
        studentSkillsService.removeSkill('student-a', 'ss-student-b'),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.studentSkill.delete).not.toHaveBeenCalled();
    });

    it('should allow student to delete their own skill by canonical skill ID', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        userId: 'student-a',
      });

      // First check by ID returns null (it was called with canonical skillId, not record id)
      // Second check by (studentProfileId, skillId) returns the owned record
      mockPrisma.studentSkill.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'ss-owned',
          studentProfileId: 'sp-1',
          skillId: 'sk-1',
        });

      mockPrisma.studentSkill.delete.mockResolvedValue({ id: 'ss-owned' });

      const res = await studentSkillsService.removeSkill('student-a', 'sk-1');
      expect(res.success).toBe(true);
      expect(mockPrisma.studentSkill.delete).toHaveBeenCalledWith({
        where: { id: 'ss-owned' },
      });
    });
  });
});
