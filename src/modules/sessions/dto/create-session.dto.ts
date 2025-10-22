import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class CreateSessionDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  moduleName?: string;

  @IsMongoId()
  @IsOptional()
  moduleId?: string;

  @IsString()
  @IsOptional()
  pathologyName?: string;

  @IsMongoId()
  @IsOptional()
  pathologyId?: string;

  @IsString()
  @IsOptional()
  difficulty?: string;

  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @IsBoolean()
  @IsOptional()
  sponsored?: boolean;

  @IsString()
  @IsOptional()
  imageUrl_1920x1080?: string;

  @IsString()
  @IsOptional()
  imageUrl_522x760?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsArray()
  @IsOptional()
  resourceLinks?: string[];

  @IsArray()
  @IsOptional()
  faculty?: string[];

  @IsString()
  sessionType: string;

  // Dicom specific
  @IsBoolean()
  @IsOptional()
  isAssessment?: boolean;

  @IsString()
  @IsOptional()
  dicomStudyId?: string;

  @IsString()
  @IsOptional()
  dicomCaseId?: string;

  @IsString()
  @IsOptional()
  dicomCaseVideoUrl?: string;

  @IsString()
  @IsOptional()
  caseAccessType?: string;

  // Vimeo specific
  @IsString()
  @IsOptional()
  sessionDuration?: string;

  @IsString()
  @IsOptional()
  vimeoVideoId?: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsString()
  @IsOptional()
  videoType?: string;

  // Live/Zoom specific
  @IsString()
  @IsOptional()
  liveProgramType?: string;

  @IsString()
  @IsOptional()
  zoomMeetingId?: string;

  @IsString()
  @IsOptional()
  zoomPassword?: string;

  @IsString()
  @IsOptional()
  zoomJoinUrl?: string;

  @IsString()
  @IsOptional()
  zoomBackUpLink?: string;

  @IsString()
  @IsOptional()
  vimeoLiveUrl?: string;
}
