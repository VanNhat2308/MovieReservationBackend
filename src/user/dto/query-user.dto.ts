import { IsOptional, IsInt, Min, IsBooleanString, IsEnum, IsString } from 'class-validator'
import { Type } from 'class-transformer'
import { RoleName } from '../../generated/prisma/client';

export class QueryUserDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10

  @IsOptional()
  @IsEnum(RoleName)
  role?: RoleName

  @IsOptional()
  @IsBooleanString()
  isActive?: string

  @IsOptional()
  @IsString()
  search?: string
}
