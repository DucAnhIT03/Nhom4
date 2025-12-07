import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Artist } from "../../shared/schemas/artist.schema";
import { User } from "../../shared/schemas/user.schema";
import { Album } from "../../shared/schemas/album.schema";
import { Song } from "../../shared/schemas/song.schema";
import { SongGenre } from "../../shared/schemas/song-genre.schema";
import { ArtistService } from "./artist.service";
import { ArtistMyContentService } from "./services/artist-my-content.service";
import { ArtistController } from "./controllers/artist.controller";
import { ArtistMyContentController } from "./controllers/artist-my-content.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Artist, User, Album, Song, SongGenre]),
    AuthModule,
  ],
  controllers: [ArtistController, ArtistMyContentController],
  providers: [ArtistService, ArtistMyContentService],
  exports: [ArtistService, ArtistMyContentService],
})
export class ArtistModule {}

