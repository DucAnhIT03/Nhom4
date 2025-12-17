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
import { UpdateUserRolesDto } from "../dtos/request/update-user-roles.dto";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RoleName } from "../../../shared/schemas/role.schema";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";

@ApiTags("Quản lý người dùng")
@Controller("users")
@UseGuards(AuthGuard, RolesGuard)
@Roles(RoleName.ADMIN)
@ApiBearerAuth("access-token")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: "Lấy danh sách người dùng" })
  @Get()
  async findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  @ApiOperation({ summary: "Lấy danh sách tất cả các quyền có trong hệ thống" })
  @Get("roles/all")
  async getAllRoles() {
    return this.userService.getAllRoles();
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
  // Ghi đè @Roles ở mức class: cho phép ADMIN, USER, ARTIST tự đổi mật khẩu
  @Roles(RoleName.ADMIN, RoleName.USER, RoleName.ARTIST)
  @Put(":id/change-password")
  async changePassword(
    @Param("id", ParseIntPipe) id: number,
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() currentUser: { id: number; roles?: RoleName[] } | null,
  ) {
    // Chỉ cho phép chính chủ hoặc admin đổi mật khẩu
    if (!currentUser) {
      throw new UnauthorizedException("User not authenticated");
    }
    const isAdmin = currentUser.roles?.includes(RoleName.ADMIN);
    if (!isAdmin && currentUser.id !== id) {
      throw new ForbiddenException("Bạn không có quyền đổi mật khẩu tài khoản này");
    }

    return this.userService.changePassword(id, changePasswordDto);
  }

  @ApiOperation({ summary: "Xóa người dùng" })
  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }

  @ApiOperation({ summary: "Cập nhật quyền cho người dùng" })
  @Put(":id/roles")
  async updateUserRoles(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateRolesDto: UpdateUserRolesDto,
    @CurrentUser() currentUser: { id: number; email: string; roles?: RoleName[] } | null,
  ) {
    if (!currentUser) {
      throw new Error("User not authenticated");
    }
    return this.userService.updateUserRoles(id, updateRolesDto, currentUser.id);
  }
}

