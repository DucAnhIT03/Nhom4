import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { Artist } from "../../../shared/schemas/artist.schema";
import { User } from "../../../shared/schemas/user.schema";
import { Album } from "../../../shared/schemas/album.schema";
import { Song } from "../../../shared/schemas/song.schema";
import { SongGenre } from "../../../shared/schemas/song-genre.schema";
import { CreateAlbumDto } from "../../album/dtos/request/create-album.dto";
import { UpdateAlbumDto } from "../../album/dtos/request/update-album.dto";
import { CreateArtistAlbumDto } from "../dtos/request/create-artist-album.dto";
import { UpdateArtistAlbumDto } from "../dtos/request/update-artist-album.dto";
import { CreateSongDto } from "../../song/dtos/request/create-song.dto";
import { UpdateSongDto } from "../../song/dtos/request/update-song.dto";
import { CreateArtistSongDto } from "../dtos/request/create-artist-song.dto";
import { UpdateArtistSongDto } from "../dtos/request/update-artist-song.dto";

@Injectable()
export class ArtistMyContentService {
  constructor(
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Album)
    private readonly albumRepository: Repository<Album>,
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
    @InjectRepository(SongGenre)
    private readonly songGenreRepository: Repository<SongGenre>,
  ) {}

  /**
   * Lấy artist ID từ user ID, tự động tạo nếu chưa có
   */
  async getArtistByUserId(userId: number): Promise<Artist> {
    let artist = await this.artistRepository.findOne({
      where: { userId },
    });
    
    if (!artist) {
      // Tự động tạo Artist record nếu chưa có
      const user = await this.userRepository.findOne({ where: { id: userId } });
      
      if (!user) {
        throw new NotFoundException("User not found");
      }
      
      // Tạo tên nghệ sĩ mặc định từ tên user
      const defaultArtistName = `${user.firstName} ${user.lastName}`.trim() || `Artist ${userId}`;
      
      artist = this.artistRepository.create({
        artistName: defaultArtistName,
        userId: userId,
        bio: `Nghệ sĩ ${defaultArtistName}`,
      });
      
      artist = await this.artistRepository.save(artist);
    }
    
    return artist;
  }

  /**
   * Kiểm tra album thuộc về artist
   */
  async verifyAlbumOwnership(albumId: number, artistId: number): Promise<Album> {
    const album = await this.albumRepository.findOne({
      where: { id: albumId, artistId },
    });
    if (!album) {
      throw new ForbiddenException("Bạn không có quyền truy cập album này");
    }
    return album;
  }

  /**
   * Kiểm tra bài hát thuộc về artist
   */
  async verifySongOwnership(songId: number, artistId: number): Promise<Song> {
    const song = await this.songRepository.findOne({
      where: { id: songId, artistId },
    });
    if (!song) {
      throw new ForbiddenException("Bạn không có quyền truy cập bài hát này");
    }
    return song;
  }

  /**
   * Lấy danh sách album của artist
   */
  async getMyAlbums(userId: number, page: number = 1, limit: number = 10, search?: string) {
    const artist = await this.getArtistByUserId(userId);
    
    const skip = (page - 1) * limit;
    const where: any = { artistId: artist.id };
    
    if (search) {
      where.title = Like(`%${search}%`);
    }

    const [albums, total] = await this.albumRepository.findAndCount({
      where,
      relations: ["artist", "genre"],
      skip,
      take: limit,
      order: { createdAt: "DESC" },
    });

    // Đếm số bài hát trong mỗi album
    const albumsWithSongCount = await Promise.all(
      albums.map(async (album) => {
        const songCount = await this.songRepository.count({
          where: { albumId: album.id },
        });
        return {
          ...album,
          songCount,
        };
      }),
    );

    return {
      data: albumsWithSongCount,
      total,
      page,
      limit,
    };
  }

  /**
   * Tạo album mới
   */
  async createMyAlbum(userId: number, dto: CreateArtistAlbumDto) {
    const artist = await this.getArtistByUserId(userId);
    
    const album = this.albumRepository.create({
      ...dto,
      artistId: artist.id,
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
    });
    
    return this.albumRepository.save(album);
  }

  /**
   * Cập nhật album
   */
  async updateMyAlbum(userId: number, albumId: number, dto: UpdateArtistAlbumDto) {
    const artist = await this.getArtistByUserId(userId);
    await this.verifyAlbumOwnership(albumId, artist.id);

    const album = await this.albumRepository.findOne({ where: { id: albumId } });
    if (!album) {
      throw new NotFoundException("Album not found");
    }

    const updateData: any = {
      ...dto,
    };
    
    if ((dto as any).releaseDate !== undefined) {
      updateData.releaseDate = (dto as any).releaseDate ? new Date((dto as any).releaseDate) : null;
    }

    const merged = this.albumRepository.merge(album, updateData);
    return this.albumRepository.save(merged);
  }

  /**
   * Xóa album (chỉ khi không có bài hát)
   */
  async deleteMyAlbum(userId: number, albumId: number) {
    const artist = await this.getArtistByUserId(userId);
    await this.verifyAlbumOwnership(albumId, artist.id);

    const songCount = await this.songRepository.count({
      where: { albumId },
    });

    if (songCount > 0) {
      throw new ForbiddenException("Không thể xóa album có chứa bài hát. Vui lòng xóa tất cả bài hát trước.");
    }

    await this.albumRepository.delete(albumId);
    return { message: "Album đã được xóa thành công" };
  }

  /**
   * Lấy danh sách tất cả bài hát của nghệ sĩ
   */
  async getMySongs(userId: number, page: number = 1, limit: number = 10, search?: string) {
    const artist = await this.getArtistByUserId(userId);
    
    const skip = (page - 1) * limit;
    const where: any = { artistId: artist.id };
    
    if (search) {
      where.title = Like(`%${search}%`);
    }

    const [songs, total] = await this.songRepository.findAndCount({
      where,
      relations: ["artist"],
      skip,
      take: limit,
      order: { createdAt: "DESC" },
    });

    return {
      data: songs,
      total,
      page,
      limit,
    };
  }

  /**
   * Lấy danh sách bài hát trong album
   */
  async getMyAlbumSongs(userId: number, albumId: number) {
    const artist = await this.getArtistByUserId(userId);
    await this.verifyAlbumOwnership(albumId, artist.id);

    const songs = await this.songRepository.find({
      where: { albumId, artistId: artist.id },
      relations: ["artist"],
      order: { createdAt: "DESC" },
    });

    return songs;
  }

  /**
   * Tạo bài hát mới
   */
  async createMySong(userId: number, dto: CreateArtistSongDto) {
    const artist = await this.getArtistByUserId(userId);
    
    const song = this.songRepository.create({
      ...dto,
      artistId: artist.id,
    });

    const savedSong = await this.songRepository.save(song);

    // Tự động sync genreId vào bảng song_genre nếu có
    if (dto.genreId) {
      const existingLink = await this.songGenreRepository.findOne({
        where: { songId: savedSong.id, genreId: dto.genreId },
      });
      
      if (!existingLink) {
        const songGenre = this.songGenreRepository.create({
          songId: savedSong.id,
          genreId: dto.genreId,
        });
        await this.songGenreRepository.save(songGenre);
      }
    }

    return savedSong;
  }

  /**
   * Thêm bài hát vào album
   */
  async addSongToMyAlbum(userId: number, albumId: number, dto: CreateArtistSongDto) {
    const artist = await this.getArtistByUserId(userId);
    await this.verifyAlbumOwnership(albumId, artist.id);

    const song = this.songRepository.create({
      ...dto,
      artistId: artist.id,
      albumId,
    });

    const savedSong = await this.songRepository.save(song);

    // Tự động sync genreId vào bảng song_genre nếu có
    if (dto.genreId) {
      const existingLink = await this.songGenreRepository.findOne({
        where: { songId: savedSong.id, genreId: dto.genreId },
      });
      
      if (!existingLink) {
        const songGenre = this.songGenreRepository.create({
          songId: savedSong.id,
          genreId: dto.genreId,
        });
        await this.songGenreRepository.save(songGenre);
      }
    }

    return savedSong;
  }

  /**
   * Cập nhật bài hát
   */
  async updateMySong(userId: number, songId: number, dto: UpdateArtistSongDto) {
    const artist = await this.getArtistByUserId(userId);
    await this.verifySongOwnership(songId, artist.id);

    const song = await this.songRepository.findOne({ where: { id: songId } });
    if (!song) {
      throw new NotFoundException("Song not found");
    }

    const merged = this.songRepository.merge(song, dto);
    const savedSong = await this.songRepository.save(merged);

    // Tự động sync genreId vào bảng song_genre nếu có
    if (dto.genreId !== undefined) {
      if (dto.genreId) {
        // Nếu có genreId, thêm vào bảng song_genre nếu chưa có
        const existingLink = await this.songGenreRepository.findOne({
          where: { songId: savedSong.id, genreId: dto.genreId },
        });
        
        if (!existingLink) {
          const songGenre = this.songGenreRepository.create({
            songId: savedSong.id,
            genreId: dto.genreId,
          });
          await this.songGenreRepository.save(songGenre);
        }
      } else {
        // Nếu genreId là null/undefined, không xóa các genres khác trong song_genre
        // (chỉ cập nhật field genreId của song)
      }
    }

    return savedSong;
  }

  /**
   * Xóa bài hát khỏi album
   */
  async deleteMySong(userId: number, songId: number) {
    const artist = await this.getArtistByUserId(userId);
    await this.verifySongOwnership(songId, artist.id);

    await this.songRepository.delete(songId);
    return { message: "Bài hát đã được xóa thành công" };
  }
}

