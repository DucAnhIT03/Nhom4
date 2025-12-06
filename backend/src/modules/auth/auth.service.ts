import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { RegisterDto } from "./dtos/register.dto";
import { LoginDto } from "./dtos/login.dto";
import { VerifyOtpDto } from "./dtos/verify-otp.dto";
import { MailService } from "../mail/services/mail.service";
import { SendMailDto } from "../mail/dtos/request/send-mail.dto";
import { User, UserStatus } from "../../shared/schemas/user.schema";
import { Role, RoleName } from "../../shared/schemas/role.schema";
import { UserRole } from "../../shared/schemas/user-role.schema";
import { Otp } from "../../shared/schemas/otp.schema";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<Omit<User, "password">> {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException("Email đã được đăng ký. Vui lòng sử dụng email khác.");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email,
      password: passwordHash,
      status: UserStatus.VERIFY,
    });

    await this.userRepository.save(user);

    // Gán quyền ROLE_USER mặc định cho user mới
    const userRole = await this.roleRepository.findOne({
      where: { roleName: RoleName.USER },
    });

    if (userRole) {
      const link = this.userRoleRepository.create({
        userId: user.id,
        roleId: userRole.id,
      });
      await this.userRoleRepository.save(link);
    }

    // Sinh mã OTP 6 chữ số cho việc xác thực email
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Lưu OTP vào database (có hiệu lực 10 phút)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    const otp = this.otpRepository.create({
      email: user.email.toLowerCase(),
      code: otpCode,
      type: "REGISTER",
      isUsed: false,
      expiresAt,
    });
    await this.otpRepository.save(otp);

    // Gửi mail xác thực bằng tiếng Việt, kèm mã OTP
    const mailPayload: SendMailDto = {
      to: user.email,
      subject: "Xác thực tài khoản - Mã OTP",
      body: `Xin chào ${user.firstName} ${user.lastName},\n\n` +
        `Cảm ơn bạn đã đăng ký tài khoản hệ thống nghe nhạc.\n\n` +
        `Mã OTP xác thực email của bạn là: ${otpCode}\n` +
        `Mã có hiệu lực trong 10 phút, vui lòng không chia sẻ cho bất kỳ ai.\n\n` +
        `Trân trọng,\n` +
        `Đội ngũ hỗ trợ hệ thống nghe nhạc`,
    };
    this.mailService.enqueueMail(mailPayload);

    const { password: _pw, ...safeUser } = user;
    return safeUser;
  }

  private async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // Kiểm tra trạng thái tài khoản
    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
    }

    let isValid = false;

    // Nếu mật khẩu trong DB có dạng bcrypt hash
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$")) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      // Fallback: so sánh plain text (cho dữ liệu seed dev như 'Admin123')
      isValid = password === user.password;
    }

    if (!isValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return user;
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.validateUser(dto.email, dto.password);
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }

  async adminLogin(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.validateUser(dto.email, dto.password);
    
    // Kiểm tra user có role ADMIN không
    const adminRole = await this.roleRepository.findOne({
      where: { roleName: RoleName.ADMIN },
    });

    if (!adminRole) {
      throw new UnauthorizedException("Admin role not found in system.");
    }

    const userRole = await this.userRoleRepository.findOne({
      where: {
        userId: user.id,
        roleId: adminRole.id,
      },
    });

    if (!userRole) {
      throw new UnauthorizedException("Access denied. Admin role required.");
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ accessToken: string }> {
    const email = dto.email.toLowerCase();
    
    // Tìm OTP hợp lệ (chưa dùng, chưa hết hạn)
    const otp = await this.otpRepository.findOne({
      where: {
        email,
        code: dto.otp,
        type: "REGISTER",
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: "DESC" },
    });

    if (!otp) {
      throw new BadRequestException("Mã OTP không hợp lệ hoặc đã hết hạn");
    }

    // Tìm user
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException("Người dùng không tồn tại");
    }

    // Đánh dấu OTP đã sử dụng
    otp.isUsed = true;
    await this.otpRepository.save(otp);

    // Cập nhật trạng thái user thành ACTIVE
    user.status = UserStatus.ACTIVE;
    await this.userRepository.save(user);

    // Tạo access token
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }

  async getUserProfile(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Lấy roles của user
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
    });

    const roles = await Promise.all(
      userRoles.map(async (ur) => {
        const role = await this.roleRepository.findOne({
          where: { id: ur.roleId },
        });
        return role?.roleName?.replace("ROLE_", "").toLowerCase() || "user";
      }),
    );

    const primaryRole = roles[0] || "user";

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImage: user.profileImage,
      role: primaryRole,
      roles: roles,
    };
  }

  async verifyToken(token: string): Promise<{ id: number; email: string }> {
    const payload = await this.jwtService.verifyAsync<{ sub: number; email: string }>(token);
    return { id: payload.sub, email: payload.email };
  }
}


