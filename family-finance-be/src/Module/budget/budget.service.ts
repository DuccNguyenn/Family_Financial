import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Budget, BudgetDocument } from '@/Module/budget/schema/budget.schema';
import {
  Expenses,
  ExpensesDocument,
} from '@/Module/expenses/schema/expense.schema';
import { Model, Types } from 'mongoose';
import { GetBudgetDto } from '@/Module/budget/dto/get-budget.dto';

type BudgetStatus = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCEEDED';

@Injectable()
export class BudgetService {
  constructor(
    @InjectModel(Budget.name) private budgetModel: Model<BudgetDocument>,
    @InjectModel(Expenses.name) private expenseModel: Model<ExpensesDocument>,
  ) {}
  // Thiết lập vượt cảnh báo budget
  private getStatus(percentage: number): BudgetStatus {
    if (percentage >= 100) return 'EXCEEDED';
    if (percentage >= 80) return 'HIGH';
    if (percentage >= 60) return 'MEDIUM';
    return 'LOW';
  }
  // Tính toán tổng chi tiêu theo danh mục
  private async calcSpentAmount(
    spaceId: string,
    categoryId: Types.ObjectId | any,
    month: number,
    year: number,
  ): Promise<number> {
    // Sau .populate().lean(), categoryId có thể là object { _id, name, ... }
    const categoryObjId = new Types.ObjectId(
      (categoryId as any)?._id ?? categoryId,
    );
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const result = await this.expenseModel.aggregate([
      {
        $match: {
          spaceID: new Types.ObjectId(spaceId),
          categoryID: categoryObjId,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return result[0]?.total ?? 0;
  }

  //Cho phép hiển thị ngân sách khác nhau theo từng role
  private formatBudget(budget: any, spentAmount: number, role: string) {
    const percentage =
      budget.limitAmount > 0
        ? Math.round((spentAmount / budget.limitAmount) * 100)
        : 0;
    const status = this.getStatus(percentage);
    const remaining = Math.max(budget.limitAmount - spentAmount, 0);

    if (role === 'member') {
      // Member chỉ thấy % ngân sách
      return {
        _id: budget._id,
        categoryId: budget.categoryId,
        month: budget.month,
        year: budget.year,
        percentage,
        status,
      };
    }

    // Parent thấy đầy đủ
    return {
      _id: budget._id,
      categoryId: budget.categoryId,
      month: budget.month,
      year: budget.year,
      limitAmount: budget.limitAmount,
      spentAmount,
      remaining,
      percentage,
      status,
      alertThresholds: budget.alertThresholds,
    };
  }

  async createBudget(dto: CreateBudgetDto, spaceId: string, role: string) {
    if (role !== 'parent') {
      throw new ForbiddenException('Chỉ quản lý mới được tạo ngân sách');
    }

    // Kiểm tra đã có budget cho category này trong tháng chưa
    const exists = await this.budgetModel.findOne({
      spaceId: new Types.ObjectId(spaceId),
      categoryId: new Types.ObjectId(dto.categoryId),
      month: dto.month,
      year: dto.year,
    });

    if (exists) {
      throw new BadRequestException(
        'Đã có ngân sách cho danh mục này trong tháng. Hãy sửa thay vì tạo mới.',
      );
    }

    const budget = await this.budgetModel.create({
      spaceId: new Types.ObjectId(spaceId),
      categoryId: new Types.ObjectId(dto.categoryId),
      limitAmount: dto.limitAmount,
      month: dto.month,
      year: dto.year,
      alertThresholds: dto.alertThresholds ?? [80, 100],
    });

    // Tính spentAmount ngay sau khi tạo
    const spentAmount = await this.calcSpentAmount(
      spaceId,
      budget.categoryId,
      budget.month,
      budget.year,
    );

    const populated = await budget.populate(
      'categoryId',
      'name icon color type',
    );
    return this.formatBudget(populated.toObject(), spentAmount, role);
  }
  // DANH SÁCH BUDGET THEO THÁNG
  // Parent: thấy số tiền đầy đủ
  // Member: chỉ thấy % và status
  async getBudgets(query: GetBudgetDto, spaceId: string, role: string) {
    const now = new Date();
    const month = query.month ?? now.getMonth() + 1;
    const year = query.year ?? now.getFullYear();

    const budgets = await this.budgetModel
      .find({
        spaceId: new Types.ObjectId(spaceId),
        month,
        year,
      })
      .populate('categoryId', 'name icon color type')
      .lean();

    // Tính spentAmount song song cho tất cả budget
    const results = await Promise.all(
      budgets.map(async (budget) => {
        const spentAmount = await this.calcSpentAmount(
          spaceId,
          budget.categoryId,
          budget.month,
          budget.year,
        );
        return this.formatBudget(budget, spentAmount, role);
      }),
    );

    // Tổng hợp cho parent
    if (role === 'parent') {
      const totalLimit = results.reduce(
        (s, b: any) => s + (b.limitAmount ?? 0),
        0,
      );
      const totalSpent = results.reduce(
        (s, b: any) => s + (b.spentAmount ?? 0),
        0,
      );

      return {
        month,
        year,
        budgets: results,
        summary: {
          totalLimit,
          totalSpent,
          totalRemaining: Math.max(totalLimit - totalSpent, 0),
          percentage:
            totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0,
        },
      };
    }

    // Member chỉ thấy danh sách status
    return { month, year, budgets: results };
  }

  //Lấy chi tiết budget
  async getBudget(id: string, spaceId: string, role: string) {
    const budget = await this.budgetModel
      .findOne({ _id: id, spaceId: new Types.ObjectId(spaceId) })
      .populate('categoryId', 'name icon color type')
      .lean();

    if (!budget) throw new NotFoundException('Không tìm thấy ngân sách');

    const spentAmount = await this.calcSpentAmount(
      spaceId,
      budget.categoryId,
      budget.month,
      budget.year,
    );

    // Lấy thêm chi tiết các expense của category này trong tháng (chỉ parent)
    if (role === 'parent') {
      const startDate = new Date(budget.year, budget.month - 1, 1);
      const endDate = new Date(budget.year, budget.month, 0, 23, 59, 59);

      const categoryObjId = new Types.ObjectId(
        (budget.categoryId as any)?._id ?? budget.categoryId,
      );
      const recentExpenses = await this.expenseModel
        .find({
          spaceID: new Types.ObjectId(spaceId),
          categoryID: categoryObjId,
          date: { $gte: startDate, $lte: endDate },
        })
        .populate('userID', 'name avatar')
        .sort({ date: -1 })
        .limit(10)
        .lean();

      return {
        ...this.formatBudget(budget, spentAmount, role),
        recentExpenses,
      };
    }

    return this.formatBudget(budget, spentAmount, role);
  }

  //Cập nhật ngân sách
  async updateBudget(
    id: string,
    dto: UpdateBudgetDto,
    spaceId: string,
    role: string,
  ) {
    if (role !== 'parent') {
      throw new ForbiddenException('Chỉ quản lý mới được sửa ngân sách');
    }

    const budget = await this.budgetModel.findOne({
      _id: id,
      spaceId: new Types.ObjectId(spaceId),
    });

    if (!budget) throw new NotFoundException('Không tìm thấy ngân sách');

    await this.budgetModel.findByIdAndUpdate(id, dto);

    const updated = await this.budgetModel
      .findById(id)
      .populate('categoryId', 'name icon color type')
      .lean();

    const spentAmount = await this.calcSpentAmount(
      spaceId,
      updated!.categoryId,
      updated!.month,
      updated!.year,
    );

    return this.formatBudget(updated!, spentAmount, role);
  }

  //Xóa ngân sách
  async deleteBudget(id: string, spaceId: string, role: string) {
    if (role !== 'parent') {
      throw new ForbiddenException('Chỉ quản lý mới được xóa ngân sách');
    }

    const budget = await this.budgetModel.findOne({
      _id: id,
      spaceId: new Types.ObjectId(spaceId),
    });

    if (!budget) throw new NotFoundException('Không tìm thấy ngân sách');

    await this.budgetModel.findByIdAndDelete(id);
    return { message: 'Đã xóa ngân sách' };
  }

  //Kiểm tra cảnh báo ngân sách
  async checkAlerts(
    spaceId: string,
    categoryId: string,
    month: number,
    year: number,
  ) {
    const budget = await this.budgetModel
      .findOne({
        spaceId: new Types.ObjectId(spaceId),
        categoryId: new Types.ObjectId(categoryId),
        month,
        year,
      })
      .populate('categoryId', 'name icon color');

    if (!budget) return null; // Không có budget → không cần cảnh báo

    const spentAmount = await this.calcSpentAmount(
      spaceId,
      budget.categoryId,
      month,
      year,
    );

    const percentage = Math.round((spentAmount / budget.limitAmount) * 100);
    const status = this.getStatus(percentage);

    // Chỉ cảnh báo khi đạt ngưỡng
    const isAlerted = budget.alertThresholds.some(
      (threshold) => percentage >= threshold,
    );

    if (!isAlerted) return null;

    return {
      categoryId: budget.categoryId,
      limitAmount: budget.limitAmount,
      spentAmount,
      percentage,
      status,
    };
  }
}
