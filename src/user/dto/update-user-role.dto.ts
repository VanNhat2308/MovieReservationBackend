import { IsEnum } from 'class-validator'
import { RoleName } from '../../generated/prisma/client';

export class UpdateUserRoleDto {
  @IsEnum(RoleName)
  role: RoleName
}