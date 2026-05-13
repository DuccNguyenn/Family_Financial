import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

//POST /auths/register
export class CreateAuthDto {
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu có ít nhất 6 ký tự' })
  @MaxLength(50, { message: 'Mật khẩu tối đa 50 ký tự' })
  password: string;

  @IsNotEmpty({ message: 'Tên không được để trống' })
  @IsString()
  @MaxLength(50, { message: 'Tên tối đa 50 ký tự' })
  name: string;
}

//POST /auths/verify-account
export class VerifyAccountDto {
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsNotEmpty({ message: 'Mã xác thực không được để trống' })
  @IsString()
  code: string;
}

//POST /auths/resend-code
export class ResendCodeDto {
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
}

// ── PATCH /users/me/password ──────────────────────────────
// THÊM MỚI: đổi mật khẩu khi đang đăng nhập
export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống' })
  @IsString()
  currentPassword: string;

  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(6, { message: 'Mật khẩu mới có ít nhất 6 ký tự' })
  @MaxLength(50)
  newPassword: string;
}

// ── POST /auths/forgot-password ──────────────────────────
// Gửi mã OTP 6 số về email để đặt lại mật khẩu
export class ForgotPasswordDto {
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
}

// ── POST /auths/reset-password ──────────────────────────
// Xác thực mã OTP + đặt mật khẩu mới
export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsNotEmpty({ message: 'Mã xác thực không được để trống' })
  @IsString()
  code: string;

  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(6, { message: 'Mật khẩu mới có ít nhất 6 ký tự' })
  @MaxLength(50)
  newPassword: string;
}
