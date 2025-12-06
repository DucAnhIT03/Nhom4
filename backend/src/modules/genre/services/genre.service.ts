import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Genre } from "../../../shared/schemas/genre.schema";
import { SongGenre } from "../../../shared/schemas/song-genre.schema";
import { Song } from "../../../shared/schemas/song.schema";
import { CreateGenreDto } from "../dtos/request/create-genre.dto";
import { UpdateGenreDto } from "../dtos/request/update-genre.dto";
import { UpdateSongGenresDto } from "../dtos/request/update-song-genres.dto";

@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(SongGenre)
    private readonly songGenreRepository: Repository<SongGenre>,
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
  ) {}

  findAll(): Promise<Genre[]> {
    return this.genreRepository.find();
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

    await this.songGenreRepository.delete({ songId: dto.songId });

    const entities = dto.genreIds.map((genreId) =>
      this.songGenreRepository.create({ songId: dto.songId, genreId }),
    );
    await this.songGenreRepository.save(entities);
  }

  async getGenresOfSong(songId: number): Promise<Genre[]> {
    const links = await this.songGenreRepository.find({ where: { songId } });
    if (links.length === 0) {
      return [];
    }
    const ids = links.map((l) => l.genreId);
    return this.genreRepository.findBy({ id: In(ids) });
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
}


