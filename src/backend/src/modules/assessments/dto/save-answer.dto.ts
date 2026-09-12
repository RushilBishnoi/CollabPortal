import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveAnswerDto {
  @ApiProperty({ description: 'Question ID being answered' })
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @ApiProperty({ description: 'Selected option ID' })
  @IsString()
  @IsNotEmpty()
  selectedOptionId!: string;
}
