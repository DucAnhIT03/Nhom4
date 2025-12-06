import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Album } from "../../shared/schemas/album.schema";
import { Song } from "../../shared/schemas/song.schema";
import { AlbumService } from "./services/album.service";
import { AlbumController } from "./controllers/album.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Album, Song])],
  controllers: [AlbumController],
  providers: [AlbumService],
  exports: [AlbumService],
})
export class AlbumModule {}

