import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Incomes, IncomesSchema } from '@/Module/incomes/schema/income.schema';
import {
  Expenses,
  ExpensesSchema,
} from '@/Module/expenses/schema/expense.schema';
import { Budget, BudgetSchema } from '@/Module/budget/schema/budget.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Incomes.name, schema: IncomesSchema },
      { name: Expenses.name, schema: ExpensesSchema },
      { name: Budget.name, schema: BudgetSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
