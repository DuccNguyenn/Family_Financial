"use client";

import React, { useState } from "react";
import { Plus, MagnifyingGlass, Funnel, Calendar as CalendarIcon } from "@phosphor-icons/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionTable } from "./_components/transaction-table";
import { AddTransactionModal } from "./_components/add-transaction-modal";
import { TransactionMobileDetail } from "./_components/transaction-mobile-detail";
import { DeleteConfirmModal } from "./_components/delete-confirm-modal";
import { getIncomesAction, getCategoriesAction, deleteIncomeAction, getExpensesAction, deleteExpenseAction } from "@/lib/action";
import { useAuthStore } from "@/store/auth.store";
import { ICategory } from "@/lib/category.api";
import { toast } from "sonner";
import { IIncome, GetIncomeDto } from "@/types";

export default function TransactionPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<IIncome | null>(null);
  const [mobileDetailTransaction, setMobileDetailTransaction] = useState<IIncome | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<IIncome | null>(null);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"income" | "expense">("income");
  
  // Filters State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTime, setSelectedTime] = useState<string>("all");

  // Query Categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await getCategoriesAction();
      console.log("Categories API Response:", res);
      // Backend returns array directly for categories
      return Array.isArray(res) ? res : [];
    },
  });

  const queryClient = useQueryClient();

  // Mutation for deleting a transaction
  const deleteMutation = useMutation({
    mutationFn: (id: string) => activeTab === "income" ? deleteIncomeAction(id) : deleteExpenseAction(id),
    onSuccess: (res: any) => {
      if (res.error) {
        toast.error(res.message || "Có lỗi xảy ra khi xóa");
        return;
      }
      toast.success("Xóa giao dịch thành công");
      setTransactionToDelete(null);
      if (mobileDetailTransaction && mobileDetailTransaction._id === res._id) {
         setMobileDetailTransaction(null);
      }
      queryClient.invalidateQueries({ queryKey: ["transactions", activeTab] });
      // Khi xóa expense, budget cần tính lại spentAmount ngay
      if (activeTab === "expense") {
        queryClient.invalidateQueries({ queryKey: ["budgets"] });
      }
    },
    onError: () => {
      toast.error("Lỗi kết nối đến máy chủ");
    },
  });


  const handleEdit = (transaction: IIncome) => {
    setEditTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDelete = (transaction: IIncome) => {
    setTransactionToDelete(transaction);
  };

  // Query Transactions
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ["transactions", activeTab, selectedCategory, selectedTime],
    queryFn: async () => {
      const query: GetIncomeDto = {
        page: 1,
        limit: 100,
      };

      if (selectedCategory !== "all") {
        query.categoryId = selectedCategory;
      }

      if (selectedTime === "this-month") {
        const now = new Date();
        query.month = now.getMonth() + 1;
        query.year = now.getFullYear();
      } else if (selectedTime === "last-month") {
        const now = new Date();
        let month = now.getMonth();
        let year = now.getFullYear();
        if (month === 0) {
          month = 12;
          year -= 1;
        }
        query.month = month;
        query.year = year;
      }

      const res = activeTab === "income" 
        ? await getIncomesAction(query) 
        : await getExpensesAction(query);
      console.log(`[API ${activeTab}] Response:`, res);
      
      return res?.data?.result || [];
    },
  });

  const transactions: IIncome[] = Array.isArray(transactionsData) ? transactionsData : [];
  const categories: ICategory[] = Array.isArray(categoriesData) ? categoriesData : [];
  const displayCategories = categories.filter(c => c.type === activeTab);

  // Diagnostic: Check if user has a spaceId
  const { user } = useAuthStore();
  const hasSpace = !!user?.spaceId;

  // Client-side search (for snappiness)
  const filteredTransactions = transactions.filter((t: IIncome) => 
    t.description?.toLowerCase().includes(search.toLowerCase()) || 
    t.categoryID?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Lịch sử giao dịch
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Minh bạch từng khoản chi, gắn kết cả nhà
          </p>
        </div>

        <Button 
          onClick={() => {
            setEditTransaction(null);
            setIsModalOpen(true);
          }}
          className={`${activeTab === "income" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20"} text-white px-6 py-6 rounded-2xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2`}
        >
          <Plus size={20} weight="bold" />
          <span>Thêm giao dịch</span>
        </Button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-fit">
        <button
          onClick={() => {
            setActiveTab("income");
            setSearch("");
            setSelectedCategory("all");
          }}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
            activeTab === "income"
              ? "bg-white dark:bg-[#1C2C22] text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Khoản Thu
        </button>
        <button
          onClick={() => {
            setActiveTab("expense");
            setSearch("");
            setSelectedCategory("all");
          }}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
            activeTab === "expense"
              ? "bg-white dark:bg-[#2C1C1C] text-rose-600 dark:text-rose-400 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          Khoản Chi
        </button>
      </div>

      {!hasSpace && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-2xl flex items-start gap-4">
            <Funnel size={24} className="text-amber-600 mt-1" />
            <div>
                <h4 className="font-bold text-amber-800 dark:text-amber-400">Chưa chọn Không gian!</h4>
                <p className="text-sm text-amber-700/80 dark:text-amber-400/60 mt-1">
                    Tài khoản của bạn chưa tham gia vào Không gian gia đình nào. Hãy tạo hoặc tham gia không gian để xem và quản lý giao dịch.
                </p>
            </div>
        </div>
      )}

      {/* Action Bar (Filters) */}
      <div className="bg-white dark:bg-[#122017] p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-xs flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <MagnifyingGlass 
            size={20} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" 
          />
          <Input 
            placeholder="Tìm kiếm giao dịch..." 
            className="pl-12 h-12 bg-slate-50 border-none rounded-xl focus-visible:ring-emerald-500/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px] h-12 bg-slate-50 border-none rounded-xl font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <Funnel size={18} />
              <SelectValue placeholder="Danh mục" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {displayCategories.map(cat => (
              <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Time Filter */}
        <Select value={selectedTime} onValueChange={setSelectedTime}>
          <SelectTrigger className="w-[180px] h-12 bg-slate-50 border-none rounded-xl font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <CalendarIcon size={18} />
              <SelectValue placeholder="Thời gian" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Mọi lúc</SelectItem>
            <SelectItem value="this-month">Tháng này</SelectItem>
            <SelectItem value="last-month">Tháng trước</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions Table Section */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-slate-400 font-medium italic">Đang tải dữ liệu...</p>
            </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-sm font-bold text-slate-400 tracking-wider uppercase">
              Danh sách giao dịch ({filteredTransactions.length})
            </span>
          </div>
          <TransactionTable 
            type={activeTab}
            transactions={filteredTransactions} 
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMobileSelect={(transaction) => setMobileDetailTransaction(transaction)}
          />
        </div>
      )}

      {/* Modal */}
      <AddTransactionModal 
        open={isModalOpen} 
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setEditTransaction(null);
        }}
        categories={categories}
        editData={editTransaction}
        type={activeTab}
      />

      {/* Mobile Detail Sheet */}
      <TransactionMobileDetail
        type={activeTab}
        transaction={mobileDetailTransaction}
        isOpen={!!mobileDetailTransaction}
        onClose={() => setMobileDetailTransaction(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        type={activeTab}
        transaction={transactionToDelete}
        isOpen={!!transactionToDelete}
        onClose={() => setTransactionToDelete(null)}
        onConfirm={() => {
          if (transactionToDelete) deleteMutation.mutate(transactionToDelete._id);
        }}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
