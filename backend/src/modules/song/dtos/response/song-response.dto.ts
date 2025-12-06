export class SongResponseDto {
  id!: number;
  title!: string;
  duration?: string;
  artistId!: number;
  albumId!: number;
  fileUrl?: string;
  views!: number;
  createdAt!: Date;
  updatedAt!: Date;
}


