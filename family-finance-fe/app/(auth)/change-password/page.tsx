"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { sendRequest } from "@/lib/api";
import {
  GiaKeLogo,
  InputField,
  SubmitBtn,
  ErrorAlert,
  SuccessAlert,
  IconLock,
  IconMail,
  IconCheck,
} from "@/components/ui/shared";

const BE = process.env.NEXT_PUBLIC_BE_URL ?? "http://127.0.0.1:8081/api";

// Password strength rules
const pwdRules = (p: string) => [
  { label: "Ít nhất 6 ký tự", ok: p.length >= 6 },
  { label: "Có chữ và số", ok: /[a-zA-Z]/.test(p) && /[0-9]/.test(p) },
];

type Step = "email" | "reset";

export default function ChangePasswordPage() {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Countdown timer cho nút gửi lại ───────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ── Bước 1: Gửi email nhận mã OTP ─────────────────────
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setErrors({});

    if (!email) {
      setErrors({ email: "Vui lòng nhập email" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: "Email không hợp lệ" });
      return;
    }

    setLoading(true);
    try {
      const res = await sendRequest<any>({
        url: `${BE}/auths/forgot-password`,
        method: "POST",
        body: { email },
      });

      if (res?.statusCode && res.statusCode >= 400) {
        setApiError(
          Array.isArray(res.message) ? res.message[0] : res.message,
        );
        return;
      }

      setStep("reset");
      setCountdown(60);
      // Focus ô OTP đầu tiên
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      setApiError("Không thể kết nối tới server. Thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // ── Xử lý nhập OTP 6 ô ────────────────────────────────
  const handleCodeChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return; // chỉ cho nhập số
    const next = [...code];
    next[idx] = val.slice(-1); // lấy ký tự cuối
    setCode(next);
    setErrors((p) => ({ ...p, code: "" }));

    // Auto-focus ô tiếp theo
    if (val && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  // Paste handler: cho phép paste 6 số liền
  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...code];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || "";
    }
    setCode(next);
    // Focus ô cuối cùng đã điền
    const lastIdx = Math.min(pasted.length, 6) - 1;
    inputRefs.current[lastIdx]?.focus();
  };

  // ── Gửi lại mã ────────────────────────────────────────
  const handleResend = async () => {
    if (countdown > 0) return;
    setApiError("");

    try {
      await sendRequest<any>({
        url: `${BE}/auths/forgot-password`,
        method: "POST",
        body: { email },
      });
      setCountdown(60);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {
      setApiError("Không thể gửi lại mã. Thử lại sau.");
    }
  };

  // ── Bước 2: Xác thực OTP + Đổi mật khẩu ──────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    const errs: Record<string, string> = {};
    const codeStr = code.join("");
    if (codeStr.length < 6) errs.code = "Vui lòng nhập đủ 6 số";
    if (!newPassword) errs.newPassword = "Vui lòng nhập mật khẩu mới";
    else if (newPassword.length < 6)
      errs.newPassword = "Mật khẩu mới ít nhất 6 ký tự";
    if (!confirmPassword)
      errs.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    else if (confirmPassword !== newPassword)
      errs.confirmPassword = "Mật khẩu xác nhận không khớp";

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await sendRequest<any>({
        url: `${BE}/auths/reset-password`,
        method: "POST",
        body: { email, code: codeStr, newPassword },
      });

      if (res?.statusCode && res.statusCode >= 400) {
        setApiError(
          Array.isArray(res.message) ? res.message[0] : res.message,
        );
        return;
      }

      setSuccess("Đặt lại mật khẩu thành công!");
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setApiError("Không thể kết nối tới server. Thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const rules = pwdRules(newPassword);

  return (
    <div className="min-h-screen bg-[#f6f8f7] dark:bg-[#0f1a14] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-[#122017] rounded-2xl shadow-2xl shadow-black/10 overflow-hidden">
          {/* Top accent */}
          <div className="h-1.5 bg-[#22C55E]" />

          <div className="px-8 py-10 sm:px-12">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <GiaKeLogo />
            </div>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-[#22C55E]/10 dark:bg-[#22C55E]/20 rounded-2xl flex items-center justify-center">
                {step === "email" ? (
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                ) : (
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    <circle cx="12" cy="16" r="1" fill="#22C55E" />
                  </svg>
                )}
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-7">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {step === "email" ? "Quên mật khẩu" : "Đặt lại mật khẩu"}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                {step === "email"
                  ? "Nhập email để nhận mã xác thực"
                  : `Nhập mã đã gửi đến ${email}`}
              </p>
            </div>

            {/* ─── STEP 1: Nhập email ─────────────────────── */}
            {step === "email" && (
              <form onSubmit={handleSendCode} className="flex flex-col gap-4">
                <InputField
                  label="Email"
                  icon={<IconMail />}
                  type="email"
                  placeholder="Nhập email đã đăng ký"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors({});
                    setApiError("");
                  }}
                  error={errors.email}
                  autoFocus
                />

                {apiError && <ErrorAlert message={apiError} />}

                <SubmitBtn
                  loading={loading}
                  label="Gửi mã xác thực"
                  loadLabel="Đang gửi..."
                  disabled={!email}
                />
              </form>
            )}

            {/* ─── STEP 2: OTP + Mật khẩu mới ────────────── */}
            {step === "reset" && (
              <form
                onSubmit={handleResetPassword}
                className="flex flex-col gap-4"
              >
                {/* OTP Input — 6 ô */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Mã xác thực
                  </label>
                  <div
                    className="flex justify-center gap-2"
                    onPaste={handleCodePaste}
                  >
                    {code.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(idx, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                        className={`
                          w-12 h-14 text-center text-xl font-bold
                          border-2 rounded-xl outline-none transition-all
                          bg-white dark:bg-[#1a2e22]
                          text-slate-900 dark:text-white
                          ${
                            errors.code
                              ? "border-red-400 focus:border-red-500"
                              : digit
                                ? "border-[#22C55E] shadow-sm shadow-[#22C55E]/20"
                                : "border-slate-200 dark:border-slate-600 focus:border-[#22C55E]"
                          }
                          focus:ring-2 focus:ring-[#22C55E]/20
                        `}
                      />
                    ))}
                  </div>
                  {errors.code && (
                    <p className="text-xs text-red-500 mt-1.5 text-center">
                      {errors.code}
                    </p>
                  )}

                  {/* Gửi lại mã + Đếm ngược */}
                  <div className="flex justify-center mt-3">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={countdown > 0}
                      className={`text-xs transition-colors ${
                        countdown > 0
                          ? "text-slate-400 cursor-not-allowed"
                          : "text-[#22C55E] hover:text-[#16A34A] cursor-pointer"
                      }`}
                    >
                      {countdown > 0
                        ? `Gửi lại mã sau ${countdown}s`
                        : "Gửi lại mã xác thực"}
                    </button>
                  </div>
                </div>

                {/* Mật khẩu mới */}
                <div>
                  <InputField
                    label="Mật khẩu mới"
                    icon={<IconLock />}
                    isPassword
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrors((p) => ({ ...p, newPassword: "" }));
                    }}
                    error={errors.newPassword}
                    autoComplete="new-password"
                  />
                  {/* Strength indicator */}
                  {newPassword && (
                    <div className="flex gap-4 mt-2 pl-1">
                      {rules.map((r) => (
                        <div
                          key={r.label}
                          className={`flex items-center gap-1 text-xs transition-colors ${r.ok ? "text-[#22C55E]" : "text-slate-400"}`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${r.ok ? "bg-[#22C55E] text-white" : "bg-slate-200 dark:bg-slate-700"}`}
                          >
                            {r.ok && <IconCheck />}
                          </span>
                          {r.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Xác nhận mật khẩu */}
                <InputField
                  label="Xác nhận mật khẩu mới"
                  icon={<IconLock />}
                  isPassword
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrors((p) => ({ ...p, confirmPassword: "" }));
                  }}
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                />

                {apiError && <ErrorAlert message={apiError} />}
                {success && <SuccessAlert message={success} />}

                {success ? (
                  <div className="h-12 w-full rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                    <svg
                      className="animate-spin w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Đang chuyển sang đăng nhập...
                  </div>
                ) : (
                  <SubmitBtn
                    loading={loading}
                    label="Đặt lại mật khẩu"
                    loadLabel="Đang xử lý..."
                    disabled={
                      code.join("").length < 6 ||
                      !newPassword ||
                      !confirmPassword
                    }
                  />
                )}
              </form>
            )}

            {/* Back + Đổi email */}
            {!success && (
              <div className="text-center mt-5 flex flex-col gap-2">
                {step === "reset" && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setCode(["", "", "", "", "", ""]);
                      setNewPassword("");
                      setConfirmPassword("");
                      setApiError("");
                      setErrors({});
                    }}
                    className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    ← Đổi email khác
                  </button>
                )}
                <Link
                  href="/login"
                  className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  ← Quay lại đăng nhập
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center mt-5">
          <div className="w-28 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>
      </div>
    </div>
  );
}
