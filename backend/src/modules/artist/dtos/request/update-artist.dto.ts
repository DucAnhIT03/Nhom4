import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class UpdateArtistDto {
  @ApiProperty({ description: "Tên nghệ sĩ", required: false })
  @IsString()
  @IsOptional()
  artistName?: string;

  @ApiProperty({ description: "Tiểu sử nghệ sĩ", required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ description: "URL ảnh đại diện", required: false })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({ description: "Quốc tịch", required: false })
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiProperty({ description: "Tuổi", required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  age?: number;
}

