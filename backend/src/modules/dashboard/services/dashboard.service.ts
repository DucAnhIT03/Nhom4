import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, FindOptionsWhere, Repository } from "typeorm";
import { User, UserStatus } from "../../../shared/schemas/user.schema";
import {
  Subscription,
  SubscriptionPlanType,
  SubscriptionStatus,
} from "../../../shared/schemas/subscription.schema";
import { AdminDashboardStatsDto } from "../dtos/response/admin-dashboard-stats.dto";

export interface DashboardFilter {
  from?: Date;
  to?: Date;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async getAdminOverview(filter: DashboardFilter): Promise<AdminDashboardStatsDto> {
    const userWhere: FindOptionsWhere<User> = {};
    const subWhere: FindOptionsWhere<Subscription> = {};

    if (filter.from || filter.to) {
      const from = filter.from ?? new Date(0);
      const to = filter.to ?? new Date();
      userWhere.createdAt = Between(from, to);
      subWhere.createdAt = Between(from, to);
    }

    const [totalUsers, usersByStatusRaw, totalSubscriptions, subsByPlanRaw, subsByStatusRaw] =
      await Promise.all([
        this.userRepository.count({ where: userWhere }),
        this.userRepository
          .createQueryBuilder("u")
          .select("u.status", "status")
          .addSelect("COUNT(*)", "count")
          .where(userWhere)
          .groupBy("u.status")
          .getRawMany<{ status: UserStatus; count: string }>(),
        this.subscriptionRepository.count({ where: subWhere }),
        this.subscriptionRepository
          .createQueryBuilder("s")
          .select("s.plan", "plan")
          .addSelect("COUNT(*)", "count")
          .where(subWhere)
          .groupBy("s.plan")
          .getRawMany<{ plan: SubscriptionPlanType; count: string }>(),
        this.subscriptionRepository
          .createQueryBuilder("s")
          .select("s.status", "status")
          .addSelect("COUNT(*)", "count")
          .where(subWhere)
          .groupBy("s.status")
          .getRawMany<{ status: SubscriptionStatus; count: string }>(),
      ]);

    const usersByStatus: Record<UserStatus, number> = {} as Record<UserStatus, number>;
    for (const status of Object.values(UserStatus) as UserStatus[]) {
      usersByStatus[status] = 0;
    }
    for (const row of usersByStatusRaw) {
      usersByStatus[row.status] = Number(row.count);
    }

    const subscriptionsByPlan: Record<SubscriptionPlanType, number> =
      {} as Record<SubscriptionPlanType, number>;
    for (const plan of Object.values(SubscriptionPlanType) as SubscriptionPlanType[]) {
      subscriptionsByPlan[plan] = 0;
    }
    for (const row of subsByPlanRaw) {
      subscriptionsByPlan[row.plan] = Number(row.count);
    }

    const subscriptionsByStatus: Record<SubscriptionStatus, number> =
      {} as Record<SubscriptionStatus, number>;
    for (const status of Object.values(SubscriptionStatus) as SubscriptionStatus[]) {
      subscriptionsByStatus[status] = 0;
    }
    for (const row of subsByStatusRaw) {
      subscriptionsByStatus[row.status] = Number(row.count);
    }

    const dto = new AdminDashboardStatsDto();
    dto.totalUsers = totalUsers;
    dto.usersByStatus = usersByStatus;
    dto.totalSubscriptions = totalSubscriptions;
    dto.subscriptionsByPlan = subscriptionsByPlan;
    dto.subscriptionsByStatus = subscriptionsByStatus;

    return dto;
  }
}

