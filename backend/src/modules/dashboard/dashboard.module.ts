import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DashboardController } from "./controllers/dashboard.controller";
import { DashboardService } from "./services/dashboard.service";
import { User } from "../../shared/schemas/user.schema";
import { Subscription } from "../../shared/schemas/subscription.schema";
import { Song } from "../../shared/schemas/song.schema";
import { Album } from "../../shared/schemas/album.schema";
import { Artist } from "../../shared/schemas/artist.schema";
import { Comment } from "../../shared/schemas/comment.schema";
import { Genre } from "../../shared/schemas/genre.schema";
import { Wishlist } from "../../shared/schemas/wishlist.schema";
import { SongHistory } from "../../shared/schemas/song-history.schema";
import { SubscriptionPlan } from "../../shared/schemas/subscription-plan.schema";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Subscription,
      Song,
      Album,
      Artist,
      Comment,
      Genre,
      Wishlist,
      SongHistory,
      SubscriptionPlan,
    ]),
    AuthModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}


