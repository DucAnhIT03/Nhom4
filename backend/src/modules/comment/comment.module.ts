import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Comment } from "../../shared/schemas/comment.schema";
import { User } from "../../shared/schemas/user.schema";
import { Song } from "../../shared/schemas/song.schema";
import { Artist } from "../../shared/schemas/artist.schema";
import { Role } from "../../shared/schemas/role.schema";
import { UserRole } from "../../shared/schemas/user-role.schema";
import { CommentService } from "./services/comment.service";
import { CommentController } from "./controllers/comment.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, User, Song, Artist, Role, UserRole]),
    AuthModule,
  ],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}


