"use client";
import React from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Coffee,
  ShoppingCart,
  GraduationCap,
  TrendUp,
  Users,
  User,
  Gear,
} from "@phosphor-icons/react";
import * as PhosphorIcons from "@phosphor-icons/react";
import { useAuthStore } from "@/store/auth.store";
import { getDashboardSummaryAction, getCategoriesAction } from "@/lib/action";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { AddTransactionModal } from "./transaction/_components/add-transaction-modal";


// Helper function to render correct icon if needed, or you could use a dynamic icon mapping
// But for now we just show string icon or fallback.

export default function DashboardPage() {
  const { user } = useAuthStore();
  
  // Tránh lỗi hydration mismatch do Zustand persist store lưu ở client
  const [mounted, setMounted] = React.useState(false);
  const [modalType, setModalType] = React.useState<"income" | "expense">("expense");
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading: loading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await getDashboardSummaryAction();
      return res?.data || null;
    }
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await getCategoriesAction();
      return res?.data || [];
    }
  });
  
  const categories = categoriesData?.data || categoriesData || [];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#0ea5e9']; // Fallback colors

  // Custom Tooltip for Recharts Pie
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700">
          <p className="font-semibold text-sm mb-1">{payload[0].name}</p>
          <p className="text-sm font-bold" style={{ color: payload[0].payload.color || payload[0].color }}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 relative">
      {/* Lời chào trên màn hình Desktop */}
      <div className="hidden md:flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
            Chào buổi sáng, {mounted && user?.name ? user.name : "Bạn"}!
          </h2>
          <p className="text-slate-500 mt-1">
            Hôm nay tình hình tài chính của gia đình bạn thế nào?
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button onClick={() => { setModalType("income"); setIsModalOpen(true); }} className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 rounded-xl font-semibold flex items-center gap-2 transition-colors">
            <ArrowUpRight size={18} weight="bold" />
            Thêm Thu
          </button>
          <button onClick={() => { setModalType("expense"); setIsModalOpen(true); }} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 rounded-xl font-semibold flex items-center gap-2 transition-colors">
            <ArrowDownRight size={18} weight="bold" />
            Thêm Chi
          </button>
          {/* NÚT QUẢN LÝ DÀNH RIÊNG CHO CHỦ PHÒNG (PARENT) */}
          {mounted && user?.role === 'parent' && (
            <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-emerald-500/20 active:scale-95 ml-2">
              <Gear size={20} weight="bold" />
              <span>Quản lý phòng</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <>
          {/* HÀNG CÁC THẺ (TOP SUMMARY CARDS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Số dư tổng (To nhất) */}
            <div className="md:col-span-2 bg-linear-to-br from-green-500 to-emerald-700 rounded-2xl p-6 text-white shadow-lg shadow-green-500/20 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Wallet size={120} weight="duotone" />
              </div>
              <div>
                <p className="text-green-100 font-medium text-sm md:text-base">
                  Số dư tài sản
                </p>
                <h3 className="text-3xl md:text-5xl font-bold mt-2 tracking-tight">
                  {formatCurrency(data?.totalBalance ?? 0)}
                </h3>
              </div>

              <div className="flex items-center gap-4 mt-8">
                <div className="bg-white/20 rounded-lg px-3 py-2 flex-1 max-w-[200px]">
                  <p className="text-xs text-green-100">Thu nhập tháng {new Date().getMonth() + 1}</p>
                  <div className="flex items-center gap-1 mt-1 font-semibold text-sm">
                    <ArrowUpRight size={16} /> +{formatCurrency(data?.monthIncome ?? 0)}
                  </div>
                </div>
                <div className="bg-white/20 rounded-lg px-3 py-2 flex-1 max-w-[200px]">
                  <p className="text-xs text-green-100">Chi tiêu tháng {new Date().getMonth() + 1}</p>
                  <div className="flex items-center gap-1 mt-1 font-semibold text-sm text-red-100">
                    <ArrowDownRight size={16} /> -{formatCurrency(data?.monthExpense ?? 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Ví chung Gia đình */}
            <div className="bg-white dark:bg-[#122017] border border-slate-100 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Users size={24} weight="fill" />
                </div>
                <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-md">
                  An tâm
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-6">
                Ví chung Gia đình
              </p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">
                {formatCurrency(data?.totalBalance ?? 0)}
              </h3>
            </div>
          </div>

          {/* CỘT NỘI DUNG DƯỚI (CHART & LỊCH SỬ GIAO DỊCH) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
            {/* BIỂU ĐỒ BẰNG RECHARTS */}
            <div className="bg-white dark:bg-[#122017] border border-slate-100 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">
                Phân bổ chi tiêu (Tháng {new Date().getMonth() + 1})
              </h3>

              {data?.categoryAllocation?.length > 0 ? (
                <>
                  <div className="h-[250px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.categoryAllocation}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="totalAmount"
                          stroke="none"
                        >
                          {data.categoryAllocation.map((entry: any, index: number) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color || COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Chú thích màu sắc */}
                  <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-medium">
                    {data.categoryAllocation.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color || COLORS[i % COLORS.length] }}
                        ></div>
                        {item.name} ({Math.round(item.totalAmount / data.monthExpense * 100)}%)
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-slate-400">
                  Chưa có chi phí nào trong tháng này.
                </div>
              )}
            </div>

            {/* LỊCH SỬ GIAO DỊCH (TRANSACTIONS) */}
            <div className="bg-white dark:bg-[#122017] border border-slate-100 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                  Giao dịch gần đây
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 max-h-[300px]">
                {data?.recentTransactions?.length > 0 ? (
                  data.recentTransactions.map((tx: any, idx: number) => {
                    const isIncome = tx._type === 'income';
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                            style={{ 
                              backgroundColor: `${tx.categoryID?.color || '#8b5cf6'}1A`,
                              color: tx.categoryID?.color || '#8b5cf6' 
                            }}
                          >
                            {(() => {
                              const iconName = tx.categoryID?.icon;
                              const IconComponent = iconName && (PhosphorIcons as any)[iconName] 
                                ? (PhosphorIcons as any)[iconName] 
                                : PhosphorIcons.Star;
                              return <IconComponent size={24} weight="duotone" />;
                            })()}
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-semibold text-slate-800 dark:text-slate-100 truncate w-32 md:w-auto">
                              {tx.description || tx.categoryID?.name || 'Giao dịch'}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {dayjs(tx.date).format("DD/MM/YYYY")}
                            </p>
                          </div>
                        </div>
                        <p className={`font-bold shrink-0 ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                          {isIncome ? '+ ' : '- '}{formatCurrency(tx.amount)}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-slate-500 text-center text-sm py-4">Chưa có giao dịch nào</div>
                )}
              </div>
            </div>
          </div>

          {/* BIỂU ĐỒ XU HƯỚNG 6 THÁNG TỔNG QUAN */}
          <div className="bg-white dark:bg-[#122017] border border-slate-100 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm mt-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6">
              Xu hướng Thu / Chi (6 Tháng gần nhất)
            </h3>
            <div className="h-[300px] w-full">
              {data?.trend?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => {
                      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                      if (val >= 1000) return `${val / 1000}k`;
                      return String(val);
                     }} />
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area type="monotone" dataKey="income" name="Thu Nhập" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="expense" name="Chi Tiêu" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  Chưa có đủ dữ liệu để vẽ biểu đồ
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* MODAL THÊM GIAO DỊCH NHANH */}
      <AddTransactionModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        categories={categories}
        type={modalType}
      />
    </div>
  );
}
