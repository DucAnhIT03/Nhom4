import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Role, RoleName } from "../../../shared/schemas/role.schema";
import { UserRole } from "../../../shared/schemas/user-role.schema";

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  async getUserRoles(userId: number): Promise<RoleName[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
    });

    const roles = await Promise.all(
      userRoles.map(async (ur) => {
        const role = await this.roleRepository.findOne({
          where: { id: ur.roleId },
        });
        return role?.roleName;
      }),
    );

    return roles.filter((r): r is RoleName => r !== undefined);
  }
}


