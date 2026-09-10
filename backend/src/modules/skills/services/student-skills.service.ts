import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateStudentSkillDto } from '../dto/create-student-skill.dto';
import { UpdateStudentSkillDto } from '../dto/update-student-skill.dto';

@Injectable()
export class StudentSkillsService {
  private readonly logger = new Logger(StudentSkillsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve (or lazily initialize) the student profile for the authenticated user.
   * Uses userId from JWT — never trusts client-supplied IDs.
   */
  private async resolveStudentProfile(userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      // Lazy initialization consistent with Phase 4
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      return this.prisma.studentProfile.create({
        data: { userId, fullName: user.email.split('@')[0] || 'Student' },
      });
    }

    return profile;
  }

  /**
   * Get all skills on the authenticated student's profile, with taxonomy data.
   */
  async getMySkills(userId: string) {
    const profile = await this.resolveStudentProfile(userId);

    const skills = await this.prisma.studentSkill.findMany({
      where: { studentProfileId: profile.id },
      include: {
        skill: {
          select: {
            id: true,
            name: true,
            description: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ proficiency: 'desc' }, { createdAt: 'asc' }],
    });

    return { studentProfileId: profile.id, skills };
  }

  /**
   * Add a skill to the authenticated student's profile.
   * - Validates that the skillId references a real, active skill.
   * - Rejects duplicate (studentProfileId, skillId) pairs.
   * - Student CANNOT set verificationStatus — it defaults to PENDING.
   */
  async addSkill(userId: string, dto: CreateStudentSkillDto) {
    const profile = await this.resolveStudentProfile(userId);

    // Verify the skill exists and is active in the canonical taxonomy
    const skill = await this.prisma.skill.findUnique({ where: { id: dto.skillId } });
    if (!skill || !skill.isActive) {
      throw new NotFoundException(`Skill '${dto.skillId}' not found or is not active`);
    }

    // Check for duplicate
    const existing = await this.prisma.studentSkill.findUnique({
      where: { studentProfileId_skillId: { studentProfileId: profile.id, skillId: dto.skillId } },
    });
    if (existing) {
      throw new ConflictException(
        `Skill '${skill.name}' is already on your profile. Use PUT to update proficiency.`,
      );
    }

    return this.prisma.studentSkill.create({
      data: {
        studentProfileId: profile.id,
        skillId: dto.skillId,
        proficiency: dto.proficiency,
        source: 'SELF_REPORTED',
        // verificationStatus defaults to PENDING — not set by student
      },
      include: {
        skill: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  /**
   * Update proficiency on an existing student skill.
   * Resolves ownership via userId (JWT) — prevents IDOR.
   */
  async updateSkillProficiency(userId: string, skillIdOrRecordId: string, dto: UpdateStudentSkillDto) {
    const profile = await this.resolveStudentProfile(userId);

    // Check if queried by studentSkill record ID
    let studentSkill = await this.prisma.studentSkill.findUnique({
      where: { id: skillIdOrRecordId },
    });

    if (studentSkill) {
      // Direct IDOR check: record exists but belongs to a different student
      if (studentSkill.studentProfileId !== profile.id) {
        throw new ForbiddenException('You are not authorized to modify another student\'s skill');
      }
    } else {
      // Fallback: check by canonical skillId on the current student's profile
      studentSkill = await this.prisma.studentSkill.findUnique({
        where: {
          studentProfileId_skillId: {
            studentProfileId: profile.id,
            skillId: skillIdOrRecordId,
          },
        },
      });
    }

    if (!studentSkill) {
      throw new NotFoundException('This skill is not on your profile');
    }

    return this.prisma.studentSkill.update({
      where: { id: studentSkill.id },
      data: { proficiency: dto.proficiency },
      include: {
        skill: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  /**
   * Remove a skill from the authenticated student's profile.
   * Server-side ownership check prevents IDOR.
   */
  async removeSkill(userId: string, skillIdOrRecordId: string) {
    const profile = await this.resolveStudentProfile(userId);

    // Check if queried by studentSkill record ID
    let studentSkill = await this.prisma.studentSkill.findUnique({
      where: { id: skillIdOrRecordId },
    });

    if (studentSkill) {
      // Direct IDOR check: record exists but belongs to a different student
      if (studentSkill.studentProfileId !== profile.id) {
        throw new ForbiddenException('You are not authorized to delete another student\'s skill');
      }
    } else {
      // Fallback: check by canonical skillId on the current student's profile
      studentSkill = await this.prisma.studentSkill.findUnique({
        where: {
          studentProfileId_skillId: {
            studentProfileId: profile.id,
            skillId: skillIdOrRecordId,
          },
        },
      });
    }

    if (!studentSkill) {
      throw new NotFoundException('This skill is not on your profile');
    }

    await this.prisma.studentSkill.delete({ where: { id: studentSkill.id } });
    return { success: true, message: 'Skill removed from profile' };
  }
}
