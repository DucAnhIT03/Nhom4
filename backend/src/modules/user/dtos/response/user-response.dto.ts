import { User, UserStatus } from "../../../../shared/schemas/user.schema";

export class UserResponseDto {
  id!: number;
  firstName!: string;
  lastName!: string;
  email!: string;
  status!: UserStatus;
  profileImage?: string;
  bio?: string;
  createdAt!: Date;
  updatedAt!: Date;
  roles?: Array<{ roleName: string }>;

  static fromEntity(user: User, roles?: Array<{ roleName: string }>): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.email = user.email;
    dto.status = user.status;
    dto.profileImage = user.profileImage;
    dto.bio = user.bio;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    if (roles) {
      dto.roles = roles;
    }
    return dto;
  }
}

