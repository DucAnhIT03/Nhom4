import { Injectable, NotFoundException, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Genre } from "../../../shared/schemas/genre.schema";
import { SongGenre } from "../../../shared/schemas/song-genre.schema";
import { Song } from "../../../shared/schemas/song.schema";
import { CreateGenreDto } from "../dtos/request/create-genre.dto";
import { UpdateGenreDto } from "../dtos/request/update-genre.dto";
import { UpdateSongGenresDto } from "../dtos/request/update-song-genres.dto";
import { AlbumService } from "../../album/services/album.service";

@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(SongGenre)
    private readonly songGenreRepository: Repository<SongGenre>,
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
    @Inject(forwardRef(() => AlbumService))
    private readonly albumService: AlbumService,
  ) {}

  findAll(): Promise<Genre[]> {
    return this.genreRepository.find({
      order: { id: 'ASC' }, // Sắp xếp theo id để thể loại thêm trước hiển thị trước
    });
  }

  async findOne(id: number): Promise<Genre> {
    const genre = await this.genreRepository.findOne({ where: { id } });
    if (!genre) {
      throw new NotFoundException("Genre not found");
    }
    return genre;
  }

  create(dto: CreateGenreDto): Promise<Genre> {
    const entity = this.genreRepository.create(dto);
    return this.genreRepository.save(entity);
  }

  async update(id: number, dto: UpdateGenreDto): Promise<Genre> {
    const genre = await this.findOne(id);
    const merged = this.genreRepository.merge(genre, dto);
    return this.genreRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    const genre = await this.findOne(id);
    await this.genreRepository.remove(genre);
  }

  async updateSongGenres(dto: UpdateSongGenresDto): Promise<void> {
    const song = await this.songRepository.findOne({ where: { id: dto.songId } });
    if (!song) {
      throw new NotFoundException("Song not found");
    }

    // Xóa tất cả genres cũ trong bảng song_genre
    await this.songGenreRepository.delete({ songId: dto.songId });

    // Thêm genres mới vào bảng song_genre
    if (dto.genreIds.length > 0) {
      const entities = dto.genreIds.map((genreId) =>
        this.songGenreRepository.create({ songId: dto.songId, genreId }),
      );
      await this.songGenreRepository.save(entities);
    }

    // Cập nhật genreId trong bảng songs (để tương thích ngược)
    // Sử dụng genre đầu tiên nếu có, hoặc null nếu không có genre nào
    const updateData: any = { genreId: dto.genreIds.length > 0 ? dto.genreIds[0] : null };
    
    // Tự động tìm album của thể loại đầu tiên và cập nhật albumId của bài hát
    // (ưu tiên album của thể loại hơn album của nghệ sĩ)
    if (dto.genreIds.length > 0) {
      const firstGenreId = dto.genreIds[0];
      const album = await this.albumService.findByGenreId(firstGenreId);
      if (album) {
        updateData.albumId = album.id;
      }
    }
    
    // Cập nhật song với genreId và albumId mới
    await this.songRepository.update(dto.songId, updateData);
  }

  async getGenresOfSong(songId: number): Promise<Genre[]> {
    // Chỉ lấy genres từ bảng song_genre (many-to-many relationship)
    // Đây là nguồn chính xác nhất vì đã được cập nhật qua updateSongGenres
    const links = await this.songGenreRepository.find({ where: { songId } });
    
    if (links.length === 0) {
      return [];
    }
    
    const genreIds = links.map((l) => l.genreId);
    return this.genreRepository.findBy({ id: In(genreIds) });
  }

  /**
   * Lấy danh sách Top Genres dựa trên số lượng bài hát thuộc mỗi genre.
   * Mặc định trả về top 10.
   */
  async getTopGenres(limit = 10): Promise<Array<{ genre: Genre; songCount: number }>> {
    const rows = await this.songGenreRepository
      .createQueryBuilder("sg")
      .select("sg.genreId", "genreId")
      .addSelect("COUNT(*)", "songCount")
      .groupBy("sg.genreId")
      .orderBy("songCount", "DESC")
      .limit(limit)
      .getRawMany<{ genreId: number; songCount: string }>();

    if (!rows.length) {
      return [];
    }

    const genreIds = rows.map((r) => r.genreId);
    const genres = await this.genreRepository.findBy({ id: In(genreIds) });

    return rows.map((row) => ({
      genre: genres.find((g) => g.id === Number(row.genreId))!,
      songCount: Number(row.songCount),
    }));
  }

  /**
   * Lấy danh sách bài hát theo genre name.
   */
  async getSongsByGenreName(genreName: string): Promise<Song[]> {
    const genre = await this.genreRepository.findOne({ 
      where: { genreName } 
    });
    
    if (!genre) {
      throw new NotFoundException(`Genre with name "${genreName}" not found`);
    }

    const links = await this.songGenreRepository.find({ 
      where: { genreId: genre.id } 
    });
    
    if (links.length === 0) {
      return [];
    }

    const songIds = links.map((l) => l.songId);
    return this.songRepository.find({
      where: { id: In(songIds) },
      relations: ["artist"],
      order: { createdAt: "DESC" },
    });
  }
}


