import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Incomes } from '@/Module/incomes/schema/income.schema';
import { Expenses } from '@/Module/expenses/schema/expense.schema';
import { Budget } from '@/Module/budget/schema/budget.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Incomes.name) private readonly incomesModel: Model<Incomes>,
    @InjectModel(Expenses.name) private readonly expensesModel: Model<Expenses>,
    @InjectModel(Budget.name) private readonly budgetModel: Model<Budget>,
  ) {}

  async getSummary(spaceId: string, userId?: string, role?: string) {
    const spaceObjectId = new Types.ObjectId(spaceId);

    // Apply strict filtering so members only see their own numbers
    const additionalMatch: any = {};
    if (role === 'member' && userId) {
      additionalMatch.userID = new Types.ObjectId(userId);
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    // 1. Total All-time Incomes & Expenses
    const [allIncomes, allExpenses] = await Promise.all([
      this.incomesModel.aggregate([
        { $match: { spaceID: spaceObjectId, ...additionalMatch } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.expensesModel.aggregate([
        { $match: { spaceID: spaceObjectId, ...additionalMatch } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalIncomesValue = allIncomes[0]?.total ?? 0;
    const totalExpensesValue = allExpenses[0]?.total ?? 0;
    const totalBalance = totalIncomesValue - totalExpensesValue;

    // 2. This Month Income & Expense
    const [monthIncomesRes, monthExpensesRes] = await Promise.all([
      this.incomesModel.aggregate([
        {
          $match: {
            spaceID: spaceObjectId,
            date: { $gte: startOfMonth, $lte: endOfMonth },
            ...additionalMatch,
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.expensesModel.aggregate([
        {
          $match: {
            spaceID: spaceObjectId,
            date: { $gte: startOfMonth, $lte: endOfMonth },
            ...additionalMatch,
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const monthIncome = monthIncomesRes[0]?.total ?? 0;
    const monthExpense = monthExpensesRes[0]?.total ?? 0;

    // 3. Category Allocation (Expenses this month)
    const categoryAllocation = await this.expensesModel.aggregate([
      {
        $match: {
          spaceID: spaceObjectId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
          ...additionalMatch,
        },
      },
      { $group: { _id: '$categoryID', totalAmount: { $sum: '$amount' } } },
      {
        $lookup: {
          from: 'categoris', // Using 'categoris' as per MongoDB standard mapping for your setup
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
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    // 4. Recent Transactions (latest 10 combined)
    const [recentIncomes, recentExpenses] = await Promise.all([
      this.incomesModel
        .find({ spaceID: spaceObjectId, ...additionalMatch })
        .sort({ date: -1, createdAt: -1 })
        .limit(10)
        .populate('categoryID', 'name icon color')
        .populate('userID', 'name avatar')
        .lean(),
      this.expensesModel
        .find({ spaceID: spaceObjectId, ...additionalMatch })
        .sort({ date: -1, createdAt: -1 })
        .limit(10)
        .populate('categoryID', 'name icon color')
        .populate('userID', 'name avatar')
        .lean(),
    ]);

    const combinedRecent = [
      ...recentIncomes.map((inc) => ({ ...inc, _type: 'income' })),
      ...recentExpenses.map((exp) => ({ ...exp, _type: 'expense' })),
    ];

    // Sort combined by date descending
    combinedRecent.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const recentTransactions = combinedRecent.slice(0, 10);

    // 5. 6-Month Trend
    const trendStart = new Date(year, month - 6, 1);
    const [trendIncomesRes, trendExpensesRes] = await Promise.all([
      this.incomesModel.aggregate([
        {
          $match: {
            spaceID: spaceObjectId,
            date: { $gte: trendStart, $lte: endOfMonth },
            ...additionalMatch,
          },
        },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' } },
            total: { $sum: '$amount' },
          },
        },
      ]),
      this.expensesModel.aggregate([
        {
          $match: {
            spaceID: spaceObjectId,
            date: { $gte: trendStart, $lte: endOfMonth },
            ...additionalMatch,
          },
        },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' } },
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const trend: Array<{ name: string; income: number; expense: number }> = [];
    for (let i = 5; i >= 0; i--) {
      // Start from the oldest month up to the current month to form chronological order
      const d = new Date(year, month - 1 - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;

      const incMatch = trendIncomesRes.find(
        (x) => x._id.year === y && x._id.month === m,
      );
      const expMatch = trendExpensesRes.find(
        (x) => x._id.year === y && x._id.month === m,
      );

      trend.push({
        name: `T${m}`,
        income: incMatch?.total || 0,
        expense: expMatch?.total || 0,
      });
    }

    // 6. Alert Budgets (Budgets >= threshold) - Members shouldn't process or see global alerts
    const alertBudgets: any[] = [];
    if (role !== 'member') {
      const activeBudgets = await this.budgetModel
        .find({
          spaceId: spaceObjectId,
          month,
          year,
          isAlertEnabled: { $ne: false },
        })
        .populate('categoryId', 'name icon color')
        .lean();

      for (const budget of activeBudgets) {
        const expensesForBudget = await this.expensesModel.aggregate([
          {
            $match: {
              spaceID: spaceObjectId,
              categoryID: new Types.ObjectId(
                (budget.categoryId as any)?._id ?? budget.categoryId,
              ),
              date: { $gte: startOfMonth, $lte: endOfMonth },
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const spentAmount = expensesForBudget[0]?.total ?? 0;
        const percentage =
          budget.limitAmount > 0 ? (spentAmount / budget.limitAmount) * 100 : 0;
        const threshold = budget.alertThresholds?.[0] || 80;

        if (percentage >= threshold) {
          alertBudgets.push({
            categoryId: budget.categoryId,
            limitAmount: budget.limitAmount,
            spentAmount,
            percentage: Math.round(percentage),
            threshold,
          });
        }
      }
    }

    return {
      totalBalance,
      monthIncome,
      monthExpense,
      categoryAllocation,
      recentTransactions,
      trend,
      alertBudgets,
    };
  }
}
