"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CaretLeft, Camera, User } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { updateProfileAction } from "@/lib/action";
import Image from "next/image";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const profileSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự."),
  email: z.string().email("Email không hợp lệ."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAvatarDirty, setIsAvatarDirty] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  // Load user data into form when available
  useEffect(() => {
    if (user) {
      reset({
        name: (user as any)?.name || (user as any)?.fullName || "",
        email: (user as any)?.email || "",
      });
      if ((user as any)?.avatar) {
        setPreviewUrl((user as any).avatar);
      }
    }
  }, [user, reset]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File quá lớn", {
          description: "Vui lòng chọn ảnh có kích thước dưới 2MB.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarBase64(base64String);
        setPreviewUrl(base64String);
        setIsAvatarDirty(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // Call the real API Server Action
      const res = await updateProfileAction({
        name: data.name,
        avatar: avatarBase64 || (user as any)?.avatar || "", 
      });

      // Handle typical backend response objects
      if (res?.statusCode === 200 || res?.statusCode === 201 || !res?.error) {
        // Update local store payload safely
        setUser({ 
          ...user, 
          name: data.name,
          avatar: avatarBase64 || (user as any)?.avatar
        } as any);
        
        toast.success("Cập nhật thành công!", {
          description: "Thông tin cá nhân của bạn đã được cập nhật.",
        });
        router.push("/dashboard/settings");
      } else {
        toast.error("Lỗi cập nhật", {
          description: res?.message || "Đã xảy ra lỗi từ hệ thống.",
        });
      }
    } catch (error) {
      toast.error("Lỗi hệ thống", {
        description: "Không thể kết nối đến máy chủ. Vui lòng thử lại sau.",
      });
    }
  };

  const currentName = watch("name");
  const initialLetter = currentName ? currentName.charAt(0).toUpperCase() : "U";

  return (
    <div className="w-full max-w-2xl mx-auto pb-20 md:pb-8 animate-in slide-in-from-right-4 duration-500">
      {/* Header with Back Button */}
      <div className="mb-8 pt-4 flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <CaretLeft size={24} weight="bold" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Thông tin cá nhân
          </h1>
          <p className="text-slate-500 text-sm md:text-base mt-1">
            Cập nhật ảnh đại diện và chi tiết liên hệ
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#122017] border border-slate-200 dark:border-slate-800/60 rounded-[2rem] p-6 md:p-10 shadow-sm mx-4 md:mx-0">
        
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-10">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <div className="w-32 h-32 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-300 font-bold text-4xl border-4 border-white dark:border-[#122017] shadow-md transition-transform duration-300 group-hover:scale-105 overflow-hidden">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Avatar Preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                initialLetter
              )}
            </div>
            <div className="absolute bottom-1 right-1 w-10 h-10 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full flex items-center justify-center border-4 border-white dark:border-[#122017] shadow-sm group-hover:bg-green-600 dark:group-hover:bg-green-500 transition-colors">
              <Camera size={18} weight="fill" />
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 mt-4 uppercase tracking-[0.2em] group-hover:text-green-500 transition-colors">
            Thay đổi ảnh
          </span>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700 dark:text-slate-300 font-medium">Họ và tên</Label>
            <Input 
              id="name"
              placeholder="Nhập họ và tên của bạn" 
              {...register("name")}
              className={`h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-green-500 transition-all font-medium ${errors.name ? "border-red-500" : ""}`}
            />
            {errors.name && (
              <p className="text-sm text-red-500 font-medium mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">Địa chỉ Email</Label>
            <Input 
              id="email"
              placeholder="email@example.com" 
              type="email"
              disabled={true}
              {...register("email")}
              className={`h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-green-500 transition-all font-medium text-slate-500 cursor-not-allowed`}
            />
            {errors.email && (
              <p className="text-sm text-red-500 font-medium mt-1">{errors.email.message}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">Email không thể thay đổi vào lúc này.</p>
          </div>

          <div className="pt-8 border-t border-slate-100 dark:border-slate-800/60 flex flex-col-reverse md:flex-row gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              className="flex-1 h-12 rounded-xl text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
            >
              Trở về
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || (!isDirty && !isAvatarDirty)}
              className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}