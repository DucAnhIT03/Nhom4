import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Song } from "../../shared/schemas/song.schema";
import { SongHistory } from "../../shared/schemas/song-history.schema";
import { SongService } from "./services/song.service";
import { SongController } from "./controllers/song.controller";
import { AlbumModule } from "../album/album.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Song, SongHistory]),
    forwardRef(() => AlbumModule),
  ],
  controllers: [SongController],
  providers: [SongService],
  exports: [SongService],
})
export class SongModule {}


