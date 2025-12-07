import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Banner } from "../../../shared/schemas/banner.schema";
import { CreateBannerDto } from "../dtos/request/create-banner.dto";
import { UpdateBannerDto } from "../dtos/request/update-banner.dto";

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepository: Repository<Banner>,
  ) {}

  findAll(): Promise<Banner[]> {
    return this.bannerRepository.find({
      relations: ["song", "song.artist"],
      order: { createdAt: "ASC" },
    });
  }

  findActive(): Promise<Banner[]> {
    return this.bannerRepository.find({
      where: { isActive: true },
      relations: ["song", "song.artist"],
      order: { createdAt: "ASC" },
    });
  }

  async findOne(id: number): Promise<Banner> {
    const banner = await this.bannerRepository.findOne({ 
      where: { id },
      relations: ["song", "song.artist"],
    });
    if (!banner) {
      throw new NotFoundException("Banner not found");
    }
    return banner;
  }

  async create(dto: CreateBannerDto): Promise<Banner> {
    const entity = this.bannerRepository.create(dto);
    return this.bannerRepository.save(entity);
  }

  async update(id: number, dto: UpdateBannerDto): Promise<Banner> {
    const banner = await this.findOne(id);
    const merged = this.bannerRepository.merge(banner, dto);
    return this.bannerRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    const banner = await this.findOne(id);
    await this.bannerRepository.remove(banner);
  }
}

