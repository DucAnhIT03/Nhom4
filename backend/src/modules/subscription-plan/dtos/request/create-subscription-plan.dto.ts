import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Min } from "class-validator";

export class CreateSubscriptionPlanDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  planName!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsInt()
  @Min(1)
  durationDay!: number;

  @IsOptional()
  @IsString()
  description?: string;
}


