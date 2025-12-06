import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Wishlist } from "../../shared/schemas/wishlist.schema";
import { SongHistory } from "../../shared/schemas/song-history.schema";
import { Song } from "../../shared/schemas/song.schema";
import { UserLibraryService } from "./services/user-library.service";
import { UserLibraryController } from "./controllers/user-library.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Wishlist, SongHistory, Song])],
  controllers: [UserLibraryController],
  providers: [UserLibraryService],
  exports: [UserLibraryService],
})
export class UserLibraryModule {}


