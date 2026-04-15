"use server";

import { cookies } from "next/headers";
import { sendRequestServer } from "./api";

import {
  ICategory,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "./category.api";
import { IBackendRes, IIncome, GetIncomeDto, CreateIncomeDto, IExpense, GetExpenseDto, CreateExpenseDto, IBudget, IBudgetListResponse, CreateBudgetDto, GetBudgetDto } from "@/types";


const BE = process.env.NEXT_PUBLIC_BE_URL ?? "http://localhost:8081/api/";

//  Helper lấy token phía server
const getToken = async () => (await cookies()).get("token")?.value ?? "";

//  Helper set cookie
const setTokenCookie = async (token: string) => {
  (await cookies()).set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 ngày
    path: "/",
  });
};

//  Đăng nhập
export const loginAction = async (
  email: string,
  password: string,
): Promise<IBackendRes> => {
  const res = await sendRequestServer<IBackendRes>({
    url: `${BE}/auths/login`,
    method: "POST",
    body: { email, password },
  });
  if (res?.access_token) {
    await setTokenCookie(res.access_token);
  }
  return res;
};

//  Đăng ký
export const registerAction = async (data: {
  name: string;
  email: string;
  password: string;
}): Promise<IBackendRes> => {
  return sendRequestServer<IBackendRes>({
    url: `${BE}/auths/register`,
    method: "POST",
    body: data,
  });
};

//  Xác thực email
export const verifyAccountAction = async (
  email: string,
  code: string,
): Promise<IBackendRes> => {
  return sendRequestServer<IBackendRes>({
    url: `${BE}/auths/verify-account`,
    method: "POST",
    body: { email, code },
  });
};

//  Gửi lại mã xác thực
export const resendCodeAction = async (email: string): Promise<IBackendRes> => {
  return sendRequestServer<IBackendRes>({
    url: `${BE}/auths/resend-code`,
    method: "POST",
    body: { email },
  });
};

//  Đổi mật khẩu
export const changePasswordAction = async (
  currentPassword: string,
  newPassword: string,
): Promise<IBackendRes> => {
  return sendRequestServer<IBackendRes>({
    url: `${BE}/users/me/password`,
    method: "PATCH",
    token: await getToken(),
    body: { currentPassword, newPassword },
  });
};

// Cập nhập thông tin cá nhân
export const updateProfileAction = async (data: {
  name: string;
  avatar: string;
}): Promise<IBackendRes> => {
  return sendRequestServer<IBackendRes>({
    url: `${BE}/users/me`,
    method: "PATCH",
    token: await getToken(),
    body: data,
  });
};

//  Đăng xuất
export const logoutAction = async (): Promise<void> => {
  (await cookies()).delete("token");
};
//  Tạo phòng
// BE trả access_token mới có spaceId+role=parent
// Set cookie ngay → FE không cần login lại
export const createSpaceAction = async (name: string): Promise<IBackendRes> => {
  const res = await sendRequestServer<IBackendRes>({
    url: `${BE}/space/create`,
    method: "POST",
    token: await getToken(),
    body: { name },
  });
  // Set cookie mới ngay — JWT mới có spaceId + role=parent
  if (res?.access_token) setTokenCookie(res.access_token);
  return res;
};

//  Vào phòng bằng mã mời
// BE trả access_token mới có spaceId+role=member
export const joinSpaceAction = async (
  invitedCode: string,
): Promise<IBackendRes> => {
  const res = await sendRequestServer<IBackendRes>({
    url: `${BE}/space/join`,
    method: "POST",
    token: await getToken(),
    body: { invitedCode },
  });
  // Set cookie mới ngay — JWT mới có spaceId + role=member
  if (res?.access_token) setTokenCookie(res.access_token);
  return res;
};

//  Lấy thông tin phòng
export const getMySpaceAction = async (): Promise<IBackendRes> => {
  return sendRequestServer<IBackendRes>({
    url: `${BE}/space/me`,
    method: "GET",
    token: await getToken(),
  });
};

// Lấy danh sách người dùng (Admin)
export const getUsersAdminAction = async (): Promise<IBackendRes> => {
  return sendRequestServer<IBackendRes>({
    url: `${BE}/users`,
    method: "GET",
    token: await getToken(),
  });
};

