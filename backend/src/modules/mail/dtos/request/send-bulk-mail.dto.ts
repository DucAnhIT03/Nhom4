import { IsArray, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SendBulkMailDto {
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  userIds?: number[]; // Danh sách user IDs để gửi mail

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  emails?: string[]; // Danh sách email trực tiếp

  @IsOptional()
  @IsString()
  sendToAll?: string; // "true" nếu muốn gửi cho tất cả user

  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;
}

