import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsInt, Min, IsString } from "class-validator";
import { Type } from "class-transformer";

export class QueryArtistDto {
  @ApiProperty({ description: "Số trang", required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: "Số lượng mỗi trang", required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ description: "Tìm kiếm theo tên nghệ sĩ", required: false })
  @IsOptional()
  @IsString()
  search?: string;
}

