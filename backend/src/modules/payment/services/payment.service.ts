import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { Payment, PaymentMethod, PaymentStatus } from "../../../shared/schemas/payment.schema";
import { Subscription, SubscriptionPlanType, SubscriptionStatus } from "../../../shared/schemas/subscription.schema";
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
      paymentStatus: dto.paymentMethod === PaymentMethod.MOMO ? PaymentStatus.PENDING : PaymentStatus.COMPLETED,
      paymentDate: new Date(),
    });
    const savedPayment = await this.paymentRepository.save(payment);

    // Chỉ cập nhật subscription nếu payment đã completed (không phải MoMo pending)
    if (dto.paymentMethod !== PaymentMethod.MOMO) {
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + plan.durationDay);

      const existingSub = await this.subscriptionRepository.findOne({
        where: { userId: dto.userId },
      });

      if (existingSub) {
        existingSub.plan = SubscriptionPlanType.PREMIUM;
        existingSub.startTime = now;
        existingSub.endTime = end;
        existingSub.status = SubscriptionStatus.ACTIVE;
        await this.subscriptionRepository.save(existingSub);
      } else {
        const subscription = this.subscriptionRepository.create({
          userId: dto.userId,
          plan: SubscriptionPlanType.PREMIUM,
          startTime: now,
          endTime: end,
          status: SubscriptionStatus.ACTIVE,
        });
        await this.subscriptionRepository.save(subscription);
      }
    }

    return savedPayment;
  }

  async completeMomoPayment(orderId: string, transactionId: string): Promise<Payment> {
    // Parse orderId để lấy paymentId hoặc tìm payment theo orderId
    // Giả sử orderId có format: ORD{userId}_{timestamp} hoặc lưu paymentId vào orderId
    const payment = await this.paymentRepository.findOne({
      where: { transactionId: orderId },
      order: { createdAt: 'DESC' },
    });

    if (!payment) {
      throw new NotFoundException("Payment not found");
    }

    // Cập nhật payment status
    payment.paymentStatus = PaymentStatus.COMPLETED;
    payment.transactionId = transactionId;
    payment.paymentDate = new Date();
    await this.paymentRepository.save(payment);

    // Lấy plan và cập nhật subscription
    const plan = await this.planRepository.findOne({ where: { id: payment.planId } });
    if (!plan) {
      throw new NotFoundException("Subscription plan not found");
    }

    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + plan.durationDay);

    const existingSub = await this.subscriptionRepository.findOne({
      where: { userId: payment.userId },
    });

    if (existingSub) {
      existingSub.plan = SubscriptionPlanType.PREMIUM;
      existingSub.startTime = now;
      existingSub.endTime = end;
      existingSub.status = SubscriptionStatus.ACTIVE;
      await this.subscriptionRepository.save(existingSub);
    } else {
      const subscription = this.subscriptionRepository.create({
        userId: payment.userId,
        plan: SubscriptionPlanType.PREMIUM,
        startTime: now,
        endTime: end,
        status: SubscriptionStatus.ACTIVE,
      });
      await this.subscriptionRepository.save(subscription);
    }

    return payment;
  }

  async findByUser(userId: number): Promise<any[]> {
    const payments = await this.paymentRepository.find({
      where: { userId },
      order: { paymentDate: "DESC" },
    });

    // Load thông tin plan cho mỗi payment
    const paymentsWithPlan = await Promise.all(
      payments.map(async (payment) => {
        const plan = await this.planRepository.findOne({ where: { id: payment.planId } });
        return {
          ...payment,
          plan: plan ? {
            id: plan.id,
            planName: plan.planName,
            price: plan.price,
            durationDay: plan.durationDay,
            description: plan.description,
          } : null,
        };
      })
    );

    return paymentsWithPlan;
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

