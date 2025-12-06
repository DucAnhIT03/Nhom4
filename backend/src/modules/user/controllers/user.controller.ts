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
import { UserService } from "../user.service";
import { CreateUserDto } from "../dtos/request/create-user.dto";
import { UpdateUserDto } from "../dtos/request/update-user.dto";
import { QueryUserDto } from "../dtos/request/query-user.dto";
import { UpdateUserStatusDto } from "../dtos/request/update-user-status.dto";
import { ChangePasswordDto } from "../dtos/request/change-password.dto";
import { AuthGuard } from "../../../common/guards/auth.guard";

@ApiTags("Quản lý người dùng")
@Controller("users")
@UseGuards(AuthGuard)
@ApiBearerAuth("access-token")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: "Lấy danh sách người dùng" })
  @Get()
  async findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  @ApiOperation({ summary: "Lấy thông tin người dùng theo ID" })
  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @ApiOperation({ summary: "Tạo người dùng mới" })
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @ApiOperation({ summary: "Cập nhật thông tin người dùng" })
  @Put(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @ApiOperation({ summary: "Cập nhật trạng thái người dùng (block/unblock)" })
  @Put(":id/status")
  async updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateUserStatusDto,
  ) {
    return this.userService.updateStatus(id, updateStatusDto);
  }

  @ApiOperation({ summary: "Đổi mật khẩu người dùng" })
  @Put(":id/change-password")
  async changePassword(
    @Param("id", ParseIntPipe) id: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(id, changePasswordDto);
  }

  @ApiOperation({ summary: "Xóa người dùng" })
  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}

