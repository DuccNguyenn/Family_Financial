"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PencilSimple, Trash, Wallet, Coffee, ShoppingCart, GraduationCap, TrendUp, Question, CaretRight } from "@phosphor-icons/react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ITransaction } from "@/types";

// Helper map icons
const IconMap: Record<string, any> = {
  coffee: Coffee,
  shopping: ShoppingCart,
  education: GraduationCap,
  salary: TrendUp,
  food: Coffee,
};

interface TransactionTableProps {
  transactions: ITransaction[];
  onEdit?: (transaction: ITransaction) => void;
  onDelete?: (transaction: ITransaction) => void;
  onMobileSelect?: (transaction: ITransaction) => void;
  type?: "income" | "expense";
}

export function TransactionTable({ 
  transactions, 
  onEdit, 
  onDelete, 
  onMobileSelect,
  type = "income" 
}: TransactionTableProps) {
  const isIncome = type === "income";
  // Nhóm giao dịch theo ngày
  const groupedTransactions = transactions.reduce((acc, curr) => {
    const dateKey = format(new Date(curr.date), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(curr);
    return acc;
  }, {} as Record<string, ITransaction[]>);

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getRelativeDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) return "HÔM NAY";
    if (format(date, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")) return "HÔM QUA";
    return format(date, "do MMMM, yyyy", { locale: vi }).toUpperCase();
  };

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block w-full bg-white dark:bg-[#122017] rounded-2xl border border-slate-100 dark:border-slate-800/60 overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-800/20">
            <TableRow>
              <TableHead className="w-[150px]">Ngày</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Người tạo / Ví</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
              <TableHead className="w-[100px] text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDates.map((dateKey) => (
              <React.Fragment key={dateKey}>
                <TableRow className="bg-slate-50/30 dark:bg-slate-900/10 hover:bg-transparent">
                  <TableCell colSpan={5} className="py-2 px-4">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                      {getRelativeDateLabel(dateKey)}
                    </span>
                  </TableCell>
                </TableRow>
                {groupedTransactions[dateKey].map((item) => {
                  const IconComponent = IconMap[item.categoryID.icon?.toLowerCase() || ''] || Question;
                  return (
                    <TableRow key={`desktop-${item._id}`} className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <TableCell className="text-slate-500 text-sm">
                        {format(new Date(item.date), "HH:mm")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                            style={{ 
                              backgroundColor: item.categoryID.color ? `${item.categoryID.color}20` : '#f1f5f9',
                              color: item.categoryID.color || '#64748b'
                            }}
                          >
                            <IconComponent weight="duotone" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                              {item.categoryID.name}
                            </span>
                            {item.description && (
                              <span className="text-xs text-slate-400 line-clamp-1">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.userID?.avatar ? (
                            <img src={item.userID.avatar} alt="avatar" className="w-5 h-5 rounded-full object-cover shadow-sm" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex flex-col items-center justify-center font-bold text-[10px]">
                              {item.userID?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {item.userID?.name || 'Thành viên'}
                            </span>
                            <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-medium text-[9px] rounded-md px-1.5 py-0 mt-0.5 w-fit">
                              Ví chung
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={`text-right font-bold ${isIncome ? 'text-green-600 dark:text-green-500' : 'text-rose-600 dark:text-rose-500'}`}>
                        {isIncome ? '+' : '-'} {formatAmount(item.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
                          <button 
                            onClick={() => onEdit?.(item)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <PencilSimple size={18} weight="bold" />
                          </button>
                          <button 
                            onClick={() => onDelete?.(item)}
                            className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg text-rose-500 transition-colors"
                            title="Xóa"
                          >
                            <Trash size={18} weight="bold" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </React.Fragment>
            ))}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-slate-500 italic">
                  Không có dữ liệu giao dịch
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="block md:hidden space-y-6">
        {transactions.length === 0 && (
          <div className="text-center py-10 text-slate-500 italic">
            Không có dữ liệu giao dịch
          </div>
        )}
        
        {sortedDates.map((dateKey) => (
          <div key={`mobile-${dateKey}`} className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-500 tracking-wider">
              {getRelativeDateLabel(dateKey)}
            </h3>
            <div className="flex flex-col gap-2">
              {groupedTransactions[dateKey].map((item) => {
                const IconComponent = IconMap[item.categoryID.icon?.toLowerCase() || ''] || Question;
                return (
                  <div 
                    key={`mobile-row-${item._id}`}
                    onClick={() => onMobileSelect?.(item)}
                    className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.98] transition-transform cursor-pointer"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                        style={{ 
                          backgroundColor: item.categoryID.color ? `${item.categoryID.color}20` : '#f1f5f9',
                          color: item.categoryID.color || '#64748b'
                        }}
                      >
                        <IconComponent weight="duotone" />
                      </div>
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">
                          {item.categoryID.name}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-slate-500">
                            {format(new Date(item.date), "HH:mm")}
                          </span>
                          <span className="text-xs text-slate-300">•</span>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            {item.userID?.avatar ? (
                              <img src={item.userID.avatar} alt="avatar" className="w-3.5 h-3.5 rounded-full object-cover" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-[8px]">
                                {item.userID?.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                            )}
                            <span className="truncate max-w-[80px]">{item.userID?.name || 'Thành viên'}</span>
                          </div>
                          {item.description && (
                            <>
                              <span className="text-xs text-slate-300">•</span>
                              <span className="text-xs text-slate-500 truncate line-clamp-1 max-w-[120px]">{item.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-2 shrink-0">
                      <span className={`font-black text-base ${isIncome ? 'text-green-600 dark:text-green-500' : 'text-rose-600 dark:text-rose-500'}`}>
                        {isIncome ? '+' : '-'} {formatAmount(item.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
