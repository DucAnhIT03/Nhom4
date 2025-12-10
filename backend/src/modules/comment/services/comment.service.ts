import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, In, Repository } from "typeorm";
import { Comment } from "../../../shared/schemas/comment.schema";
import { User } from "../../../shared/schemas/user.schema";
import { Song } from "../../../shared/schemas/song.schema";
import { Artist } from "../../../shared/schemas/artist.schema";
import { CreateCommentDto } from "../dtos/request/create-comment.dto";
import { UpdateCommentDto } from "../dtos/request/update-comment.dto";
import { QueryCommentDto } from "../dtos/request/query-comment.dto";

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
  ) {}

  async findBySong(
    query: QueryCommentDto,
  ): Promise<{ data: Comment[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    // Chỉ lấy comments gốc (không phải reply)
    const where: any = { songId: query.songId, parentId: null };
    if (query.search) {
      where.content = ILike(`%${query.search}%`);
    }

    const [data, total] = await this.commentRepository.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Load user info và replies cho mỗi comment
    const commentsWithUser = await Promise.all(
      data.map(async (comment) => {
        const user = await this.userRepository.findOne({ where: { id: comment.userId } });
        
        // Load replies của comment này
        const replies = await this.commentRepository.find({
          where: { parentId: comment.id },
          order: { createdAt: "ASC" },
        });

        // Load user info cho mỗi reply
        const repliesWithUser = await Promise.all(
          replies.map(async (reply) => {
            const replyUser = await this.userRepository.findOne({ where: { id: reply.userId } });
            return {
              ...reply,
              user: replyUser ? {
                id: replyUser.id,
                firstName: replyUser.firstName,
                lastName: replyUser.lastName,
                email: replyUser.email,
                profileImage: replyUser.profileImage,
              } : undefined,
            };
          })
        );

        return {
          ...comment,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profileImage: user.profileImage,
          } : undefined,
          replies: repliesWithUser,
        };
      })
    );

    return { data: commentsWithUser, total, page, limit };
  }

  async findOne(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException("Comment not found");
    }
    return comment;
  }

  async create(dto: CreateCommentDto): Promise<Comment> {
    const entity = this.commentRepository.create(dto);
    const saved = await this.commentRepository.save(entity);
    
    // Load user info
    const user = await this.userRepository.findOne({ where: { id: saved.userId } });
    return {
      ...saved,
      user: user ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImage: user.profileImage,
      } : undefined,
    } as Comment;
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

  /**
   * Lấy tất cả comments cho admin (với pagination và search)
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const where: any = {};
    if (search) {
      where.content = ILike(`%${search}%`);
    }

    const [data, total] = await this.commentRepository.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Load user và song info cho mỗi comment
    const commentsWithDetails = await Promise.all(
      data.map(async (comment) => {
        const user = await this.userRepository.findOne({ where: { id: comment.userId } });
        const song = await this.songRepository.findOne({ where: { id: comment.songId } });
        
        return {
          ...comment,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            profileImage: user.profileImage,
          } : undefined,
          song: song ? {
            id: song.id,
            title: song.title,
            artistId: song.artistId,
          } : undefined,
        };
      })
    );

    return { data: commentsWithDetails, total, page, limit };
  }

  /**
   * Lấy tất cả comments của bài hát do nghệ sĩ sở hữu (bao gồm replies)
   */
  async findByArtistSongs(artistId: number, sortBy: 'time' | 'likes' = 'time'): Promise<Comment[]> {
    // Lấy tất cả bài hát của nghệ sĩ
    const songs = await this.songRepository.find({ where: { artistId } });
    const songIds = songs.map(s => s.id);

    if (songIds.length === 0) {
      return [];
    }

    // Lấy tất cả comments của các bài hát này
    const comments = await this.commentRepository.find({
      where: { songId: In(songIds) },
      order: sortBy === 'time' ? { createdAt: 'DESC' } : undefined,
    });

    // Load user info
    const commentsWithUser = await Promise.all(
      comments.map(async (comment) => {
        const user = await this.userRepository.findOne({ where: { id: comment.userId } });
        return {
          ...comment,
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          } : undefined,
        };
      })
    );

    return commentsWithUser as Comment[];
  }

  /**
   * Kiểm tra quyền xóa comment (chỉ nghệ sĩ sở hữu bài hát mới xóa được)
   */
  async canDeleteComment(commentId: number, userId: number): Promise<boolean> {
    const comment = await this.findOne(commentId);
    const song = await this.songRepository.findOne({ where: { id: comment.songId } });
    
    if (!song) {
      return false;
    }

    // Lấy artist từ userId
    const artist = await this.artistRepository.findOne({ where: { userId } });
    if (!artist) {
      return false;
    }

    // Kiểm tra nghệ sĩ có sở hữu bài hát không
    return song.artistId === artist.id;
  }

  /**
   * Xóa comment với kiểm tra quyền
   */
  async removeByArtist(id: number, userId: number): Promise<void> {
    const canDelete = await this.canDeleteComment(id, userId);
    if (!canDelete) {
      throw new ForbiddenException("Bạn không có quyền xóa bình luận này");
    }
    
    const comment = await this.findOne(id);
    await this.commentRepository.remove(comment);
  }

  /**
   * Lấy tất cả comments của user (với pagination và search)
   */
  async findByUser(
    userId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const where: any = { userId };
    if (search) {
      where.content = ILike(`%${search}%`);
    }

    const [data, total] = await this.commentRepository.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Load song info cho mỗi comment
    const commentsWithDetails = await Promise.all(
      data.map(async (comment) => {
        const song = await this.songRepository.findOne({ where: { id: comment.songId } });
        
        return {
          ...comment,
          song: song ? {
            id: song.id,
            title: song.title,
            artistId: song.artistId,
          } : undefined,
        };
      })
    );

    return { data: commentsWithDetails, total, page, limit };
  }

  /**
   * Xóa comment của user (chỉ user sở hữu comment mới xóa được)
   */
  async removeByUser(id: number, userId: number): Promise<void> {
    const comment = await this.findOne(id);
    
    if (comment.userId !== userId) {
      throw new ForbiddenException("Bạn không có quyền xóa bình luận này");
    }
    
    await this.commentRepository.remove(comment);
  }
}


