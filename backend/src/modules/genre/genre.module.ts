import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Genre } from "../../shared/schemas/genre.schema";
import { SongGenre } from "../../shared/schemas/song-genre.schema";
import { Song } from "../../shared/schemas/song.schema";
import { GenreService } from "./services/genre.service";
import { GenreController } from "./controllers/genre.controller";
import { AlbumModule } from "../album/album.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Genre, SongGenre, Song]),
    forwardRef(() => AlbumModule),
  ],
  controllers: [GenreController],
  providers: [GenreService],
  exports: [GenreService],
})
export class GenreModule {}


