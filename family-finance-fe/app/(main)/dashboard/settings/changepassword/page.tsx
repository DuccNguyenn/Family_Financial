"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CaretLeft,
  LockKey,
  Eye,
  EyeSlash,
  CheckCircle,
  XCircle,
  ShieldCheck,
  WarningCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { changePasswordAction } from "@/lib/action";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z
      .string()
      .min(6, "Mật khẩu mới phải có ít nhất 6 ký tự")
      .regex(/[A-Z]/, "Cần ít nhất 1 chữ hoa")
      .regex(/[0-9]/, "Cần ít nhất 1 chữ số")
      .regex(/[^A-Za-z0-9]/, "Cần ít nhất 1 ký tự đặc biệt"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

const ChangePasswordPage = () => {
  const router = useRouter();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [strength, setStrength] = useState(0); // 0 to 4

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const newPassword = watch("newPassword", "");

  // Calculate password strength
  useEffect(() => {
    let s = 0;
    if (newPassword.length >= 6) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[0-9]/.test(newPassword)) s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    setStrength(s);
  }, [newPassword]);

  const onSubmit = async (data: PasswordFormValues) => {
    setIsLoading(true);
    try {
      const res = await changePasswordAction(
        data.currentPassword,
        data.newPassword
      );
      if (res?.error) {
        toast.error(res.message || "Đổi mật khẩu thất bại");
      } else {
        toast.success("Đổi mật khẩu thành công!");
        router.push("/dashboard/settings");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại sau");
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthLabel = () => {
    switch (strength) {
      case 0:
        return "Rất yếu";
      case 1:
        return "Yếu";
      case 2:
        return "Trung bình";
      case 3:
        return "Mạnh";
      case 4:
        return "Rất mạnh";
      default:
        return "Yếu";
    }
  };

  const getStrengthColor = () => {
    switch (strength) {
      case 0:
      case 1:
        return "bg-rose-500";
      case 2:
        return "bg-amber-500";
      case 3:
        return "bg-emerald-500";
      case 4:
        return "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]";
      default:
        return "bg-slate-200";
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto pb-20 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-500 hover:text-green-600 transition-colors mb-6 group outline-none"
      >
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-green-50 dark:group-hover:bg-green-900/30 transition-colors">
          <CaretLeft size={18} weight="bold" />
        </div>
        <span className="font-medium">Quay lại</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
            <LockKey size={24} weight="duotone" />
          </div>
          Đổi mật khẩu
        </h1>
        <p className="text-slate-500 text-sm mt-2 ml-13">
          Tạo mật khẩu mới mạnh mẽ để bảo vệ tài khoản của bạn.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-[#122017] border border-slate-200 dark:border-slate-800/60 rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none backdrop-blur-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Current Password */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-slate-600 dark:text-slate-400 ml-1">
              Mật khẩu hiện tại
            </Label>
            <div className="relative group">
              <Input
                {...register("currentPassword")}
                type={showCurrent ? "text" : "password"}
                placeholder="Nhập mật khẩu đang dùng"
                className="h-14 pl-5 pr-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
              >
                {showCurrent ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-rose-500 text-xs mt-1 ml-1 font-medium flex items-center gap-1">
                <WarningCircle size={14} weight="bold" />
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800/60 mx-2" />

          {/* New Password */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-600 dark:text-slate-400 ml-1">
                Mật khẩu mới
              </Label>
              <div className="relative group">
                <Input
                  {...register("newPassword")}
                  type={showNew ? "text" : "password"}
                  placeholder="Chọn mật khẩu mới"
                  className="h-14 pl-5 pr-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                >
                  {showNew ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-rose-500 text-xs mt-1 ml-1 font-medium flex items-center gap-1">
                  <WarningCircle size={14} weight="bold" />
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            {/* Strength Indicator */}
            {newPassword && (
              <div className="space-y-2 px-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Độ mạnh: {getStrengthLabel()}
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 w-8 rounded-full transition-all duration-300 ${
                          i <= strength ? getStrengthColor() : "bg-slate-100 dark:bg-slate-800"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Requirements Checklist */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <RequirementMet met={newPassword.length >= 6} label="Tối thiểu 6 ký tự" />
                  <RequirementMet met={/[A-Z]/.test(newPassword)} label="Có chữ viết hoa" />
                  <RequirementMet met={/[0-9]/.test(newPassword)} label="Có ít nhất 1 số" />
                  <RequirementMet met={/[^A-Za-z0-9]/.test(newPassword)} label="Ký tự đặc biệt" />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-slate-600 dark:text-slate-400 ml-1">
              Xác nhận mật khẩu mới
            </Label>
            <div className="relative group">
              <Input
                {...register("confirmPassword")}
                type={showConfirm ? "text" : "password"}
                placeholder="Nhập lại mật khẩu mới"
                className="h-14 pl-5 pr-12 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
              >
                {showConfirm ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-rose-500 text-xs mt-1 ml-1 font-medium flex items-center gap-1">
                <WarningCircle size={14} weight="bold" />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg shadow-green-500/20 transition-all active:scale-[0.98] mt-4"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Đang xử lý...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} weight="bold" />
                <span>Cập nhật mật khẩu</span>
              </div>
            )}
          </Button>
        </form>
      </div>

      {/* Security Tip */}
      <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
          <ShieldCheck size={20} weight="duotone" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200">Mẹo bảo mật</h4>
          <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1 leading-relaxed">
            Mật khẩu mạnh thường chứa sự kết hợp giữa chữ cái, số và ký tự đặc biệt. Đừng sử dụng các thông tin dễ đoán như ngày sinh hay tên của bạn.
          </p>
        </div>
      </div>
    </div>
  );
};

const RequirementMet = ({ met, label }: { met: boolean; label: string }) => (
  <div className="flex items-center gap-2">
    {met ? (
      <CheckCircle size={16} weight="fill" className="text-emerald-500" />
    ) : (
      <XCircle size={16} weight="bold" className="text-slate-300 dark:text-slate-700" />
    )}
    <span className={`text-[11px] font-medium ${met ? "text-slate-700 dark:text-slate-200" : "text-slate-400"}`}>
      {label}
    </span>
  </div>
);

export default ChangePasswordPage;
