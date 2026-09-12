import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { UpdateStudentProfileDto } from '../dto/update-student-profile.dto';
import { CreateStudentProjectDto } from '../dto/create-student-project.dto';
import { CreateStudentCertificationDto } from '../dto/create-student-certification.dto';

export interface StudentProfileWithCompleteness {
  profile: any;
  completenessScore: number;
  completenessBreakdown: {
    basicInfo: number;
    education: number;
    careerPreferences: number;
    projectsAndCertifications: number;
  };
}

@Injectable()
export class StudentProfilesService {
  private readonly logger = new Logger(StudentProfilesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Deterministic calculation of profile completeness score (0-100%)
   */
  public calculateCompleteness(profile: any): {
    score: number;
    breakdown: {
      basicInfo: number;
      education: number;
      careerPreferences: number;
      projectsAndCertifications: number;
    };
  } {
    let basicInfo = 0;
    if (profile.fullName && profile.fullName.trim() !== '') basicInfo += 5;
    if (profile.phoneNumber && profile.phoneNumber.trim() !== '') basicInfo += 5;
    if (profile.bio && profile.bio.trim() !== '') basicInfo += 5;
    if (profile.avatarUrl && profile.avatarUrl.trim() !== '') basicInfo += 5;

    let education = 0;
    if (profile.degree && profile.degree.trim() !== '') education += 10;
    if (profile.department && profile.department.trim() !== '') education += 10;
    if (profile.graduationYear) education += 5;
    if (profile.institutionId) education += 5;

    let careerPreferences = 0;
    if (profile.careerInterests && profile.careerInterests.length > 0) careerPreferences += 7;
    if (profile.preferredRoles && profile.preferredRoles.length > 0) careerPreferences += 7;
    if (profile.preferredLocations && profile.preferredLocations.length > 0) careerPreferences += 6;

    let projectsAndCertifications = 0;
    if (profile.projects && profile.projects.length > 0) projectsAndCertifications += 15;
    if (profile.certifications && profile.certifications.length > 0) projectsAndCertifications += 15;

    const totalScore = basicInfo + education + careerPreferences + projectsAndCertifications;

    return {
      score: Math.min(100, totalScore),
      breakdown: {
        basicInfo,
        education,
        careerPreferences,
        projectsAndCertifications,
      },
    };
  }

  async getMyProfile(userId: string): Promise<StudentProfileWithCompleteness> {
    let profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        institution: { select: { id: true, name: true, code: true, type: true } },
        projects: true,
        certifications: true,
        experiences: true,
      },
    });

    if (!profile) {
      // Lazy auto-creation on first access
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      profile = await this.prisma.studentProfile.create({
        data: {
          userId,
          fullName: user.email.split('@')[0] || 'Student User',
        },
        include: {
          institution: { select: { id: true, name: true, code: true, type: true } },
          projects: true,
          certifications: true,
          experiences: true,
        },
      });
    }

    const completeness = this.calculateCompleteness(profile);

    return {
      profile,
      completenessScore: completeness.score,
      completenessBreakdown: completeness.breakdown,
    };
  }

  async updateMyProfile(userId: string, dto: UpdateStudentProfileDto) {
    const existing = await this.getMyProfile(userId);

    const updated = await this.prisma.studentProfile.update({
      where: { id: existing.profile.id },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.institutionId !== undefined && { institutionId: dto.institutionId }),
        ...(dto.degree !== undefined && { degree: dto.degree }),
        ...(dto.department !== undefined && { department: dto.department }),
        ...(dto.graduationYear !== undefined && { graduationYear: dto.graduationYear }),
        ...(dto.cgpa !== undefined && { cgpa: dto.cgpa }),
        ...(dto.careerInterests !== undefined && { careerInterests: dto.careerInterests }),
        ...(dto.preferredRoles !== undefined && { preferredRoles: dto.preferredRoles }),
        ...(dto.preferredLocations !== undefined && { preferredLocations: dto.preferredLocations }),
      },
      include: {
        institution: { select: { id: true, name: true, code: true, type: true } },
        projects: true,
        certifications: true,
        experiences: true,
      },
    });

    const completeness = this.calculateCompleteness(updated);

    return {
      profile: updated,
      completenessScore: completeness.score,
      completenessBreakdown: completeness.breakdown,
    };
  }

  async getStudentProfileById(id: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { id },
      include: {
        institution: { select: { id: true, name: true, code: true, type: true } },
        projects: true,
        certifications: true,
        experiences: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }

    const completeness = this.calculateCompleteness(profile);
    return {
      profile,
      completenessScore: completeness.score,
    };
  }

  async addProject(userId: string, dto: CreateStudentProjectDto) {
    const { profile } = await this.getMyProfile(userId);

    return this.prisma.studentProject.create({
      data: {
        studentProfileId: profile.id,
        title: dto.title,
        description: dto.description,
        repoUrl: dto.repoUrl,
        demoUrl: dto.demoUrl,
        technologies: dto.technologies || [],
      },
    });
  }

  async deleteProject(userId: string, projectId: string) {
    const { profile } = await this.getMyProfile(userId);

    const project = await this.prisma.studentProject.findUnique({
      where: { id: projectId },
    });

    if (!project || project.studentProfileId !== profile.id) {
      throw new ForbiddenException('You are not authorized to delete this project');
    }

    await this.prisma.studentProject.delete({ where: { id: projectId } });
    return { success: true, message: 'Project removed' };
  }

  async addCertification(userId: string, dto: CreateStudentCertificationDto) {
    const { profile } = await this.getMyProfile(userId);

    return this.prisma.studentCertification.create({
      data: {
        studentProfileId: profile.id,
        name: dto.name,
        issuingOrganization: dto.issuingOrganization,
        issueDate: new Date(dto.issueDate),
        credentialUrl: dto.credentialUrl,
        credentialId: dto.credentialId,
      },
    });
  }

  async deleteCertification(userId: string, certId: string) {
    const { profile } = await this.getMyProfile(userId);

    const cert = await this.prisma.studentCertification.findUnique({
      where: { id: certId },
    });

    if (!cert || cert.studentProfileId !== profile.id) {
      throw new ForbiddenException('You are not authorized to delete this certification');
    }

    await this.prisma.studentCertification.delete({ where: { id: certId } });
    return { success: true, message: 'Certification removed' };
  }
}
