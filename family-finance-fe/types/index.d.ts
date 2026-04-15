// Response từ NestJS 
export interface IBackendRes<T = any> {
  statusCode?: number;
  message?: string | string[];
  error?: string;
  data?: T;
  // login trả thêm
  access_token?: string;
  user?: IUser;
  _id?: string;
}

// User 
export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
  spaceId: string | null;
  role: "parent" | "member" | null;
  sysRole: "admin" | "user";
  accountId: string;
}

// sendRequest options 
export interface IRequest {
  url: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  queryParams?: Record<string, any>;
  useCredentials?: boolean;
  nextOption?: RequestInit;
  isFormData?: boolean;
}

// Income
export interface IIncome {
  _id: string;
  userID: {
    _id: string;
    name: string;
    avatar: string | null;
  };
  categoryID: {
    _id: string;
    name: string;
    icon: string;
    color?: string;
    type?: string;
  };
  amount: number;
  date: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncomeDto {
  categoryID: string;
  amount: number;
  date: string;
  description?: string;
}

export interface GetIncomeDto {
  month?: number;
  year?: number;
  categoryId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

// Aliases for Expense and Generic Transaction
export type IExpense = IIncome;
export type CreateExpenseDto = CreateIncomeDto;
export type GetExpenseDto = GetIncomeDto;
export type ITransaction = IIncome;

// ── Budget ──────────────────────────────────────────────────────────────────

export interface IBudgetCategory {
  _id: string;
  name: string;
  icon: string;
  color?: string;
}

/** Response trả về từ GET /budget và POST /budget */
export interface IBudget {
  _id: string;
  categoryId: IBudgetCategory;
  month: number;
  year: number;
  // Chỉ parent thấy các field này
  limitAmount?: number;
  spentAmount?: number;
  remaining?: number;
  alertThresholds?: number[];
  // Tất cả đều thấy
  percentage: number;
  status: "LOW" | "MEDIUM" | "HIGH" | "EXCEEDED";
}

export interface IBudgetListResponse {
  month: number;
  year: number;
  budgets: IBudget[];
  // Chỉ có khi role === 'parent'
  summary?: {
    totalLimit: number;
    totalSpent: number;
    totalRemaining: number;
    percentage: number;
  };
}

export interface CreateBudgetDto {
  categoryId: string;
  limitAmount: number;
  month: number;
  year: number;
  alertThresholds?: number[];
}

export interface GetBudgetDto {
  month?: number;
  year?: number;
}

