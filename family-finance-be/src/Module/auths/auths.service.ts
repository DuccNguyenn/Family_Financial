import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { comparePasswordHelper, hashPasswordHelper } from '@/helper/util';
import { MailerService } from '@nestjs-modules/mailer';
import dayjs from 'dayjs';

import {
  Account,
  AccountDocument,
} from '@/Module/account/schema/account.schema';
import { UsersService } from '@/Module/users/users.service';
import {
  CreateAuthDto,
  ForgotPasswordDto,
  ResendCodeDto,
  ResetPasswordDto,
  VerifyAccountDto,
} from '@/Module/auths/dto/create-auth.dto';

@Injectable()
export class AuthsService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  //  Dùng với Passport Local Strategy
  async validateUser(email: string, pass: string): Promise<any> {
    const account = await this.usersService.findAccountByEmail(email);
    if (!account) return null;

    const isValid = await comparePasswordHelper(pass, account.passwordHash);
    if (!isValid) return null;

    // Gộp Account + User → đủ data để tạo JWT
    return this.usersService.getFullProfile(account._id);
  }

  //  Đăng nhập
  async login(profile: any) {
    const payload = {
      sub: profile._id, // User._id
      accountId: profile.accountId, // Account._id
      username: profile.email,
      sysRole: profile.sysRole,
      spaceId: profile.spaceId ?? null,
      role: profile.role ?? null,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      // Trả thêm user info để frontend lưu vào store ngay
      user: {
        _id: profile._id,
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        sysRole: profile.sysRole,
        spaceId: profile.spaceId ?? null,
        role: profile.role ?? null,
      },
    };
  }

  //  Đăng ký
  // Delegate xuống UsersService
  async handleRegister(dto: CreateAuthDto) {
    return this.usersService.handleRegister(dto);
  }

  //  Kích hoạt tài khoản
  // THÊM MỚI: user nhập email + code 6 số nhận từ email
  async verifyAccount(dto: VerifyAccountDto) {
    const account = await this.accountModel.findOne({
      email: dto.email.toLowerCase(),
    });

    if (!account) {
      throw new BadRequestException('Email không tồn tại');
    }
    if (account.is_active) {
      throw new BadRequestException('Tài khoản đã được kích hoạt rồi');
    }
    if (account.code_verification !== dto.code) {
      throw new BadRequestException('Mã xác thực không đúng');
    }
    if (!account.code_expired || account.code_expired < new Date()) {
      throw new BadRequestException(
        'Mã xác thực đã hết hạn. Vui lòng yêu cầu gửi lại.',
      );
    }

    await this.usersService.activateAccount(account._id.toString());

    return { message: 'Kích hoạt tài khoản thành công. Bạn có thể đăng nhập.' };
  }

  //  Gửi lại mã kích hoạt
  // THÊM MỚI
  async resendVerifyCode(dto: ResendCodeDto) {
    return this.usersService.resendVerifyCode(dto.email);
  }

  // ── Quên mật khẩu — gửi mã OTP 6 số về email ──────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const account = await this.accountModel.findOne({
      email: dto.email.toLowerCase(),
    });

    if (!account) {
      // Không tiết lộ email có tồn tại hay không (bảo mật)
      return { message: 'Nếu email tồn tại, mã xác thực đã được gửi.' };
    }

    if (!account.is_active) {
      throw new BadRequestException(
        'Tài khoản chưa được kích hoạt. Vui lòng kích hoạt trước.',
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expired = dayjs().add(5, 'minutes').toDate();

    await this.accountModel.updateOne(
      { _id: account._id },
      { code_verification: code, code_expired: expired },
    );

    // Lấy tên user để hiển thị trong email
    const user = await this.usersService.getFullProfile(account._id);

    try {
      await this.mailerService.sendMail({
        to: account.email,
        subject: 'Đặt lại mật khẩu — GiaKế',
        template: 'reset-password',
        context: { name: user?.name ?? account.email, resetCode: code },
      });
    } catch (err) {
      console.error('Lỗi gửi email đặt lại mật khẩu:', err.message);
    }

    return { message: 'Nếu email tồn tại, mã xác thực đã được gửi.' };
  }

  // ── Đặt lại mật khẩu — xác thực OTP + đổi password ────
  async resetPassword(dto: ResetPasswordDto) {
    const account = await this.accountModel.findOne({
      email: dto.email.toLowerCase(),
    });

    if (!account) {
      throw new BadRequestException('Email không tồn tại');
    }

    if (account.code_verification !== dto.code) {
      throw new BadRequestException('Mã xác thực không đúng');
    }

    if (!account.code_expired || account.code_expired < new Date()) {
      throw new BadRequestException(
        'Mã xác thực đã hết hạn. Vui lòng yêu cầu gửi lại.',
      );
    }

    // Đổi mật khẩu + xóa mã xác thực
    const newHash = await hashPasswordHelper(dto.newPassword);
    await this.accountModel.updateOne(
      { _id: account._id },
      { passwordHash: newHash, code_verification: null, code_expired: null },
    );

    return { message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập.' };
  }
}

