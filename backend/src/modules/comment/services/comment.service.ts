import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { Comment } from "../../../shared/schemas/comment.schema";
import { CreateCommentDto } from "../dtos/request/create-comment.dto";
import { UpdateCommentDto } from "../dtos/request/update-comment.dto";
import { QueryCommentDto } from "../dtos/request/query-comment.dto";

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async findBySong(
    query: QueryCommentDto,
  ): Promise<{ data: Comment[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: any = { songId: query.songId };
    if (query.search) {
      where.content = ILike(`%${query.search}%`);
    }

    const [data, total] = await this.commentRepository.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException("Comment not found");
    }
    return comment;
  }

  create(dto: CreateCommentDto): Promise<Comment> {
    const entity = this.commentRepository.create(dto);
    return this.commentRepository.save(entity);
  }

  async update(id: number, dto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.findOne(id);
    const merged = this.commentRepository.merge(comment, dto);
    return this.commentRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    const comment = await this.findOne(id);
    await this.commentRepository.remove(comment);
  }
}


