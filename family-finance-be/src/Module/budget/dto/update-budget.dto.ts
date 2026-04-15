import { PartialType } from '@nestjs/mapped-types';
import { CreateBudgetDto } from './create-budget.dto';
import { IsArray, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBudgetDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limitAmount?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  alertThresholds?: number[];
}
