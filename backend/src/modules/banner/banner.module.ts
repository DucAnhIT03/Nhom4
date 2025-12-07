import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Banner } from "../../shared/schemas/banner.schema";
import { BannerService } from "./services/banner.service";
import { BannerController } from "./controllers/banner.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([Banner]),
  ],
  controllers: [BannerController],
  providers: [BannerService],
  exports: [BannerService],
})
export class BannerModule {}

