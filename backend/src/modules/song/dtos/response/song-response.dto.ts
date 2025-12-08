export class SongResponseDto {
  id!: number;
  title!: string;
  duration?: string;
  artistId!: number;
  albumId!: number;
  fileUrl?: string;
  type?: "FREE" | "PREMIUM";
  views!: number;
  createdAt!: Date;
  updatedAt!: Date;
}