// Lấy danh mục hệ thống (Admin)
export const getSystemCategoriesAction = async (): Promise<IBackendRes> => {
  return sendRequestServer<IBackendRes>({
    url: `${BE}/categoris/system`,
    method: "GET",
    token: await getToken(),
  });
};

// Tạo danh mục hệ thống (Admin)
export const createSystemCategoryAction = async (
  data: any,
): Promise<IBackendRes> => {
  return sendRequestServer<IBackendRes>({
    url: `${BE}/categoris/system`,
    method: "POST",
    token: await getToken(),
    body: data,
  });
};

// Xóa danh mục hệ thống (Admin)
export const deleteSystemCategoryAction = async (
  id: string,
): Promise<IBackendRes> => {
  return sendRequestServer<IBackendRes>({
    url: `${BE}/categoris/system/${id}`,
    method: "DELETE",
    token: await getToken(),
  });
};

// ... (các API Category dành cho User)

// Lấy danh sách danh mục (User)
export const getCategoriesAction = async (): Promise<
  ICategory[] | { error: string; message: string }
> => {
  try {
    const data = await sendRequestServer<
      ICategory[] | { error: string; message: string }
    >({
      url: `${BE}/categoris`,
      method: "GET",
      token: await getToken(),
    });
    return data;
  } catch (error: any) {
    return { error: "FetchError", message: error.message || "Failed to fetch" };
  }
};

// Thêm danh mục mới (User)
export const createCategoryAction = async (
  data: CreateCategoryDto,
): Promise<ICategory> => {
  try {
    const result = await sendRequestServer<ICategory>({
      url: `${BE}/categoris`,
      method: "POST",
      body: data,
      token: await getToken(),
    });
    return result;
  } catch (error: any) {
    throw new Error(error.message || "Lỗi tạo danh mục");
  }
};

// Sửa danh mục (User)
export const updateCategoryAction = async (
  id: string,
  data: UpdateCategoryDto,
): Promise<ICategory> => {
  try {
    const result = await sendRequestServer<ICategory>({
      url: `${BE}/categoris/${id}`,
      method: "PATCH",
      body: data,
      token: await getToken(),
    });
    return result;
  } catch (error: any) {
    throw new Error(error.message || "Lỗi cập nhật danh mục");
  }
};

// Xoá danh mục (User)
export const deleteCategoryAction = async (id: string): Promise<any> => {
  try {
    const result = await sendRequestServer<any>({
      url: `${BE}/categoris/${id}`,
      method: "DELETE",
      token: await getToken(),
    });
    return result;
  } catch (error: any) {
    throw new Error(error.message || "Lỗi xóa danh mục");
  }
};

// --- Giao dịch (Income) ---

// Lấy danh sách giao dịch thu nhập
export const getIncomesAction = async (
  query: GetIncomeDto,
): Promise<IBackendRes<{ result: IIncome[]; meta: any }>> => {
  try {
    console.log(`[Action] Fetching incomes from: ${BE}/incomes`);
    const res = await sendRequestServer<any>({
      url: `${BE}/incomes`,
      method: "GET",
      token: await getToken(),
      queryParams: query,
    });
    // Trả về data wrap để đồng nhất với IBackendRes
    return {
        statusCode: 200,
        message: "Success",
        data: res // res contains { result, meta }
    };
  } catch (error: any) {
    console.error("[Action Error] getIncomesAction:", error);
    return {
      statusCode: 500,
      message: error.message || "Lỗi khi lấy danh sách giao dịch",
      data: { result: [], meta: {} },
    };
  }
};

// Tạo giao dịch thu nhập mới
export const createIncomeAction = async (
  data: CreateIncomeDto,
): Promise<IBackendRes<IIncome>> => {
  try {
    const res = await sendRequestServer<IBackendRes<IIncome>>({
      url: `${BE}/incomes`,
      method: "POST",
      token: await getToken(),
      body: data,
    });
    return res;
  } catch (error: any) {
    console.error("[Action Error] createIncomeAction:", error);
    return {
      statusCode: 500,
      message: error.message || "Lỗi khi tạo giao dịch",
    };
  }
};

