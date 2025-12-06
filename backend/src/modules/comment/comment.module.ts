import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Comment } from "../../shared/schemas/comment.schema";
import { CommentService } from "./services/comment.service";
import { CommentController } from "./controllers/comment.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Comment])],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}


