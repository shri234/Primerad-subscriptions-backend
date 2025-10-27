// dto/session-status.dto.ts

import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  Min,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating Vimeo video progress
 */
export class UpdateVimeoProgressDto {
  //   @ApiProperty({
  //     description: 'MongoDB ObjectId of the session',
  //     example: '688a0f4b18e97b2f11014e48',
  //   })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  sessionId: string;

  //   @ApiProperty({
  //     description: 'Current playback time in seconds',
  //     example: 118,
  //     minimum: 0,
  //   })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  currentTime: number;

  //   @ApiPropertyOptional({
  //     description: 'Total video duration in seconds',
  //     example: 560,
  //     minimum: 0,
  //   })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  duration?: number;
}

export class MarkDicomActionDto {
  //   @ApiProperty({
  //     description: 'MongoDB ObjectId of the session',
  //     example: '688a0f4b18e97b2f11014e48',
  //   })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  sessionId: string;
}