// Cập nhật giao dịch thu nhập
export const updateIncomeAction = async (
  id: string,
  data: Partial<CreateIncomeDto>,
): Promise<IBackendRes<IIncome>> => {
  try {
    const res = await sendRequestServer<IBackendRes<IIncome>>({
      url: `${BE}/incomes/${id}`,
      method: "PATCH",
      token: await getToken(),
      body: data,
    });
    return res;
  } catch (error: any) {
    console.error("[Action Error] updateIncomeAction:", error);
    return {
      statusCode: 500,
      message: error.message || "Lỗi khi cập nhật giao dịch",
    };
  }
};

// Xoá giao dịch thu nhập
export const deleteIncomeAction = async (id: string): Promise<IBackendRes<any>> => {
  try {
    const res = await sendRequestServer<IBackendRes<any>>({
      url: `${BE}/incomes/${id}`,
      method: "DELETE",
      token: await getToken(),
    });
    return res;
  } catch (error: any) {
    console.error("[Action Error] deleteIncomeAction:", error);
    return {
      statusCode: 500,
      message: error.message || "Lỗi khi xóa giao dịch",
    };
  }
};

// --- Giao dịch (Expense) ---

// Lấy danh sách giao dịch chi phí
export const getExpensesAction = async (
  query: GetExpenseDto,
): Promise<IBackendRes<{ result: IExpense[]; meta: any }>> => {
  try {
    console.log(`[Action] Fetching expenses from: ${BE}/expenses`);
    const res = await sendRequestServer<any>({
      url: `${BE}/expenses`,
      method: "GET",
      token: await getToken(),
      queryParams: query,
    });
    return {
        statusCode: 200,
        message: "Success",
        data: res
    };
  } catch (error: any) {
    console.error("[Action Error] getExpensesAction:", error);
    return {
      statusCode: 500,
      message: error.message || "Lỗi khi lấy danh sách giao dịch chi phí",
      data: { result: [], meta: {} },
    };
  }
};

// Tạo giao dịch chi phí mới
export const createExpenseAction = async (
  data: CreateExpenseDto,
): Promise<IBackendRes<IExpense>> => {
  try {
    const res = await sendRequestServer<IBackendRes<IExpense>>({
      url: `${BE}/expenses`,
      method: "POST",
      token: await getToken(),
      body: data,
    });
    return res;
  } catch (error: any) {
    console.error("[Action Error] createExpenseAction:", error);
    return {
      statusCode: 500,
      message: error.message || "Lỗi khi tạo giao dịch chi phí",
    };
  }
};

// Cập nhật giao dịch chi phí
export const updateExpenseAction = async (
  id: string,
  data: Partial<CreateExpenseDto>,
): Promise<IBackendRes<IExpense>> => {
  try {
    const res = await sendRequestServer<IBackendRes<IExpense>>({
      url: `${BE}/expenses/${id}`,
      method: "PATCH",
      token: await getToken(),
      body: data,
    });
    return res;
  } catch (error: any) {
    console.error("[Action Error] updateExpenseAction:", error);
    return {
      statusCode: 500,
      message: error.message || "Lỗi khi cập nhật giao dịch chi phí",
    };
  }
};

// Xoá giao dịch chi phí
export const deleteExpenseAction = async (id: string): Promise<IBackendRes<any>> => {
  try {
    const res = await sendRequestServer<IBackendRes<any>>({
      url: `${BE}/expenses/${id}`,
      method: "DELETE",
      token: await getToken(),
    });
    return res;
  } catch (error: any) {
    console.error("[Action Error] deleteExpenseAction:", error);
    return {
      statusCode: 500,
      message: error.message || "Lỗi khi xóa giao dịch chi phí",
    };
  }
};

// --- Không gian gia đình (Space Members) ---

// Đổi quyền thành viên
export const changeMemberRoleAction = async (
  memberId: string,
  role: "parent" | "member"
): Promise<IBackendRes<any>> => {
  try {
    const res = await sendRequestServer<IBackendRes<any>>({
      url: `${BE}/space/me/members/${memberId}/role`,
      method: "PATCH",
      token: await getToken(),
      body: { role },
    });
    return res;
  } catch (error: any) {
    console.error("[Action Error] changeMemberRoleAction:", error);
    return {
      statusCode: 500,
      message: error.message || "Lỗi khi cập nhật quyền thành viên",
    };
  }
};

