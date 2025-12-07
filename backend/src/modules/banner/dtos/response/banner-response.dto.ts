export class BannerResponseDto {
  id!: number;
  title!: string;
  imageUrl!: string;
  linkUrl?: string;
  displayOrder!: number;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

