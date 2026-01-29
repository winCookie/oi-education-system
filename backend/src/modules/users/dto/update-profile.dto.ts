import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: '昵称最多50个字符' })
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '头像URL最多500个字符' })
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '个人简介最多500个字符' })
  bio?: string;
}
