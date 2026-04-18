"use client";

import React, { useState } from "react";
import {
  User,
  LockKey,
  Users,
  ShareNetwork,
  ArrowsClockwise,
  Receipt,
  ChartLineUp,
  Question,
  Info,
  CaretRight,
  Gear,
  GearSix,
  UsersThree,
  Copy,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useQuery } from "@tanstack/react-query";
import { getMySpaceAction } from "@/lib/action";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const SettingsPage = () => {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const { data: space } = useQuery({
    queryKey: ["mySpace"],
    queryFn: async () => {
      const res = await getMySpaceAction();
      if (res.error) return null;
      return res.data;
    },
    enabled: !!user?.spaceId,
  });

  const handleCopyCode = () => {
    if (space?.invitedCode) {
      navigator.clipboard.writeText(space.invitedCode);
      toast.success("Đã sao chép mã mời!");
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-20 md:pb-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-6 md:mb-8 pt-4 flex flex-col items-center text-center md:items-start md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
          Tài Khoản
        </h1>
        <p className="text-slate-500 text-sm md:text-base mt-2">
          Quản lý tài khoản và không gian gia đình
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-[#122017] border border-slate-200 dark:border-slate-800/60 rounded-2xl p-6 mb-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-linear-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl shrink-0 overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-sm">
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt="Avatar" 
                className="w-full h-full object-cover"
              />
            ) : (
              user?.name?.charAt(0).toUpperCase() || "A"
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {user?.name}
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 text-xs font-medium">
                {user?.role === "parent" ? "Chủ hộ" : "Thành viên"}
              </span>
              <span className="text-slate-500 text-sm hidden sm:inline">
                • {user?.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Nhóm: Tài khoản */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">
            Tài khoản & Bảo mật
          </h3>
          <div className="bg-white dark:bg-[#122017] border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm">
            <div
              onClick={() => {
                router.push("/dashboard/settings/profile");
              }}
            >
              <SettingRow icon={<User size={20} />} title="Thông tin cá nhân" />
            </div>
            <div className="h-px bg-slate-100 dark:bg-slate-800/60 ml-12" />
            <div
              onClick={() => {
                router.push("/dashboard/settings/changepassword");
              }}
            >
              <SettingRow icon={<LockKey size={20} />} title="Đổi mật khẩu" />
            </div>
          </div>
        </section>

        {/* Nhóm: Gia đình */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">
            Không gian Gia đình
          </h3>
          <div className="bg-white dark:bg-[#122017] border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm">
            <div
              onClick={() => {
                router.push("/dashboard/settings/categories");
              }}
            >
              <SettingRow
                icon={<UsersThree size={20} />}
                title="Quản lý danh mục"
              />
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800/60 ml-12" />
            <div onClick={() => setIsInviteModalOpen(true)}>
              <SettingRow
                icon={<ShareNetwork size={20} />}
                title="Mã mời gia đình"
              />
            </div>
          </div>
        </section>

        {/* Nhóm: Khác */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">
            Khác
          </h3>
          <div className="bg-white dark:bg-[#122017] border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm">
            <SettingRow
              icon={<Question size={20} />}
              title="Trung tâm trợ giúp"
            />
            <div className="h-px bg-slate-100 dark:bg-slate-800/60 ml-12" />
            <SettingRow
              icon={<Info size={20} />}
              title="Về GiaKế"
              value="Phiên bản 1.0.2"
            />
          </div>
        </section>
      </div>

      {/* Invite Code Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#122017] border-slate-200 dark:border-slate-800 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Mã mời gia đình
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Chia sẻ mã này với người thân để họ có thể tham gia vào không gian
              gia đình của bạn.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <div className="bg-green-50 dark:bg-green-950/30 p-6 rounded-2xl border border-green-100 dark:border-green-800/30 w-full flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-[0.2em]">
                Mã mời hiện tại
              </span>
              <span className="text-4xl font-mono font-black text-slate-900 dark:text-slate-50 tracking-[0.3em]">
                {space?.invitedCode || "------"}
              </span>
            </div>

            <Button
              onClick={handleCopyCode}
              disabled={!space?.invitedCode}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Copy size={20} weight="bold" />
              Sao chép mã mời
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Sub-component for a settings row
const SettingRow = ({
  icon,
  title,
  value,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  value?: string;
  badge?: string;
}) => {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:text-green-600 dark:group-hover:text-green-400 group-hover:bg-green-50 dark:group-hover:bg-green-500/10 transition-colors">
          {icon}
        </div>
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {title}
        </span>
        {badge && (
          <span className="px-2 py-0.5 bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 text-[10px] font-bold rounded-full uppercase tracking-wide">
            {badge}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500">
        {value && <span className="text-sm">{value}</span>}
        <CaretRight
          size={16}
          weight="bold"
          className="group-hover:translate-x-0.5 transition-transform"
        />
      </div>
    </div>
  );
};

export default SettingsPage;
