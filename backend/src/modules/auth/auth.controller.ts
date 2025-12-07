import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dtos/register.dto";
import { LoginDto } from "./dtos/login.dto";
import { VerifyOtpDto } from "./dtos/verify-otp.dto";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("Xác thực & Tài khoản")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: "Đăng ký tài khoản người dùng mới" })
  @Post("register")
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: "Đăng nhập và lấy access token" })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: "Xác thực OTP sau khi đăng ký" })
  @Post("verify-otp")
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @ApiOperation({ summary: "Đăng nhập admin và lấy access token" })
  @Post("admin/login")
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() dto: LoginDto) {
    return this.authService.adminLogin(dto);
  }

  @ApiOperation({ summary: "Đăng nhập nghệ sĩ và lấy access token" })
  @Post("artist/login")
  @HttpCode(HttpStatus.OK)
  async artistLogin(@Body() dto: LoginDto) {
    return this.authService.artistLogin(dto);
  }

  @ApiOperation({ summary: "Lấy thông tin hồ sơ người dùng hiện tại" })
  @ApiBearerAuth("access-token")
  @Get("me")
  @UseGuards(AuthGuard)
  async getProfile(@CurrentUser() user: { id: number; email?: string } | null) {
    if (!user) {
      return null;
    }
    return this.authService.getUserProfile(user.id);
  }

  @ApiOperation({ summary: "Cập nhật thông tin hồ sơ người dùng hiện tại" })
  @ApiBearerAuth("access-token")
  @Put("me")
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser() user: { id: number; email?: string } | null,
    @Body() updateData: { firstName?: string; lastName?: string; email?: string; profileImage?: string; age?: number; nationality?: string },
  ) {
    if (!user) {
      throw new Error("User not authenticated");
    }
    return this.authService.updateProfile(user.id, updateData);
  }
}


