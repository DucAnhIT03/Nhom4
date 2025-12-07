import { IsArray, IsEnum, ArrayNotEmpty } from "class-validator";
import { RoleName } from "../../../../shared/schemas/role.schema";

export class UpdateUserRolesDto {
  @IsArray()
  @ArrayNotEmpty({ message: "Danh sách quyền không được để trống" })
  @IsEnum(RoleName, { each: true, message: "Mỗi quyền phải là một trong các giá trị: ROLE_USER, ROLE_ADMIN, ROLE_ARTIST" })
  roles!: RoleName[];
}


