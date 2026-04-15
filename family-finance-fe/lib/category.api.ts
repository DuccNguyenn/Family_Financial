import { sendRequest } from "./api";

export type CategoryType = "income" | "expense";

export interface ICategory {
  _id: string;
  name: string;
  icon: string;
  type: CategoryType;
  spaceId?: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  icon: string;
  type: CategoryType;
}

export interface UpdateCategoryDto {
  name?: string;
  icon?: string;
  type?: CategoryType;
}

const SERVER_URL =
  process.env.NEXT_PUBLIC_BE_URL ?? "http://localhost:8081/api/";

export const getCategories = async (): Promise<ICategory[]> => {
  return sendRequest<ICategory[]>({
    url: `${SERVER_URL}/categoris`,
    method: "GET",
  });
};

export const createCategory = async (
  data: CreateCategoryDto,
): Promise<ICategory> => {
  return sendRequest<ICategory>({
    url: `${SERVER_URL}/categoris`,
    method: "POST",
    body: data,
  });
};

export const updateCategory = async (
  id: string,
  data: UpdateCategoryDto,
): Promise<ICategory> => {
  return sendRequest<ICategory>({
    url: `${SERVER_URL}/categoris/${id}`,
    method: "PATCH",
    body: data,
  });
};

export const deleteCategory = async (id: string): Promise<any> => {
  return sendRequest<any>({
    url: `${SERVER_URL}/categoris/${id}`,
    method: "DELETE",
  });
};
