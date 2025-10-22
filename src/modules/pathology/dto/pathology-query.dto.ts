// dto/pathology-query.dto.ts
import { IsMongoId, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class PathologyQueryDto {
  @IsMongoId()
  @IsOptional()
  pathologyId?: string;
}

export class ModuleQueryDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return value.includes(',')
        ? value.split(',').map((id) => id.trim())
        : [value.trim()];
    }
    return value;
  })
  moduleId?: string | string[];
}
