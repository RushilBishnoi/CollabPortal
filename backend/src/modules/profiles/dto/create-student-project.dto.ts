import { IsString, IsNotEmpty, IsOptional, IsArray, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentProjectDto {
  @ApiProperty({ example: 'AI Resume Parser' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ example: 'A deterministic NLP tool to map skill proficiencies from PDF resumes.' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiPropertyOptional({ example: 'https://github.com/example/resume-parser' })
  @IsOptional()
  @IsUrl({}, { message: 'repoUrl must be a valid URL' })
  repoUrl?: string;

  @ApiPropertyOptional({ example: 'https://resume-parser.example.com' })
  @IsOptional()
  @IsUrl({}, { message: 'demoUrl must be a valid URL' })
  demoUrl?: string;

  @ApiPropertyOptional({ example: ['TypeScript', 'Node.js', 'React'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technologies?: string[];
}
