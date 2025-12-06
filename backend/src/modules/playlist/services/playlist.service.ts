import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Playlist } from "../../../shared/schemas/playlist.schema";
import { PlaylistSong } from "../../../shared/schemas/playlist-song.schema";
import { Song } from "../../../shared/schemas/song.schema";
import { Download } from "../../../shared/schemas/download.schema";
import { CreatePlaylistDto } from "../dtos/request/create-playlist.dto";
import { UpdatePlaylistDto } from "../dtos/request/update-playlist.dto";
import { UpdatePlaylistSongsDto } from "../dtos/request/update-playlist-songs.dto";
import { DownloadSongDto } from "../dtos/request/download-song.dto";

@Injectable()
export class PlaylistService {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlistRepository: Repository<Playlist>,
    @InjectRepository(PlaylistSong)
    private readonly playlistSongRepository: Repository<PlaylistSong>,
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
    @InjectRepository(Download)
    private readonly downloadRepository: Repository<Download>,
  ) {}

  findAll(): Promise<Playlist[]> {
    return this.playlistRepository.find();
  }

  async findOne(id: number): Promise<Playlist> {
    const playlist = await this.playlistRepository.findOne({ where: { id } });
    if (!playlist) {
      throw new NotFoundException("Playlist not found");
    }
    return playlist;
  }

  create(dto: CreatePlaylistDto): Promise<Playlist> {
    const entity = this.playlistRepository.create({
      ...dto,
      isPublic: dto.isPublic ?? false,
    });
    return this.playlistRepository.save(entity);
  }

  async update(id: number, dto: UpdatePlaylistDto): Promise<Playlist> {
    const playlist = await this.findOne(id);
    const merged = this.playlistRepository.merge(playlist, dto);
    return this.playlistRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    const playlist = await this.findOne(id);
    await this.playlistRepository.remove(playlist);
  }

  async addSongs(playlistId: number, dto: UpdatePlaylistSongsDto): Promise<void> {
    await this.findOne(playlistId);
    const entities = dto.songIds.map((songId) =>
      this.playlistSongRepository.create({ playlistId, songId }),
    );
    await this.playlistSongRepository.save(entities);
  }

  async removeSongs(playlistId: number, dto: UpdatePlaylistSongsDto): Promise<void> {
    await this.findOne(playlistId);
    await this.playlistSongRepository.delete(
      dto.songIds.map((songId) => ({ playlistId, songId })),
    );
  }

  async getSongs(playlistId: number): Promise<Song[]> {
    await this.findOne(playlistId);
    const relations = await this.playlistSongRepository.find({ where: { playlistId } });
    if (relations.length === 0) {
      return [];
    }

    const songIds = relations.map((r) => r.songId);
    return this.songRepository.findBy({ id: In(songIds) });
  }

  async downloadSongFromPlaylist(
    playlistId: number,
    songId: number,
    dto: DownloadSongDto,
  ): Promise<{ fileUrl: string | null }> {
    await this.findOne(playlistId);

    const link = await this.playlistSongRepository.findOne({
      where: { playlistId, songId },
    });
    if (!link) {
      throw new NotFoundException("Song not found in playlist");
    }

    const song = await this.songRepository.findOne({ where: { id: songId } });
    if (!song) {
      throw new NotFoundException("Song not found");
    }

    song.views += 1;
    await this.songRepository.save(song);

    const existing = await this.downloadRepository.findOne({
      where: { userId: dto.userId, songId },
    });
    if (!existing) {
      const download = this.downloadRepository.create({
        userId: dto.userId,
        songId,
      });
      await this.downloadRepository.save(download);
    }

    return { fileUrl: song.fileUrl ?? null };
  }
}


