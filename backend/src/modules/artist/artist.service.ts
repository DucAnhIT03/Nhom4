import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { Artist } from "../../shared/schemas/artist.schema";
import { CreateArtistDto } from "./dtos/request/create-artist.dto";
import { UpdateArtistDto } from "./dtos/request/update-artist.dto";
import { QueryArtistDto } from "./dtos/request/query-artist.dto";
import { ArtistResponseDto } from "./dtos/response/artist-response.dto";

@Injectable()
export class ArtistService {
  constructor(
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
  ) {}

  async findAll(query: QueryArtistDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const [artists, total] = await this.artistRepository.findAndCount({
      where: search
        ? [
            { artistName: Like(`%${search}%`) },
          ]
        : undefined,
      skip,
      take: limit,
      order: { createdAt: "DESC" },
    });

    return {
      data: artists.map((artist) => ArtistResponseDto.fromEntity(artist)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number) {
    const artist = await this.artistRepository.findOne({ where: { id } });
    if (!artist) {
      throw new NotFoundException("Artist not found");
    }

    return ArtistResponseDto.fromEntity(artist);
  }

  async create(createArtistDto: CreateArtistDto) {
    const existing = await this.artistRepository.findOne({
      where: { artistName: createArtistDto.artistName },
    });
    if (existing) {
      throw new ConflictException("Artist name already exists");
    }

    const artist = this.artistRepository.create({
      artistName: createArtistDto.artistName,
      bio: createArtistDto.bio,
      avatar: createArtistDto.avatar,
      nationality: createArtistDto.nationality,
      age: createArtistDto.age,
    });

    const savedArtist = await this.artistRepository.save(artist);
    return this.findOne(savedArtist.id);
  }

  async update(id: number, updateArtistDto: UpdateArtistDto) {
    const artist = await this.artistRepository.findOne({ where: { id } });
    if (!artist) {
      throw new NotFoundException("Artist not found");
    }

    if (updateArtistDto.artistName) {
      const existing = await this.artistRepository.findOne({
        where: { artistName: updateArtistDto.artistName },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException("Artist name already exists");
      }
    }

    Object.assign(artist, updateArtistDto);
    await this.artistRepository.save(artist);

    return this.findOne(id);
  }

  async remove(id: number) {
    const artist = await this.artistRepository.findOne({ where: { id } });
    if (!artist) {
      throw new NotFoundException("Artist not found");
    }

    await this.artistRepository.remove(artist);
    return { message: "Artist deleted successfully" };
  }
}

