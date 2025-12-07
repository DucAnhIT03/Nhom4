import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Between, Repository } from "typeorm";
import { Wishlist } from "../../../shared/schemas/wishlist.schema";
import { SongHistory } from "../../../shared/schemas/song-history.schema";
import { Song } from "../../../shared/schemas/song.schema";
import { ToggleWishlistDto } from "../dtos/request/toggle-wishlist.dto";
import { AddHistoryDto } from "../dtos/request/add-history.dto";
import { Genre } from "../../../shared/schemas/genre.schema";

@Injectable()
export class UserLibraryService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(SongHistory)
    private readonly songHistoryRepository: Repository<SongHistory>,
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
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

  async getMostPlayedSongs(userId: number, limit?: number): Promise<Array<{ song: Song; playCount: number }>> {
    // Đếm số lần phát của mỗi bài hát
    const playCounts = await this.songHistoryRepository
      .createQueryBuilder("history")
      .select("history.songId", "songId")
      .addSelect("COUNT(*)", "playCount")
      .where("history.userId = :userId", { userId })
      .groupBy("history.songId")
      .orderBy("COUNT(*)", "DESC")
      .limit(limit || 100)
      .getRawMany<{ songId: number; playCount: string }>();

    if (playCounts.length === 0) {
      return [];
    }

    const songIds = playCounts.map(pc => pc.songId);
    const songs = await this.songRepository.find({
      where: { id: In(songIds) },
      relations: ["artist"],
    });

    // Map songs với playCount theo đúng thứ tự (nhiều nhất trước)
    return playCounts.map(pc => ({
      song: songs.find(s => s.id === pc.songId)!,
      playCount: parseInt(pc.playCount, 10),
    })).filter(item => item.song); // Lọc bỏ những bài hát không tìm thấy
  }

  async getUserFavoriteGenresPopularSongs(userId: number, limit?: number): Promise<Array<{ song: Song; playCount: number }>> {
    // Tính thời gian 24 giờ gần nhất
    const now = new Date();
    const oneDayAgo = new Date(now);
    oneDayAgo.setHours(now.getHours() - 24);

    // Lấy lịch sử nghe của user trong 24 giờ gần nhất
    const userHistory = await this.songHistoryRepository.find({
      where: {
        userId,
        playedAt: Between(oneDayAgo, now),
      },
      order: { playedAt: "DESC" },
    });

    if (userHistory.length === 0) {
      return [];
    }

    // Lấy các songId từ history
    const songIds = [...new Set(userHistory.map(h => h.songId))];
    const userSongs = await this.songRepository.find({
      where: { id: In(songIds) },
      relations: ["artist"],
    });

    // Đếm số lần nghe mỗi genre trong 24 giờ gần nhất
    const genreCounts = new Map<number, number>();
    userHistory.forEach(history => {
      const song = userSongs.find(s => s.id === history.songId);
      if (song && song.genreId) {
        genreCounts.set(song.genreId, (genreCounts.get(song.genreId) || 0) + 1);
      }
    });

    if (genreCounts.size === 0) {
      return [];
    }

    // Lấy thể loại được nghe nhiều nhất (chỉ 1 thể loại)
    const topGenre = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    if (!topGenre) {
      return [];
    }

    // Lấy tất cả bài hát thuộc thể loại này
    const allSongsInGenre = await this.songRepository.find({
      where: { genreId: topGenre },
      relations: ["artist"],
    });

    if (allSongsInGenre.length === 0) {
      return [];
    }

    // Đếm số lần phát của mỗi bài hát (từ tất cả users, không giới hạn thời gian)
    const playCounts = await this.songHistoryRepository
      .createQueryBuilder("history")
      .select("history.songId", "songId")
      .addSelect("COUNT(*)", "playCount")
      .where("history.songId IN (:...songIds)", { songIds: allSongsInGenre.map(s => s.id) })
      .groupBy("history.songId")
      .orderBy("COUNT(*)", "DESC")
      .limit(limit || 50)
      .getRawMany<{ songId: number; playCount: string }>();

    if (playCounts.length === 0) {
      return [];
    }

    const playCountMap = new Map<number, number>();
    playCounts.forEach(pc => {
      playCountMap.set(pc.songId, parseInt(pc.playCount, 10));
    });

    const resultSongIds = playCounts.map(pc => pc.songId);
    const resultSongs = allSongsInGenre.filter(s => resultSongIds.includes(s.id));

    // Map songs với playCount, sắp xếp theo playCount (nhiều lượt nghe nhất trước)
    return resultSongs
      .map(song => ({
        song,
        playCount: playCountMap.get(song.id) || song.views || 0,
      }))
      .sort((a, b) => b.playCount - a.playCount);
  }
}


