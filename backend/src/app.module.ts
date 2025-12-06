import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { MailModule } from "./modules/mail/mail.module";
import { QueueModule } from "./modules/queue/queue.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AlbumModule } from "./modules/album/album.module";
import { PlaylistModule } from "./modules/playlist/playlist.module";
import { UploadModule } from "./modules/upload/upload.module";
import { SubscriptionModule } from "./modules/subscription/subscription.module";
import { SongModule } from "./modules/song/song.module";
import { UserLibraryModule } from "./modules/user-library/user-library.module";
import { GenreModule } from "./modules/genre/genre.module";
import { SubscriptionPlanModule } from "./modules/subscription-plan/subscription-plan.module";
import { CommentModule } from "./modules/comment/comment.module";
import { PaymentModule } from "./modules/payment/payment.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { UserModule } from "./modules/user/user.module";
import { ArtistModule } from "./modules/artist/artist.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    TypeOrmModule.forRoot({
      type: "mysql",
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_DATABASE || "music_app",
      autoLoadEntities: true,
      synchronize: false,
    }),
    AuthModule,
    MailModule,
    QueueModule,
    AlbumModule,
    PlaylistModule,
    UploadModule,
    SubscriptionModule,
    SongModule,
    UserLibraryModule,
    GenreModule,
    SubscriptionPlanModule,
    CommentModule,
    PaymentModule,
    DashboardModule,
    UserModule,
    ArtistModule,
  ],
})
export class AppModule {}

