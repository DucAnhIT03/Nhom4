import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { Payment, PaymentStatus } from "../../../shared/schemas/payment.schema";
import { Subscription } from "../../../shared/schemas/subscription.schema";
import { SubscriptionPlan } from "../../../shared/schemas/subscription-plan.schema";
import { CreatePaymentDto } from "../dtos/request/create-payment.dto";
import { QueryPaymentDto } from "../dtos/request/query-payment.dto";

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
  ) {}

  async create(dto: CreatePaymentDto): Promise<Payment> {
    const plan = await this.planRepository.findOne({ where: { id: dto.planId } });
    if (!plan) {
      throw new NotFoundException("Subscription plan not found");
    }

    const payment = this.paymentRepository.create({
      userId: dto.userId,
      planId: dto.planId,
      transactionId: dto.transactionId,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      paymentStatus: PaymentStatus.COMPLETED,
      paymentDate: new Date(),
    });
    const savedPayment = await this.paymentRepository.save(payment);

    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + plan.durationDay);

    const existingSub = await this.subscriptionRepository.findOne({
      where: { userId: dto.userId },
    });

    if (existingSub) {
      existingSub.plan = plan.planName as any;
      existingSub.startTime = now;
      existingSub.endTime = end;
      existingSub.status = "ACTIVE" as any;
      await this.subscriptionRepository.save(existingSub);
    } else {
      const subscription = this.subscriptionRepository.create({
        userId: dto.userId,
        plan: plan.planName as any,
        startTime: now,
        endTime: end,
        status: "ACTIVE" as any,
      });
      await this.subscriptionRepository.save(subscription);
    }

    return savedPayment;
  }

  findByUser(userId: number): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { userId },
      order: { paymentDate: "DESC" },
    });
  }

  async findAllForAdmin(
    query: QueryPaymentDto,
  ): Promise<{ data: Payment[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: any = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.planId) {
      where.planId = query.planId;
    }

    if (query.paymentMethod) {
      where.paymentMethod = query.paymentMethod;
    }

    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus;
    }

    if (query.search) {
      where.transactionId = ILike(`%${query.search}%`);
    }

    const [data, total] = await this.paymentRepository.findAndCount({
      where,
      order: { paymentDate: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }
}

