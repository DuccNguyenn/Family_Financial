"use client";

import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Plus,
  PencilSimple,
  Trash,
  ChartLineUp,
  CaretRight,
  WarningCircle,
  SpinnerGap,
} from "@phosphor-icons/react";
import * as PhosphorIcons from "@phosphor-icons/react";
import { toast } from "sonner";
import { ICategory } from "@/lib/category.api";
import { getCategoriesAction, deleteCategoryAction } from "@/lib/action";
import { CategoryModal } from "@/components/categories/category-modal";
import { DeleteCategoryModal } from "@/components/categories/delete-category-modal";

// Utility to pick color based on index or string length pseudo-randomly
const COLORS = [
  "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400",
  "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
  "bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400",
  "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400",
  "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400",
  "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400",
];
const MOBILE_COLORS = [
  "text-red-600",
  "text-blue-600",
  "text-teal-600",
  "text-purple-600",
  "text-orange-600",
  "text-cyan-600",
];

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  // Custom fetch states
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(
    null,
  );

  // Delete modal state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<ICategory | null>(
    null,
  );

  // Fetch function
  const fetchCategoriesData = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const data = await getCategoriesAction();
      if ((data as any).error) {
        setIsError(true);
      } else {
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    fetchCategoriesData();
  }, []);

  // Filter based on active tab
  const filteredCategories = categories.filter((cat) => cat.type === activeTab);

  // Delete Action
  const handleActionDelete = (cat: ICategory) => {
    if (cat.isSystem) {
      toast.warning("Hệ thống", {
        description: "Bạn không thể xóa danh mục mặc định của hệ thống.",
      });
      return;
    }
    setCategoryToDelete(cat);
    setIsDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategoryAction(categoryToDelete._id);
      toast.success("Xóa danh mục thành công!");
      fetchCategoriesData(); // Refresh list after delete
    } catch (error: any) {
      toast.error(error?.message || "Lỗi khi xóa danh mục");
    } finally {
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleActionCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleActionEdit = (cat: ICategory) => {
    // Only allow edit if not system
    if (cat.isSystem) {
      toast.warning("Hệ thống", {
        description: "Bạn không thể sửa danh mục mặc định của hệ thống.",
      });
      return;
    }
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-24 md:pb-8 animate-in fade-in duration-500">
      {/* MOBILE HEADER (Matches Stitch Mobile Design exactly) */}
      <div className="md:hidden pt-8 px-4 flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          Danh mục chi tiêu
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Quản lý cách dòng tiền của gia đình bạn vận hành.
        </p>
      </div>

      {/* MOBILE CTA BUTTON */}
      <div className="md:hidden px-4 mt-8 mb-10">
        <button
          onClick={handleActionCreate}
          className="w-full bg-gradient-to-b from-green-600 to-green-700 text-white py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-[0_8px_30px_rgba(22,163,74,0.25)] transition-all active:scale-[0.98]"
        >
          <PlusCircle size={28} weight="fill" />
          <span className="font-semibold text-lg">Thêm danh mục mới</span>
        </button>
      </div>

      {/* DESKTOP HEADER Sections (Matches Desktop Design exactly) */}
      <header className="hidden md:flex px-8 pt-6 pb-4 flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Cài đặt</span>
            <CaretRight size={14} weight="bold" />
            <span className="font-semibold text-green-600 dark:text-green-500">
              Quản lý danh mục
            </span>
          </nav>
          <h2 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">
            Quản lý danh mục
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Cấu trúc chi tiêu và thu nhập của tổ ấm bạn.
          </p>
        </div>
        <button
          onClick={handleActionCreate}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-600/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <PlusCircle size={24} weight="fill" />
          Thêm danh mục mới
        </button>
      </header>

      {/* DESKTOP Functional Tabs */}
      <section className="hidden md:block px-8 mt-4">
        <div className="bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl inline-flex gap-1 border border-slate-200/50 dark:border-slate-700/50">
          <button
            onClick={() => setActiveTab("expense")}
            className={`px-8 py-2.5 rounded-xl font-bold shadow-sm transition-all ${
              activeTab === "expense"
                ? "bg-white dark:bg-[#1A2620] text-green-700 dark:text-green-400"
                : "text-slate-500 dark:text-slate-400 font-medium hover:bg-white/40 dark:hover:bg-black/20"
            }`}
          >
            Chi phí
          </button>
          <button
            onClick={() => setActiveTab("income")}
            className={`px-8 py-2.5 rounded-xl font-bold shadow-sm transition-all ${
              activeTab === "income"
                ? "bg-white dark:bg-[#1A2620] text-green-700 dark:text-green-400"
                : "text-slate-500 dark:text-slate-400 font-medium hover:bg-white/40 dark:hover:bg-black/20"
            }`}
          >
            Thu nhập
          </button>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
          <SpinnerGap size={40} className="animate-spin text-green-600" />
          <p className="font-medium animate-pulse">Đang tải danh mục...</p>
        </div>
      ) : isError ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-rose-500">
          <WarningCircle size={48} weight="duotone" />
          <p className="font-medium">
            Chưa thể tải dữ liệu. Vui lòng thử lại sau.
          </p>
          <button
            onClick={fetchCategoriesData}
            className="px-4 py-2 mt-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            Thử lại
          </button>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600">
            <Plus size={48} />
          </div>
          <p className="text-xl font-bold text-slate-700 dark:text-slate-300">
            Chưa có danh mục nào
          </p>
          <p className="text-slate-500 mt-2 max-w-sm">
            Cấu trúc chi tiêu của bạn chưa được thiết lập. Hãy tạo danh mục đầu
            tiên.
          </p>
          <button
            onClick={handleActionCreate}
            className="mt-6 text-green-600 font-bold hover:underline"
          >
            Thêm danh mục mới
          </button>
        </div>
      ) : (
        <>
          {/* --------------------- MOBILE LAYOUT (List-View) --------------------- */}
          <section className="md:hidden px-4 space-y-4">
            {filteredCategories.map((cat, idx) => {
              // @ts-ignore
              const IconComponent =
                PhosphorIcons[cat.icon] || PhosphorIcons.Star;
              const colorIdx = idx % COLORS.length;
              const mobileColor = MOBILE_COLORS[colorIdx];

              return (
                <div
                  key={cat._id}
                  onClick={() => handleActionEdit(cat)}
                  className="bg-white dark:bg-[#122017] border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-[24px] flex items-center justify-between transition-all hover:bg-slate-50 dark:hover:bg-[#16271c] active:scale-[0.99] shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-5">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center ${COLORS[colorIdx]}`}
                    >
                      <div className={mobileColor}>
                        <IconComponent size={32} weight="fill" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {cat.name}
                        {cat.isSystem && (
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-sm font-semibold text-slate-500 uppercase">
                            Mặc định
                          </span>
                        )}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                        -- giao dịch tháng này
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <CaretRight
                      size={20}
                      weight="bold"
                      className="text-slate-300 dark:text-slate-600"
                    />
                  </div>
                </div>
              );
            })}
          </section>

          {/* MOBILE Prosperity Progress Placeholder */}
          <section className="md:hidden px-4 mt-12 mb-8">
            <div className="bg-slate-100 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
              <div className="flex justify-between items-end mb-4">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">
                  Hạn mức chi tiêu
                </h4>
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                  0% Đã dùng
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-slate-300 dark:bg-slate-600 w-0"></div>
              </div>
            </div>
          </section>
          {/* --------------------- END MOBILE LAYOUT --------------------- */}

          {/* --------------------- DESKTOP LAYOUT (Grid-View) --------------------- */}
          <section className="hidden md:grid px-8 mt-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((cat, idx) => {
              // @ts-ignore
              const IconComponent =
                PhosphorIcons[cat.icon] || PhosphorIcons.Star;
              const colorIdx = idx % COLORS.length;

              return (
                <div
                  key={`desktop-${cat._id}`}
                  className="bg-white dark:bg-[#122017] border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-[2rem] flex flex-col gap-6 group hover:shadow-xl hover:-translate-y-1 hover:shadow-green-900/5 dark:hover:shadow-green-300/5 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center ${COLORS[colorIdx]} z-10`}
                    >
                      <IconComponent size={32} weight="fill" />
                    </div>

                    {/* Desktop Hover Action Buttons */}
                    {!cat.isSystem && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 translate-x-2 group-hover:translate-x-0 duration-300">
                        <button
                          onClick={() => handleActionEdit(cat)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
                        >
                          <PencilSimple size={20} weight="bold" />
                        </button>
                        <button
                          onClick={() => handleActionDelete(cat)}
                          className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg text-rose-500 transition-colors"
                        >
                          <Trash size={20} weight="bold" />
                        </button>
                      </div>
                    )}
                    {cat.isSystem && (
                      <div className="z-10 mt-2">
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-sm font-semibold text-slate-500 uppercase">
                          Mặc định
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="z-10">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                      {cat.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      -- giao dịch tháng này
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center z-10">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Ngân sách
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Chưa đặt
                    </span>
                  </div>
                </div>
              );
            })}

            {/* ADD NEW CARD Placeholder */}
            <div
              onClick={handleActionCreate}
              className="border-2 border-dashed border-slate-300/70 dark:border-slate-700/70 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-4 group hover:border-green-500/50 dark:hover:border-green-500/50 transition-all cursor-pointer bg-transparent min-h-[220px]"
            >
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 group-hover:bg-green-500 group-hover:text-white dark:group-hover:bg-green-600 flex items-center justify-center transition-all duration-300 scale-95 group-hover:scale-100">
                <Plus size={32} weight="bold" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-500 dark:text-slate-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  Tạo danh mục mới
                </p>
                <p className="text-xs text-slate-400/80 dark:text-slate-500/80 mt-1">
                  Tùy chỉnh theo nhu cầu
                </p>
              </div>
            </div>
          </section>
        </>
      )}

      {/* DESKTOP Stats Overview for Context */}
      <section className="hidden md:block px-8 mt-12 mb-12">
        <div className="bg-green-50/50 dark:bg-green-900/10 rounded-[2.5rem] p-8 flex flex-col xl:flex-row gap-8 items-center justify-between border border-green-100 dark:border-green-900/30">
          <div className="flex gap-6 items-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center shrink-0">
              <ChartLineUp
                size={40}
                className="text-green-600 dark:text-green-500"
                weight="fill"
              />
            </div>
            <div>
              <h4 className="text-2xl font-black text-green-700 dark:text-green-500 tracking-tight">
                Tối ưu hóa danh mục
              </h4>
              <p className="text-slate-600 dark:text-slate-400 max-w-lg mt-2 leading-relaxed">
                Tạo và tối ưu các danh mục riêng để thống kê tài chính gia đình
                chi tiết và rõ nét hơn.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* --------------------- END DESKTOP LAYOUT --------------------- */}

      {/* MODAL FORM TẠO/SỬA DANH MỤC */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccessCallback={() => fetchCategoriesData()}
        editData={
          editingCategory
            ? {
                id: editingCategory._id,
                name: editingCategory.name,
                icon: editingCategory.icon,
                type: editingCategory.type,
              }
            : null
        }
        defaultType={activeTab}
      />

      {/* Delete Category Modal */}
      <DeleteCategoryModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={executeDelete}
        categoryName={categoryToDelete?.name ?? ""}
      />
    </div>
  );
}
