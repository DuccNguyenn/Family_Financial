import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { GetUser } from '@/decorator/get-user.decorator';
import { GetBudgetDto } from '@/Module/budget/dto/get-budget.dto';
import { UpdateBudgetDto } from '@/Module/budget/dto/update-budget.dto';

@Controller('budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  create(
    @Body() dto: CreateBudgetDto,
    @GetUser('spaceId') spaceId: string,
    @GetUser('role') role: string,
  ) {
    return this.budgetService.createBudget(dto, spaceId, role);
  }
  // GET /budgets?month=10&year=2025
  // Parent: thấy số tiền đầy đủ + summary
  // Member: chỉ thấy % + status
  @Get()
  findAll(
    @Query() query: GetBudgetDto,
    @GetUser('spaceId') spaceId: string,
    @GetUser('role') role: string,
  ) {
    return this.budgetService.getBudgets(query, spaceId, role);
  }

  // GET /budgets/:id — chi tiết 1 budget
  // Parent: thấy thêm recentExpenses
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser('spaceId') spaceId: string,
    @GetUser('role') role: string,
  ) {
    return this.budgetService.getBudget(id, spaceId, role);
  }

  // PATCH /budgets/:id — sửa limitAmount hoặc alertThresholds (chỉ parent)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
    @GetUser('spaceId') spaceId: string,
    @GetUser('role') role: string,
  ) {
    return this.budgetService.updateBudget(id, dto, spaceId, role);
  }

  // DELETE /budgets/:id — chỉ parent
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetUser('spaceId') spaceId: string,
    @GetUser('role') role: string,
  ) {
    return this.budgetService.deleteBudget(id, spaceId, role);
  }
}
