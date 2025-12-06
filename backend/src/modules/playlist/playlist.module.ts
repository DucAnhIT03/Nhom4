import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Playlist } from "../../shared/schemas/playlist.schema";
import { PlaylistSong } from "../../shared/schemas/playlist-song.schema";
import { Song } from "../../shared/schemas/song.schema";
import { Download } from "../../shared/schemas/download.schema";
import { PlaylistService } from "./services/playlist.service";
import { PlaylistController } from "./controllers/playlist.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Playlist, PlaylistSong, Song, Download])],
  controllers: [PlaylistController],
  providers: [PlaylistService],
  exports: [PlaylistService],
})
export class PlaylistModule {}


