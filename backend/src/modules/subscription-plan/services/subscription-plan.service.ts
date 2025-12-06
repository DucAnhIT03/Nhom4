import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { SubscriptionPlan } from "../../../shared/schemas/subscription-plan.schema";
import { CreateSubscriptionPlanDto } from "../dtos/request/create-subscription-plan.dto";
import { UpdateSubscriptionPlanDto } from "../dtos/request/update-subscription-plan.dto";
import { QuerySubscriptionPlanDto } from "../dtos/request/query-subscription-plan.dto";

@Injectable()
export class SubscriptionPlanService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
  ) {}

  async findAll(
    query: QuerySubscriptionPlanDto,
  ): Promise<{ data: SubscriptionPlan[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where = query.search
      ? { planName: ILike(`%${query.search}%`) }
      : {};

    const [data, total] = await this.planRepository.findAndCount({
      where,
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException("Subscription plan not found");
    }
    return plan;
  }

  create(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const entity = this.planRepository.create(dto);
    return this.planRepository.save(entity);
  }

  async update(id: number, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const plan = await this.findOne(id);
    const merged = this.planRepository.merge(plan, dto);
    return this.planRepository.save(merged);
  }

  async remove(id: number): Promise<void> {
    const plan = await this.findOne(id);
    await this.planRepository.remove(plan);
  }
}


