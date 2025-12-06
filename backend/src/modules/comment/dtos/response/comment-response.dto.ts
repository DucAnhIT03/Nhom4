export class CommentResponseDto {
  id!: number;
  userId!: number;
  songId!: number;
  content!: string;
  parentId?: number;
  createdAt!: Date;
  updatedAt!: Date;
}


