import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { BannerService } from "../services/banner.service";
import { CreateBannerDto } from "../dtos/request/create-banner.dto";
import { UpdateBannerDto } from "../dtos/request/update-banner.dto";

@ApiTags("Banner")
@Controller("banners")
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @ApiOperation({ summary: "Lấy danh sách tất cả banner" })
  @Get()
  findAll() {
    return this.bannerService.findAll();
  }

  @ApiOperation({ summary: "Lấy danh sách banner đang hoạt động" })
  @Get("active")
  findActive() {
    return this.bannerService.findActive();
  }

  @ApiOperation({ summary: "Lấy chi tiết một banner theo ID" })
  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.bannerService.findOne(id);
  }

  @ApiOperation({ summary: "Tạo mới một banner" })
  @Post()
  create(@Body() dto: CreateBannerDto) {
    return this.bannerService.create(dto);
  }

  @ApiOperation({ summary: "Cập nhật thông tin banner" })
  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateBannerDto) {
    return this.bannerService.update(id, dto);
  }

  @ApiOperation({ summary: "Xóa một banner" })
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.bannerService.remove(id);
  }
}

