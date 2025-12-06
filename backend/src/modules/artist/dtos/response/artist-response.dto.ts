import { ApiProperty } from "@nestjs/swagger";
import { Artist } from "../../../../shared/schemas/artist.schema";

export class ArtistResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  artistName!: string;

  @ApiProperty({ required: false })
  bio?: string;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty({ required: false })
  nationality?: string;

  @ApiProperty({ required: false })
  age?: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromEntity(artist: Artist): ArtistResponseDto {
    const dto = new ArtistResponseDto();
    dto.id = artist.id;
    dto.artistName = artist.artistName;
    dto.bio = artist.bio;
    dto.avatar = artist.avatar;
    dto.nationality = artist.nationality;
    dto.age = artist.age;
    dto.createdAt = artist.createdAt;
    dto.updatedAt = artist.updatedAt;
    return dto;
  }
}

