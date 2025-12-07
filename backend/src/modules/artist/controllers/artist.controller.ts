import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ArtistService } from "../artist.service";
import { CreateArtistDto } from "../dtos/request/create-artist.dto";
import { UpdateArtistDto } from "../dtos/request/update-artist.dto";
import { QueryArtistDto } from "../dtos/request/query-artist.dto";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { RoleName } from "../../../shared/schemas/role.schema";

@ApiTags("Quản lý nghệ sĩ")
@Controller("artists")
@UseGuards(AuthGuard)
@ApiBearerAuth("access-token")
export class ArtistController {
  constructor(private readonly artistService: ArtistService) {}

  @ApiOperation({ summary: "Lấy danh sách nghệ sĩ" })
  @Get()
  async findAll(@Query() query: QueryArtistDto) {
    return this.artistService.findAll(query);
  }

  @ApiOperation({ summary: "Lấy thông tin nghệ sĩ theo ID" })
  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.artistService.findOne(id);
  }

  @ApiOperation({ summary: "Tạo nghệ sĩ mới" })
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN)
  async create(@Body() createArtistDto: CreateArtistDto) {
    return this.artistService.create(createArtistDto);
  }

  @ApiOperation({ summary: "Cập nhật thông tin nghệ sĩ" })
  @Put(":id")
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.ARTIST)
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateArtistDto: UpdateArtistDto,
  ) {
    return this.artistService.update(id, updateArtistDto);
  }

  @ApiOperation({ summary: "Xóa nghệ sĩ" })
  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN)
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.artistService.remove(id);
  }
}

