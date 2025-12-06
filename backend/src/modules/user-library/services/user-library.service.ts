import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Wishlist } from "../../../shared/schemas/wishlist.schema";
import { SongHistory } from "../../../shared/schemas/song-history.schema";
import { Song } from "../../../shared/schemas/song.schema";
import { ToggleWishlistDto } from "../dtos/request/toggle-wishlist.dto";
import { AddHistoryDto } from "../dtos/request/add-history.dto";

@Injectable()
export class UserLibraryService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(SongHistory)
    private readonly songHistoryRepository: Repository<SongHistory>,
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
  ) {}

  async toggleWishlist(dto: ToggleWishlistDto): Promise<{ isFavorite: boolean }> {
    const existing = await this.wishlistRepository.findOne({
      where: { userId: dto.userId, songId: dto.songId },
    });

    if (existing) {
      await this.wishlistRepository.remove(existing);
      return { isFavorite: false };
    }

    const entity = this.wishlistRepository.create({
      userId: dto.userId,
      songId: dto.songId,
    });
    await this.wishlistRepository.save(entity);
    return { isFavorite: true };
  }

  async getWishlist(userId: number): Promise<Array<{ song: Song; wishlist: Wishlist }>> {
    const wishlists = await this.wishlistRepository.find({ where: { userId } });
    
    if (wishlists.length === 0) {
      return [];
    }

    const songIds = wishlists.map(w => w.songId);
    const songs = await this.songRepository.find({
      where: { id: In(songIds) },
      relations: ["artist"],
      order: { createdAt: "DESC" },
    });

    // Map songs với wishlist theo đúng thứ tự
    return wishlists.map(wishlist => ({
      song: songs.find(s => s.id === wishlist.songId)!,
      wishlist,
    })).filter(item => item.song); // Lọc bỏ những bài hát không tìm thấy
  }

  async addHistory(dto: AddHistoryDto): Promise<void> {
    const entity = this.songHistoryRepository.create({
      userId: dto.userId,
      songId: dto.songId,
    });
    await this.songHistoryRepository.save(entity);
  }

  async getHistory(userId: number): Promise<Array<{ song: Song; history: SongHistory }>> {
    // Lấy tất cả lịch sử, sắp xếp theo thời gian phát mới nhất
    const allHistory = await this.songHistoryRepository.find({
      where: { userId },
      order: { playedAt: "DESC" },
    });

    if (allHistory.length === 0) {
      return [];
    }

    // Lọc để chỉ lấy bài hát unique (lấy lần phát mới nhất của mỗi bài hát)
    const uniqueSongIds = new Map<number, SongHistory>();
    for (const history of allHistory) {
      if (!uniqueSongIds.has(history.songId)) {
        uniqueSongIds.set(history.songId, history);
      }
    }

    const songIds = Array.from(uniqueSongIds.keys());
    const songs = await this.songRepository.find({
      where: { id: In(songIds) },
      relations: ["artist"],
    });

    // Map songs với history theo đúng thứ tự (mới nhất trước)
    const uniqueHistories = Array.from(uniqueSongIds.values());
    uniqueHistories.sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime());

    return uniqueHistories.map(history => ({
      song: songs.find(s => s.id === history.songId)!,
      history,
    })).filter(item => item.song); // Lọc bỏ những bài hát không tìm thấy
  }
}


