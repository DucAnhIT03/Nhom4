import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
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

  getWishlist(userId: number): Promise<Wishlist[]> {
    return this.wishlistRepository.find({ where: { userId } });
  }

  async addHistory(dto: AddHistoryDto): Promise<void> {
    const entity = this.songHistoryRepository.create({
      userId: dto.userId,
      songId: dto.songId,
    });
    await this.songHistoryRepository.save(entity);
  }

  getHistory(userId: number): Promise<SongHistory[]> {
    return this.songHistoryRepository.find({
      where: { userId },
      order: { playedAt: "DESC" },
    });
  }
}


