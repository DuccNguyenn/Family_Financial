import { Module } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Budget, BudgetSchema } from './schema/budget.schema';
import {
  Categoris,
  CategorisSchema,
} from '@/Module/categoris/schema/categoris.schema';
import { Space, SpaceSchema } from '@/Module/space/schema/space.schema';
import {
  Expenses,
  ExpensesSchema,
} from '@/Module/expenses/schema/expense.schema';
import { User, UserSchema } from '@/Module/users/schema/user.shcema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Budget.name, schema: BudgetSchema },
      { name: Categoris.name, schema: CategorisSchema },
      { name: Space.name, schema: SpaceSchema },
      { name: Expenses.name, schema: ExpensesSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [BudgetController],
  providers: [BudgetService],
  exports: [BudgetService],
})
export class BudgetModule {}
