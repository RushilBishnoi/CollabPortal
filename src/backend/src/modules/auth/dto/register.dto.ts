import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  NotEquals,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'student@university.edu', description: 'User email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ApiProperty({
    example: 'StrongP@ssw0rd!',
    description:
      'Password (min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()[\]{}_+\-=:;'"<>,./~`|\\])/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password!: string;

  @ApiProperty({
    enum: [
      UserRole.STUDENT,
      UserRole.FACULTY,
      UserRole.INDUSTRY,
      UserRole.INSTITUTION_ADMIN,
    ],
    example: UserRole.STUDENT,
    description: 'User persona role',
  })
  @IsEnum(UserRole, {
    message: 'Role must be STUDENT, FACULTY, INDUSTRY, or INSTITUTION_ADMIN',
  })
  @NotEquals(UserRole.SUPER_ADMIN, {
    message: 'Super Admin role cannot be self-registered',
  })
  role!: UserRole;

  @ApiProperty({ example: 'Ananya Sharma', description: 'Full name of account holder' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Full name must be a string' })
  @IsNotEmpty({ message: 'Full name is required' })
  fullName!: string;
}
