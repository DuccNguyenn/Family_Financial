import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Expenses } from './schema/expense.schema';
import { Model, Types } from 'mongoose';
import { GetExpensesDto } from '@/Module/expenses/dto/get-expense.dto';
import { Budget } from '@/Module/budget/schema/budget.schema';
import { Categoris } from '@/Module/categoris/schema/categoris.schema';
import { NotificationService } from '@/Module/notification/notification.service';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expenses.name) private readonly expensesModel: Model<Expenses>,
    @InjectModel(Budget.name) private readonly budgetModel: Model<Budget>,
    @InjectModel(Categoris.name)
    private readonly categoryModel: Model<Categoris>,
    private readonly notificationService: NotificationService,
  ) {}

  private async checkBudgetAndAlert(
    spaceID: string,
    categoryID: string,
    amount: number,
    dateInput: string | Date,
    expenseIdToIgnore?: string,
  ) {
    const date = new Date(dateInput);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // Tìm budget cho category này trong tháng
    const budget = await this.budgetModel.findOne({
      spaceId: new Types.ObjectId(spaceID),
      categoryId: new Types.ObjectId(categoryID),
      month,
      year,
    });

    if (!budget) return; // Không có budget thì không chặn

    if (budget.isAlertEnabled === false) return; // Không chặn nếu người dùng đã tắt cảnh báo

    // Tính tổng số tiền đã chi
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const matchQuery: any = {
      spaceID: new Types.ObjectId(spaceID),
      categoryID: new Types.ObjectId(categoryID),
      date: { $gte: startDate, $lte: endDate },
    };

    if (expenseIdToIgnore) {
      matchQuery._id = { $ne: new Types.ObjectId(expenseIdToIgnore) };
    }

    const currentSpentResult = await this.expensesModel.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const currentSpent = currentSpentResult[0]?.total ?? 0;
    const projectedTotal = currentSpent + amount;
    const limitAmount = budget.limitAmount;

    const percentage = (projectedTotal / limitAmount) * 100;

    // Chặn cứng > 100%
    if (percentage > 100) {
      throw new BadRequestException(
        'Giao dịch này làm vượt quá 100% ngân sách đã thiết lập.',
      );
    }

    // Cảnh báo >= threshold
    const warningThreshold = budget.alertThresholds?.[0] || 80;

    if (percentage >= warningThreshold && percentage <= 100) {
      const category = await this.categoryModel.findById(categoryID).lean();
      const catName = category ? category.name : 'Không xác định';

      this.notificationService.triggerBudgetAlert(
        spaceID,
        catName,
        percentage,
        projectedTotal,
        limitAmount,
      );
    }
  }

  // POST/expenses
  async createExpense(dto: CreateExpenseDto, userID: string, spaceID: string) {
    // Check budget limit first
    await this.checkBudgetAndAlert(
      spaceID,
      String(dto.categoryID),
      dto.amount,
      dto.date,
    );

    const expenses = await this.expensesModel.create({
      spaceID: new Types.ObjectId(spaceID),
      userID: new Types.ObjectId(userID),
      categoryID: new Types.ObjectId(dto.categoryID),
      amount: dto.amount,
      date: dto.date,
      description: dto.description,
    });
    return expenses.populate([
      { path: 'categoryID', select: 'name icon color' },
      { path: 'userID', select: 'name avatar' },
    ]);
  }

  //GET/expenses
  async getExpenses(
    dto: GetExpensesDto,
    userID: string,
    spaceID: string,
    role: string,
  ) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: any = { spaceID: new Types.ObjectId(spaceID) };

    if (role === 'member') {
      filter.userID = new Types.ObjectId(userID);
    } else if (dto.userId) {
      filter.userID = new Types.ObjectId(dto.userId);
    }

    if (dto.month || dto.year) {
      const now = new Date();
      const year = dto.year ?? now.getFullYear();
      const month = dto.month ?? now.getMonth() + 1;
      filter.date = {
        $gte: new Date(year, month - 1, 1),
        $lt: new Date(year, month, 0, 23, 59, 59),
      };
    }

    if (dto.categoryId) {
      filter.categoryID = new Types.ObjectId(dto.categoryId);
    }

    const [result, total, summary] = await Promise.all([
      this.expensesModel
        .find(filter)
        .populate('categoryID', 'name icon color')
        .populate('userID', 'name avatar')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      this.expensesModel.countDocuments(filter),

      this.expensesModel.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    return {
      result,
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
        summary: summary[0]?.total ?? 0,
      },
    };
  }

  //GET/expenses/:id
  async getExpenseById(
    id: string,
    userID: string,
    spaceID: string,
    role: string,
  ) {
    const expense = await this.expensesModel
      .findOne({
        _id: id,
        spaceID: new Types.ObjectId(spaceID),
      })
      .populate('categoryID', 'name icon color')
      .populate('userID', 'name avatar')
      .lean();

    if (!expense) throw new NotFoundException('Không tìm thấy khoản chi');

    if (role === 'member' && expense.userID.toString() !== userID) {
      throw new ForbiddenException('Bạn không có quyền xem khoản chi này');
    }

    return expense;
  }

  //PATCH/expenses/:id
  async updateExpense(
    id: string,
    dto: UpdateExpenseDto,
    userID: string,
    spaceID: string,
    role: string,
  ) {
    const expense = await this.expensesModel.findOne({
      _id: id,
      spaceID: new Types.ObjectId(spaceID),
    });

    if (!expense) throw new NotFoundException('Không tìm thấy khoản chi');

    if (role === 'member' && expense.userID.toString() !== userID) {
      throw new ForbiddenException('Bạn không có quyền sửa khoản chi này');
    }

    const updateData: any = {};
    let amountToCheck = expense.amount;
    let categoryToCheck = expense.categoryID.toString();
    let dateToCheck = expense.date;

    if (dto.amount !== undefined) {
      updateData.amount = dto.amount;
      amountToCheck = dto.amount;
    }
    if (dto.categoryID) {
      updateData.categoryID = new Types.ObjectId(dto.categoryID);
      categoryToCheck = dto.categoryID;
    }
    if (dto.date) {
      updateData.date = new Date(dto.date);
      dateToCheck = new Date(dto.date);
    }
    if (dto.description !== undefined) updateData.description = dto.description;

    // Check budget limit before updating
    await this.checkBudgetAndAlert(
      spaceID,
      categoryToCheck,
      amountToCheck,
      dateToCheck,
      id,
    );

    return this.expensesModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('categoryID', 'name icon color')
      .populate('userID', 'name avatar');
  }

  //DELETE/expenses/:id
  async deleteExpense(
    id: string,
    userID: string,
    spaceID: string,
    role: string,
  ) {
    const expense = await this.expensesModel.findOne({
      _id: id,
      spaceID: new Types.ObjectId(spaceID),
    });

    if (!expense) throw new NotFoundException('Không tìm thấy khoản chi');

    if (role === 'member' && expense.userID.toString() !== userID) {
      throw new ForbiddenException('Bạn không có quyền xóa khoản chi này');
    }

    await this.expensesModel.findByIdAndDelete(id);
    return { message: 'Đã xóa khoản chi' };
  }

  // Lấy tổng hợp doanh thu theo tháng
  async getMonthlySummary(spaceID: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const result = await this.expensesModel.aggregate([
      {
        $match: {
          spaceID: new Types.ObjectId(spaceID),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$categoryID',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          name: '$category.name',
          icon: '$category.icon',
          color: '$category.color',
          totalAmount: 1,
          count: 1,
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    return {
      month,
      year,
      totalExpense: result.reduce((s, r) => s + r.totalAmount, 0),
      byCategory: result,
    };
  }

  async getTotalExpenseByMonth(
    spaceID: string,
    month: number,
    year: number,
  ): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const result = await this.expensesModel.aggregate([
      {
        $match: {
          spaceID: new Types.ObjectId(spaceID),
          date: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return result[0]?.total ?? 0;
  }
}