// Xoá thành viên khỏi không gian
export const removeMemberAction = async (memberId: string): Promise<IBackendRes<any>> => {
  try {
    const res = await sendRequestServer<IBackendRes<any>>({
      url: `${BE}/space/me/members/${memberId}`,
      method: "DELETE",
      token: await getToken(),
    });
    return res;
  } catch (error: any) {
    console.error("[Action Error] removeMemberAction:", error);
    return {
      statusCode: 500,
      message: error.message || "Lỗi khi xóa thành viên",
    };
  }
};

// --- Ngân sách (Budget) ---

// Lấy danh sách ngân sách theo tháng/năm
export const getBudgetsAction = async (
  query: GetBudgetDto,
): Promise<IBackendRes<IBudgetListResponse>> => {
  try {
    const res = await sendRequestServer<IBudgetListResponse>({
      url: `${BE}/budget`,
      method: "GET",
      token: await getToken(),
      queryParams: query,
    });
    return { statusCode: 200, message: "Success", data: res };
  } catch (error: any) {
    console.error("[Action Error] getBudgetsAction:", error);
    return { statusCode: 500, message: error.message || "Lỗi khi lấy ngân sách" };
  }
};

// Lấy chi tiết một ngân sách
export const getBudgetAction = async (
  id: string,
): Promise<IBackendRes<IBudget>> => {
  try {
    const res = await sendRequestServer<IBudget>({
      url: `${BE}/budget/${id}`,
      method: "GET",
      token: await getToken(),
    });
    return { statusCode: 200, message: "Success", data: res };
  } catch (error: any) {
    console.error("[Action Error] getBudgetAction:", error);
    return { statusCode: 500, message: error.message || "Lỗi khi lấy chi tiết ngân sách" };
  }
};

// Tạo ngân sách mới (chỉ parent)
export const createBudgetAction = async (
  data: CreateBudgetDto,
): Promise<IBackendRes<IBudget>> => {
  try {
    const res = await sendRequestServer<IBudget>({
      url: `${BE}/budget`,
      method: "POST",
      token: await getToken(),
      body: data,
    });
    return { statusCode: 200, message: "Success", data: res };
  } catch (error: any) {
    console.error("[Action Error] createBudgetAction:", error);
    return { statusCode: 500, message: error.message || "Lỗi khi tạo ngân sách" };
  }
};

// Cập nhật ngân sách (chỉ parent)
export const updateBudgetAction = async (
  id: string,
  data: Partial<CreateBudgetDto>,
): Promise<IBackendRes<IBudget>> => {
  try {
    const res = await sendRequestServer<IBudget>({
      url: `${BE}/budget/${id}`,
      method: "PATCH",
      token: await getToken(),
      body: data,
    });
    return { statusCode: 200, message: "Success", data: res };
  } catch (error: any) {
    console.error("[Action Error] updateBudgetAction:", error);
    return { statusCode: 500, message: error.message || "Lỗi khi cập nhật ngân sách" };
  }
};

// Xóa ngân sách (chỉ parent)
export const deleteBudgetAction = async (
  id: string,
): Promise<IBackendRes<any>> => {
  try {
    const res = await sendRequestServer<any>({
      url: `${BE}/budget/${id}`,
      method: "DELETE",
      token: await getToken(),
    });
    return { statusCode: 200, message: "Success", data: res };
  } catch (error: any) {
    console.error("[Action Error] deleteBudgetAction:", error);
    return { statusCode: 500, message: error.message || "Lỗi khi xóa ngân sách" };
  }
};

// --- Dashboard ---
export const getDashboardSummaryAction = async (): Promise<IBackendRes<any>> => {
  try {
    const res = await sendRequestServer<any>({
      url: `${BE}/dashboard/summary`,
      method: "GET",
      token: await getToken(),
    });
    return { statusCode: 200, message: "Success", data: res };
  } catch (error: any) {
    console.error("[Action Error] getDashboardSummaryAction:", error);
    return { statusCode: 500, message: error.message || "Lỗi khi lấy dữ liệu tổng hợp" };
  }
};

