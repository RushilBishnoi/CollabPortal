import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CareerRolesService } from '../src/modules/career-roles/services/career-roles.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProficiencyLevel } from '@prisma/client';

describe('Phase 7 Career Roles Unit & Integration Tests', () => {
  let careerRolesService: CareerRolesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      careerRole: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      skill: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      careerRoleSkill: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
      },
    };

    careerRolesService = new CareerRolesService(mockPrisma);
  });

  describe('Career Roles Retrieval', () => {
    it('should list all active career roles', async () => {
      mockPrisma.careerRole.findMany.mockResolvedValue([
        {
          id: 'cr-1',
          title: 'Frontend Developer',
          slug: 'frontend-developer',
          category: 'Software Engineering',
          isActive: true,
          skills: [
            {
              id: 'crs-1',
              skillId: 'sk-1',
              requiredProficiency: ProficiencyLevel.ADVANCED,
              weight: 1.5,
              isMandatory: true,
              skill: { id: 'sk-1', name: 'React', category: { id: 'cat-1', name: 'Web Development' } },
            },
          ],
        },
      ]);

      const result = await careerRolesService.findAll({ isActive: true });
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Frontend Developer');
      expect(result[0].skills).toHaveLength(1);
      expect(result[0].skills[0].skill.name).toBe('React');
    });

    it('should retrieve distinct categories', async () => {
      mockPrisma.careerRole.findMany.mockResolvedValue([
        { category: 'Cloud & DevOps' },
        { category: 'Data & AI' },
        { category: 'Software Engineering' },
      ]);

      const categories = await careerRolesService.getCategories();
      expect(categories).toEqual(['Cloud & DevOps', 'Data & AI', 'Software Engineering']);
    });

    it('should retrieve career role by ID or slug', async () => {
      mockPrisma.careerRole.findUnique
        .mockResolvedValueOnce(null) // ID lookup fails
        .mockResolvedValueOnce({
          id: 'cr-1',
          title: 'Backend Developer',
          slug: 'backend-developer',
          category: 'Software Engineering',
          skills: [],
        });

      const role = await careerRolesService.findByIdOrSlug('backend-developer');
      expect(role.slug).toBe('backend-developer');
      expect(role.title).toBe('Backend Developer');
    });

    it('should throw NotFoundException when role does not exist', async () => {
      mockPrisma.careerRole.findUnique.mockResolvedValue(null);
      await expect(careerRolesService.findByIdOrSlug('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Career Roles Administration (CRUD & Requirements)', () => {
    it('should create a new career role with unique slug', async () => {
      mockPrisma.careerRole.findUnique.mockResolvedValue(null);
      mockPrisma.careerRole.create.mockResolvedValue({
        id: 'cr-new',
        title: 'DevOps Specialist',
        slug: 'devops-specialist',
        category: 'Cloud & DevOps',
        minExperienceYears: 1,
        isActive: true,
      });

      const created = await careerRolesService.create({
        title: 'DevOps Specialist',
        slug: 'devops-specialist',
        category: 'Cloud & DevOps',
        minExperienceYears: 1,
      });

      expect(created.id).toBe('cr-new');
      expect(created.slug).toBe('devops-specialist');
    });

    it('should throw ConflictException on duplicate slug', async () => {
      mockPrisma.careerRole.findUnique.mockResolvedValue({
        id: 'cr-existing',
        slug: 'devops-specialist',
      });

      await expect(
        careerRolesService.create({
          title: 'DevOps Specialist',
          slug: 'devops-specialist',
          category: 'Cloud & DevOps',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should add/upsert skill requirement on career role', async () => {
      mockPrisma.careerRole.findUnique.mockResolvedValue({ id: 'cr-1', title: 'Frontend Developer' });
      mockPrisma.skill.findUnique.mockResolvedValue({ id: 'sk-1', name: 'TypeScript', isActive: true });
      mockPrisma.careerRoleSkill.upsert.mockResolvedValue({
        id: 'crs-1',
        careerRoleId: 'cr-1',
        skillId: 'sk-1',
        requiredProficiency: ProficiencyLevel.ADVANCED,
        weight: 1.5,
        isMandatory: true,
        skill: { id: 'sk-1', name: 'TypeScript' },
      });

      const req = await careerRolesService.addSkillRequirement('cr-1', {
        skillId: 'sk-1',
        requiredProficiency: ProficiencyLevel.ADVANCED,
        weight: 1.5,
        isMandatory: true,
      });

      expect(req.skillId).toBe('sk-1');
      expect(req.requiredProficiency).toBe(ProficiencyLevel.ADVANCED);
    });

    it('should throw NotFoundException if skill does not exist when adding requirement', async () => {
      mockPrisma.careerRole.findUnique.mockResolvedValue({ id: 'cr-1' });
      mockPrisma.skill.findUnique.mockResolvedValue(null);

      await expect(
        careerRolesService.addSkillRequirement('cr-1', {
          skillId: 'fake-skill',
          requiredProficiency: ProficiencyLevel.BEGINNER,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should remove skill requirement from career role', async () => {
      mockPrisma.careerRoleSkill.findUnique.mockResolvedValue({
        id: 'crs-1',
        careerRoleId: 'cr-1',
        skillId: 'sk-1',
      });
      mockPrisma.careerRoleSkill.delete.mockResolvedValue({});

      const result = await careerRolesService.removeSkillRequirement('cr-1', 'sk-1');
      expect(result.success).toBe(true);
    });
  });
});
