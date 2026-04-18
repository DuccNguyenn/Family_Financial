import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Expenses, ExpensesSchema } from './schema/expense.schema';
import { User, UserSchema } from '@/Module/users/schema/user.shcema';
import { Space, SpaceSchema } from '@/Module/space/schema/space.schema';
import {
  Categoris,
  CategorisSchema,
} from '@/Module/categoris/schema/categoris.schema';
import { Budget, BudgetSchema } from '@/Module/budget/schema/budget.schema';
import { NotificationModule } from '@/Module/notification/notification.module';

@Module({
  imports: [
    NotificationModule,
    MongooseModule.forFeature([
      { name: Expenses.name, schema: ExpensesSchema },
      { name: Categoris.name, schema: CategorisSchema },
      { name: Space.name, schema: SpaceSchema },
      { name: User.name, schema: UserSchema },
      { name: Budget.name, schema: BudgetSchema },
    ]),
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
