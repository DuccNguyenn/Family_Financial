"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  ChartPieSlice,
  Wallet,
  Gear,
  Users,
  Receipt,
  Plus,
  SignOut,
  GearSix,
} from "@phosphor-icons/react";
import { toast } from "sonner";

const navItems = [
  { name: "Trang chủ", href: "/dashboard", icon: <House size={24} /> },
  {
    name: "Giao dịch",
    href: "/dashboard/transactions",
    icon: <Receipt size={24} />,
  },
  { name: "Ngân sách", href: "/dashboard/budget", icon: <Wallet size={24} /> },
  {
    name: "Báo cáo",
    href: "/dashboard/reports",
    icon: <ChartPieSlice size={24} />,
  },
  {
    name: "Thành viên",
    href: "/members",
    icon: <Users size={24} />,
    desktopOnly: true,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        desktopRef.current &&
        !desktopRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
      if (
        mobileRef.current &&
        !mobileRef.current.contains(event.target as Node)
      ) {
        setShowMobileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0A100D] text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-[#122017] border-r border-slate-200 dark:border-slate-800/60 z-10">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-green-600 dark:text-green-500">
            GiaKế
          </h1>
        </div>

        <div className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
          {navItems
            .filter((i) => !i.mobileOnly)
            .map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    active
                      ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
        </div>

        <div
          className="relative p-4 border-t border-slate-200 dark:border-slate-800/50"
          ref={desktopRef}
        >
          {/* DROPDOWN MENU - DESKTOP */}
          <div
            className={`absolute bottom-full left-4 mb-2 w-56 bg-white dark:bg-[#122017] border border-slate-200 dark:border-slate-800/60 rounded-xl shadow-lg z-50 overflow-hidden text-sm transition-all duration-200 origin-bottom-left ${showDropdown ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
          >
            <div className="p-3 text-slate-500 text-xs font-medium border-b border-slate-100 dark:border-slate-800/60">
              Tài khoản
            </div>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <GearSix size={20} />
              <span>Cài đặt cá nhân</span>
            </Link>
            <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />
            <button
              onClick={() => {
                toast.success("Đang xử lý đăng xuất...", {
                  description: "Hẹn gặp lại bạn sớm nhé!",
                });
                setShowDropdown(false);
              }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 w-full text-left transition-colors font-medium"
            >
              <SignOut size={20} />
              <span>Đăng xuất</span>
            </button>
          </div>

          {/* AVATAR CLICK AREA */}
          <div
            className="flex items-center gap-3 cursor-pointer p-2 -m-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors select-none"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-300 font-bold">
              A
            </div>
            <div>
              <div className="font-semibold text-sm">Nguyễn An</div>
              <div className="text-xs text-slate-500">Chủ hộ</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER (Chỉ hiện trên Mobile) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#122017] border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between px-4 z-20">
        <h1 className="text-xl font-bold text-green-600 dark:text-green-500">
          GiaKế
        </h1>

        {/* MOBILE DROPDOWN CONTAINER */}
        <div className="relative" ref={mobileRef}>
          <div
            className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-300 font-bold text-sm cursor-pointer border border-green-200 dark:border-green-800 active:scale-95 transition-transform"
            onClick={() => setShowMobileDropdown(!showMobileDropdown)}
          >
            A
          </div>

          {/* DROPDOWN MENU - MOBILE */}
          <div
            className={`absolute top-full right-0 mt-3 w-48 bg-white dark:bg-[#122017] border border-slate-200 dark:border-slate-800/60 rounded-xl shadow-lg z-50 overflow-hidden text-sm transition-all duration-200 origin-top-right ${showMobileDropdown ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
          >
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <GearSix size={20} />
              <span>Cài đặt</span>
            </Link>
            <div className="h-px bg-slate-100 dark:bg-slate-800/60 w-full" />
            <button
              onClick={() => {
                toast.success("Đang xử lý đăng xuất...", {
                  description: "Hẹn gặp lại bạn sớm nhé!",
                });
                setShowMobileDropdown(false);
              }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 w-full text-left transition-colors font-medium"
            >
              <SignOut size={20} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col pt-16 md:pt-0 pb-16 md:pb-0 h-full overflow-y-auto">
        {children}
      </main>

      {/* MOBILE BOTTOM NAV (Chỉ hiện trên Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-[#122017] border-t border-slate-200 dark:border-slate-800/60 z-20 flex justify-around items-center px-2 pb-safe">
        {/* Nút bấm Trái (Trang chủ, Giao dịch) */}
        {navItems
          .filter((i) => !i.desktopOnly)
          .slice(0, 2)
          .map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                  active
                    ? "text-green-600 dark:text-green-400"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <div
                  className={`${active ? "scale-110" : "scale-100"} transition-transform duration-200`}
                >
                  {item.icon}
                </div>
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}

        {/* Nút bấm ở Giữa: Dấu Cộng Nổi Bật Dùng Để Thêm Nhanh (Add) */}
        <button className="flex items-center justify-center -mt-8 w-14 h-14 bg-green-500 text-white rounded-full shadow-lg shadow-green-500/30 hover:bg-green-600 transition-transform active:scale-95 z-30">
          <Plus size={28} weight="bold" />
        </button>

        {/* Nút bấm Phải (Báo cáo, Cài đặt) */}
        {navItems
          .filter((i) => !i.desktopOnly)
          .slice(2, 4)
          .map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                  active
                    ? "text-green-600 dark:text-green-400"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <div
                  className={`${active ? "scale-110" : "scale-100"} transition-transform duration-200`}
                >
                  {item.icon}
                </div>
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
      </nav>
    </div>
  );
}
