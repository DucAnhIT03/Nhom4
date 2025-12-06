import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Album } from "../../../shared/schemas/album.schema";
import { Song } from "../../../shared/schemas/song.schema";
import { CreateAlbumDto } from "../dtos/request/create-album.dto";
import { UpdateAlbumDto } from "../dtos/request/update-album.dto";
import { UpdateAlbumSongsDto } from "../dtos/request/update-album-songs.dto";

@Injectable()
export class AlbumService {
  constructor(
    @InjectRepository(Album)
    private readonly albumRepository: Repository<Album>,
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
  ) {}

  findAll(): Promise<Album[]> {
    return this.albumRepository.find({
      relations: ["artist", "genre"],
    });
  }

  async findOne(id: number): Promise<Album> {
    const album = await this.albumRepository.findOne({ 
      where: { id },
      relations: ["artist", "genre"],
    });
    if (!album) {
      throw new NotFoundException("Album not found");
    }
    return album;
  }

  create(dto: CreateAlbumDto): Promise<Album> {
    const entity = this.albumRepository.create({
      ...dto,
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
    });
    return this.albumRepository.save(entity);
  }

  async update(id: number, dto: UpdateAlbumDto): Promise<Album> {
    const album = await this.findOne(id);
    // Nếu có artistId thì xóa genreId và ngược lại
    const updateData: any = {
      ...dto,
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : album.releaseDate,
    };
    
    if (dto.artistId !== undefined) {
      updateData.genreId = null;
    }
    if (dto.genreId !== undefined) {
      updateData.artistId = null;
    }
    
    const merged = this.albumRepository.merge(album, updateData);
    return this.albumRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    const album = await this.findOne(id);
    await this.albumRepository.remove(album);
  }

  async findTrending(limit = 10): Promise<Album[]> {
    const qb = this.albumRepository
      .createQueryBuilder("album")
      .leftJoin("songs", "song", "song.album_id = album.id")
      .select("album")
      .addSelect("COALESCE(SUM(song.views), 0)", "totalViews")
      .groupBy("album.id")
      .orderBy("totalViews", "DESC")
      .limit(limit);

    const result = await qb.getMany();
    return result;
  }

  async getSongs(albumId: number): Promise<Song[]> {
    await this.findOne(albumId);
    return this.songRepository.find({ 
      where: { albumId },
      relations: ["artist"],
    });
  }

  async addSongs(albumId: number, dto: UpdateAlbumSongsDto): Promise<void> {
    await this.findOne(albumId);

    await this.songRepository.update(
      { id: In(dto.songIds) },
      { albumId },
    );
  }

  async removeSongs(albumId: number, dto: UpdateAlbumSongsDto): Promise<void> {
    await this.findOne(albumId);

    await this.songRepository.delete({
      id: In(dto.songIds),
      albumId,
    });
  }

  /**
   * Tìm album theo artistId (ưu tiên album mới nhất)
   */
  async findByArtistId(artistId: number): Promise<Album | null> {
    const albums = await this.albumRepository.find({
      where: { artistId },
      order: { createdAt: "DESC" },
      take: 1,
    });
    return albums.length > 0 ? albums[0] : null;
  }

  /**
   * Tìm album theo genreId (ưu tiên album mới nhất)
   */
  async findByGenreId(genreId: number): Promise<Album | null> {
    const albums = await this.albumRepository.find({
      where: { genreId },
      order: { createdAt: "DESC" },
      take: 1,
    });
    return albums.length > 0 ? albums[0] : null;
  }
}


