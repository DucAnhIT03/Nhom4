import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";
import { Song } from "../../../shared/schemas/song.schema";
import { SongHistory } from "../../../shared/schemas/song-history.schema";
import { CreateSongDto } from "../dtos/request/create-song.dto";
import { UpdateSongDto } from "../dtos/request/update-song.dto";

@Injectable()
export class SongService {
  constructor(
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
    @InjectRepository(SongHistory)
    private readonly songHistoryRepository: Repository<SongHistory>,
  ) {}

  findAll(): Promise<Song[]> {
    return this.songRepository.find();
  }

  async findOne(id: number): Promise<Song> {
    const song = await this.songRepository.findOne({ where: { id } });
    if (!song) {
      throw new NotFoundException("Song not found");
    }
    return song;
  }

  create(dto: CreateSongDto): Promise<Song> {
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
      order: { createdAt: "DESC" },
      take: limit,
    });
  }
}


