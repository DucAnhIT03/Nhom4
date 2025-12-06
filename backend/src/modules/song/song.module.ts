import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Song } from "../../shared/schemas/song.schema";
import { SongHistory } from "../../shared/schemas/song-history.schema";
import { SongService } from "./services/song.service";
import { SongController } from "./controllers/song.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Song, SongHistory])],
  controllers: [SongController],
  providers: [SongService],
  exports: [SongService],
})
export class SongModule {}


