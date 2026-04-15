import {
  IsMongoId,
  IsInt,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
export class CreateBudgetDto {
  @IsMongoId({ message: 'categoryId không hợp lệ' })
  categoryId: string;

  @IsInt({ message: 'limitAmount phải là số nguyên (VND)' })
  @Min(1, { message: 'Giới hạn phải lớn hơn 0' })
  @Type(() => Number)
  limitAmount: number;

  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month: number;

  @IsInt()
  @Min(2024)
  @Type(() => Number)
  year: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsNumber({}, { each: true })
  alertThresholds?: number[]; // mặc định [80, 100]
}
