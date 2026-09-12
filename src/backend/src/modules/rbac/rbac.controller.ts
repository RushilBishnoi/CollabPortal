import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import {
  ROLE_PERMISSIONS,
  Permission,
} from '../../common/constants/permissions.constant';

export interface UserPermissionsData {
  user: AuthenticatedUser;
  role: UserRole;
  permissions: Permission[];
  accessiblePortals: {
    student: boolean;
    faculty: boolean;
    industry: boolean;
    institution: boolean;
    admin: boolean;
  };
}

@ApiTags('RBAC & Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rbac')
export class RbacController {
  @Get('permissions')
  @ApiOperation({ summary: 'Get current user active role capabilities and permissions' })
  @ApiResponse({ status: 200, description: 'Role permissions retrieved' })
  getPermissions(@CurrentUser() user: AuthenticatedUser): UserPermissionsData {
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    const isSuper = user.role === UserRole.SUPER_ADMIN;

    return {
      user,
      role: user.role,
      permissions,
      accessiblePortals: {
        student: user.role === UserRole.STUDENT || isSuper,
        faculty: user.role === UserRole.FACULTY || isSuper,
        industry: user.role === UserRole.INDUSTRY || isSuper,
        institution: user.role === UserRole.INSTITUTION_ADMIN || isSuper,
        admin: isSuper,
      },
    };
  }

  @Roles(UserRole.STUDENT)
  @Get('student-zone')
  @ApiOperation({ summary: 'Student-only protected resource endpoint' })
  @ApiResponse({ status: 200, description: 'Student zone access authorized' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-student roles' })
  getStudentZone(@CurrentUser() user: AuthenticatedUser) {
    return {
      access: 'GRANTED',
      zone: 'STUDENT_PORTAL',
      message: `Welcome Student ${user.email}. Access authorized for skill profiling & applications.`,
    };
  }

  @Roles(UserRole.FACULTY)
  @Get('faculty-zone')
  @ApiOperation({ summary: 'Faculty-only protected resource endpoint' })
  @ApiResponse({ status: 200, description: 'Faculty zone access authorized' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-faculty roles' })
  getFacultyZone(@CurrentUser() user: AuthenticatedUser) {
    return {
      access: 'GRANTED',
      zone: 'FACULTY_PORTAL',
      message: `Welcome Faculty ${user.email}. Access authorized for FDPs, training & mentorship.`,
    };
  }

  @Roles(UserRole.INDUSTRY)
  @Get('industry-zone')
  @ApiOperation({ summary: 'Industry-only protected resource endpoint' })
  @ApiResponse({ status: 200, description: 'Industry zone access authorized' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-industry roles' })
  getIndustryZone(@CurrentUser() user: AuthenticatedUser) {
    return {
      access: 'GRANTED',
      zone: 'INDUSTRY_PORTAL',
      message: `Welcome Industry Partner ${user.email}. Access authorized for opportunity management.`,
    };
  }

  @Roles(UserRole.INSTITUTION_ADMIN)
  @Get('institution-zone')
  @ApiOperation({ summary: 'Institution-admin-only protected resource endpoint' })
  @ApiResponse({ status: 200, description: 'Institution zone access authorized' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-institution roles' })
  getInstitutionZone(@CurrentUser() user: AuthenticatedUser) {
    return {
      access: 'GRANTED',
      zone: 'INSTITUTION_PORTAL',
      message: `Welcome Administrator ${user.email}. Access authorized for institutional analytics.`,
    };
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Get('admin-zone')
  @ApiOperation({ summary: 'Super-admin-only protected resource endpoint' })
  @ApiResponse({ status: 200, description: 'Admin zone access authorized' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-super-admin roles' })
  getAdminZone(@CurrentUser() user: AuthenticatedUser) {
    return {
      access: 'GRANTED',
      zone: 'SUPER_ADMIN_PORTAL',
      message: `Welcome Super Administrator ${user.email}. Full platform governance authorized.`,
    };
  }
}
