import { Injectable, NotFoundException, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, In, ILike, Repository } from "typeorm";
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

  async findAll(): Promise<Song[]> {
    const songs = await this.songRepository.find({
      relations: ["artist"],
    });
    console.log(`[SongService] findAll: Found ${songs.length} songs in database`);
    return songs;
  }

  async findOne(id: number): Promise<Song> {
    // Sử dụng findOne với relations và đảm bảo tất cả fields được select
    const song = await this.songRepository.findOne({ 
      where: { id },
      relations: ["artist"],
      // Không cần select vì TypeORM sẽ tự động select tất cả fields
    });
    
    if (!song) {
      throw new NotFoundException("Song not found");
    }
    
    // Debug: Log để kiểm tra lyrics
    console.log(`[SongService] Song ID ${id} - Lyrics:`, song.lyrics);
    console.log(`[SongService] Song ID ${id} - Lyrics type:`, typeof song.lyrics);
    console.log(`[SongService] Song ID ${id} - Lyrics length:`, song.lyrics?.length);
    console.log(`[SongService] Song ID ${id} - Full song object keys:`, Object.keys(song));
    
    // Đảm bảo lyrics được trả về (kể cả khi null hoặc undefined)
    // TypeORM sẽ tự động trả về null nếu field là null trong database
    // Không cần set null vì TypeScript type là string | undefined, và undefined sẽ được serialize thành null trong JSON
    
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
    const songs = await this.songRepository.find({
      where: { id: In(songIds) },
      relations: ["artist"],
    });

    // Map theo đúng thứ tự playCount
    return rows.map((row) => ({
      song: songs.find((s) => s.id === Number(row.songId))!,
      playCount: Number(row.playCount),
    }));
  }

  /**
   * Lấy top track của tất cả thời gian (all time) dựa trên tổng lượt nghe từ tất cả users.
   * Mặc định trả về top 50.
   */
  async getTopTracksOfAllTime(limit = 50): Promise<Array<{ song: Song; playCount: number }>> {
    const rows = await this.songHistoryRepository
      .createQueryBuilder("history")
      .select("history.songId", "songId")
      .addSelect("COUNT(*)", "playCount")
      .groupBy("history.songId")
      .orderBy("COUNT(*)", "DESC")
      .limit(limit)
      .getRawMany<{ songId: number; playCount: string }>();

    if (!rows.length) {
      return [];
    }

    const songIds = rows.map((r) => r.songId);
    const songs = await this.songRepository.find({
      where: { id: In(songIds) },
      relations: ["artist"],
    });

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

  /**
   * Tìm kiếm bài hát theo tên (title).
   * Không phân biệt chữ hoa chữ thường và bỏ qua khoảng trắng.
   * @param search - Từ khóa tìm kiếm
   * @param limit - Số lượng kết quả tối đa, mặc định 50
   */
  async searchByTitle(search: string, limit: number = 50): Promise<Song[]> {
    if (!search || search.trim().length === 0) {
      return [];
    }

    // Normalize search term: loại bỏ khoảng trắng thừa và chuyển về chữ thường
    const normalizedSearch = search.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\s/g, '');
    
    console.log(`[SongService] Searching for: "${search}"`);
    console.log(`[SongService] Normalized search term (no spaces): "${normalizedSearch}"`);

    // Sử dụng createQueryBuilder với MySQL functions để tối ưu
    // REPLACE(LOWER(song.title), ' ', '') loại bỏ khoảng trắng và chuyển về chữ thường
    const queryBuilder = this.songRepository
      .createQueryBuilder("song")
      .leftJoinAndSelect("song.artist", "artist")
      .where(
        "REPLACE(LOWER(song.title), ' ', '') LIKE :search",
        { search: `%${normalizedSearch}%` }
      )
      .orderBy("song.views", "DESC")
      .addOrderBy("song.createdAt", "DESC")
      .take(limit);

    const results = await queryBuilder.getMany();

    console.log(`[SongService] Found ${results.length} results for "${search}"`);
    if (results.length > 0) {
      console.log(`[SongService] First result:`, results[0].title);
      console.log(`[SongService] Sample results:`, results.slice(0, 3).map(s => s.title));
    } else {
      // Debug: Lấy một vài bài hát để xem format
      const sampleSongs = await this.songRepository.find({ 
        take: 5,
        relations: ["artist"]
      });
      console.log(`[SongService] Total songs checked. Sample songs in DB:`, sampleSongs.map(s => ({
        id: s.id,
        title: s.title,
        normalized: s.title.toLowerCase().replace(/\s+/g, ' ').replace(/\s/g, '')
      })));
    }
    
    return results;
  }
}


