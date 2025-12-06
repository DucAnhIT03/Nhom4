import { Injectable, NotFoundException, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";
import { Song } from "../../../shared/schemas/song.schema";
import { SongHistory } from "../../../shared/schemas/song-history.schema";
import { CreateSongDto } from "../dtos/request/create-song.dto";
import { UpdateSongDto } from "../dtos/request/update-song.dto";
import { AlbumService } from "../../album/services/album.service";

@Injectable()
export class SongService {
  constructor(
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
    @InjectRepository(SongHistory)
    private readonly songHistoryRepository: Repository<SongHistory>,
    @Inject(forwardRef(() => AlbumService))
    private readonly albumService: AlbumService,
  ) {}

  findAll(): Promise<Song[]> {
    return this.songRepository.find({
      relations: ["artist"],
    });
  }

  async findOne(id: number): Promise<Song> {
    const song = await this.songRepository.findOne({ 
      where: { id },
      relations: ["artist"],
    });
    if (!song) {
      throw new NotFoundException("Song not found");
    }
    return song;
  }

  async create(dto: CreateSongDto): Promise<Song> {
    // Tự động tìm album của nghệ sĩ nếu chưa có albumId
    if (!dto.albumId && dto.artistId) {
      const album = await this.albumService.findByArtistId(dto.artistId);
      if (album) {
        dto.albumId = album.id;
      }
    }

    const entity = this.songRepository.create(dto);
    return this.songRepository.save(entity);
  }

  async update(id: number, dto: UpdateSongDto): Promise<Song> {
    const song = await this.findOne(id);
    const merged = this.songRepository.merge(song, dto);
    return this.songRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    const song = await this.findOne(id);
    await this.songRepository.remove(song);
  }

  /**
   * Lấy top track theo tuần (7 ngày gần nhất) dựa trên bảng song_histories.
   * Mặc định trả về top 10.
   */
  async getWeeklyTopTracks(limit = 10): Promise<Array<{ song: Song; playCount: number }>> {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const rows = await this.songHistoryRepository
      .createQueryBuilder("history")
      .select("history.songId", "songId")
      .addSelect("COUNT(*)", "playCount")
      .where("history.playedAt BETWEEN :start AND :end", {
        start: sevenDaysAgo,
        end: now,
      })
      .groupBy("history.songId")
      .orderBy("playCount", "DESC")
      .limit(limit)
      .getRawMany<{ songId: number; playCount: string }>();

    if (!rows.length) {
      return [];
    }

    const songIds = rows.map((r) => r.songId);
    const songs = await this.songRepository.findByIds(songIds);

    // Map theo đúng thứ tự playCount
    return rows.map((row) => ({
      song: songs.find((s) => s.id === Number(row.songId))!,
      playCount: Number(row.playCount),
    }));
  }

  /**
   * Lấy danh sách các bài hát mới phát hành (order theo createdAt DESC).
   * Mặc định trả về 20 bài.
   */
  async getNewReleases(limit = 20): Promise<Song[]> {
    return this.songRepository.find({
      relations: ["artist"],
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  /**
   * Lấy danh sách bài hát theo artist ID.
   */
  async findByArtistId(artistId: number): Promise<Song[]> {
    return this.songRepository.find({
      where: { artistId },
      relations: ["artist"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Tăng lượt nghe (views) của bài hát lên 1.
   */
  async incrementViews(id: number): Promise<Song> {
    const song = await this.findOne(id);
    song.views = (song.views || 0) + 1;
    return this.songRepository.save(song);
  }
}


