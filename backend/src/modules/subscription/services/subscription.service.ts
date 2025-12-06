import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Subscription } from "../../../shared/schemas/subscription.schema";
import { CreateSubscriptionDto } from "../dtos/request/create-subscription.dto";
import { UpdateSubscriptionDto } from "../dtos/request/update-subscription.dto";

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  findAll(): Promise<Subscription[]> {
    return this.subscriptionRepository.find();
  }

  async findOne(id: number): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({ where: { id } });
    if (!subscription) {
      throw new NotFoundException("Subscription not found");
    }
    return subscription;
  }

  create(dto: CreateSubscriptionDto): Promise<Subscription> {
    const entity = this.subscriptionRepository.create({
      ...dto,
      startTime: dto.startTime ? new Date(dto.startTime) : new Date(),
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
    });
    return this.subscriptionRepository.save(entity);
  }

  async update(id: number, dto: UpdateSubscriptionDto): Promise<Subscription> {
    const subscription = await this.findOne(id);
    const merged = this.subscriptionRepository.merge(subscription, {
      ...dto,
      startTime: dto.startTime ? new Date(dto.startTime) : subscription.startTime,
      endTime: dto.endTime ? new Date(dto.endTime) : subscription.endTime,
    });
    return this.subscriptionRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    const subscription = await this.findOne(id);
    await this.subscriptionRepository.remove(subscription);
  }

  findByUser(userId: number): Promise<Subscription[]> {
    return this.subscriptionRepository.find({ where: { userId } });
  }
}


