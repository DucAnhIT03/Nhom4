import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User, UserStatus } from "../../shared/schemas/user.schema";
import { UserRole } from "../../shared/schemas/user-role.schema";
import { Role, RoleName } from "../../shared/schemas/role.schema";
import { CreateUserDto } from "./dtos/request/create-user.dto";
import { UpdateUserDto } from "./dtos/request/update-user.dto";
import { QueryUserDto } from "./dtos/request/query-user.dto";
import { UpdateUserStatusDto } from "./dtos/request/update-user-status.dto";
import { ChangePasswordDto } from "./dtos/request/change-password.dto";
import { UpdateUserRolesDto } from "./dtos/request/update-user-roles.dto";
import { UserResponseDto } from "./dtos/response/user-response.dto";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  async findAll(query: QueryUserDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.firstName = Like(`%${search}%`);
      where.lastName = Like(`%${search}%`);
      where.email = Like(`%${search}%`);
    }

    const [users, total] = await this.userRepository.findAndCount({
      where: search
        ? [
            { firstName: Like(`%${search}%`) },
            { lastName: Like(`%${search}%`) },
            { email: Like(`%${search}%`) },
          ]
        : undefined,
      skip,
      take: limit,
      order: { createdAt: "DESC" },
    });

    // Lấy roles cho mỗi user
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const userRoles = await this.userRoleRepository.find({
          where: { userId: user.id },
        });

        const roles = await Promise.all(
          userRoles.map(async (ur) => {
            const role = await this.roleRepository.findOne({
              where: { id: ur.roleId },
            });
            return role ? { roleName: role.roleName } : null;
          }),
        );

        return UserResponseDto.fromEntity(
          user,
          roles.filter((r) => r !== null) as Array<{ roleName: string }>,
        );
      }),
    );

    return {
      data: usersWithRoles,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const userRoles = await this.userRoleRepository.find({
      where: { userId: user.id },
    });

    const roles = await Promise.all(
      userRoles.map(async (ur) => {
        const role = await this.roleRepository.findOne({
          where: { id: ur.roleId },
        });
        return role ? { roleName: role.roleName } : null;
      }),
    );

    return UserResponseDto.fromEntity(
      user,
      roles.filter((r) => r !== null) as Array<{ roleName: string }>,
    );
  }

  async create(createUserDto: CreateUserDto) {
    const email = createUserDto.email.toLowerCase();
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException("Email already exists");
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      email,
      password: passwordHash,
      status: UserStatus.VERIFY,
    });

    const savedUser = await this.userRepository.save(user);

    // Gán quyền ROLE_USER mặc định
    const userRole = await this.roleRepository.findOne({
      where: { roleName: RoleName.USER },
    });

    if (userRole) {
      const link = this.userRoleRepository.create({
        userId: savedUser.id,
        roleId: userRole.id,
      });
      await this.userRoleRepository.save(link);
    }

    return this.findOne(savedUser.id);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (updateUserDto.email) {
      const email = updateUserDto.email.toLowerCase();
      const existing = await this.userRepository.findOne({ where: { email } });
      if (existing && existing.id !== id) {
        throw new ConflictException("Email already exists");
      }
      updateUserDto.email = email;
    }

    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    return this.findOne(id);
  }

  async updateStatus(id: number, updateStatusDto: UpdateUserStatusDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    user.status = updateStatusDto.status;
    await this.userRepository.save(user);

    return this.findOne(id);
  }

  async changePassword(id: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Kiểm tra mật khẩu hiện tại
    let isValid = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$")) {
      isValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    } else {
      isValid = changePasswordDto.currentPassword === user.password;
    }

    if (!isValid) {
      throw new ConflictException("Mật khẩu hiện tại không đúng");
    }

    // Hash mật khẩu mới
    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.password = newPasswordHash;
    await this.userRepository.save(user);

    return { message: "Đổi mật khẩu thành công" };
  }

  async remove(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Xóa user roles trước
    await this.userRoleRepository.delete({ userId: id });

    await this.userRepository.remove(user);
    return { message: "User deleted successfully" };
  }

  async updateUserRoles(userId: number, updateRolesDto: UpdateUserRolesDto, currentAdminId: number) {
    // Kiểm tra admin không thể gán quyền cho chính mình
    if (userId === currentAdminId) {
      throw new ForbiddenException("Bạn không thể gán quyền cho chính mình");
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Validate các roles tồn tại
    const roles = await Promise.all(
      updateRolesDto.roles.map(async (roleName) => {
        const role = await this.roleRepository.findOne({
          where: { roleName },
        });
        if (!role) {
          throw new BadRequestException(`Role ${roleName} không tồn tại trong hệ thống`);
        }
        return role;
      }),
    );

    // Xóa tất cả roles hiện tại của user
    await this.userRoleRepository.delete({ userId });

    // Gán các roles mới
    const userRoles = roles.map((role) =>
      this.userRoleRepository.create({
        userId,
        roleId: role.id,
      }),
    );

    await this.userRoleRepository.save(userRoles);

    return this.findOne(userId);
  }

  async getAllRoles() {
    const roles = await this.roleRepository.find({
      order: { id: "ASC" },
    });
    return roles.map((role) => ({
      id: role.id,
      roleName: role.roleName,
      displayName: role.roleName.replace("ROLE_", ""),
    }));
  }
}

