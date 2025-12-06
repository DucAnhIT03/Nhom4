import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Artist } from "../../shared/schemas/artist.schema";
import { ArtistService } from "./artist.service";
import { ArtistController } from "./controllers/artist.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Artist]),
    AuthModule,
  ],
  controllers: [ArtistController],
  providers: [ArtistService],
  exports: [ArtistService],
})
export class ArtistModule {}

