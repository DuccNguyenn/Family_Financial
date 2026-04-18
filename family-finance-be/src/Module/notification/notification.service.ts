import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationType } from './schema/notification.schema';
import { MailerService } from '@nestjs-modules/mailer';
import { Space } from '@/Module/space/schema/space.schema';
import { User } from '@/Module/users/schema/user.shcema';
import { Account } from '@/Module/account/schema/account.schema';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    @InjectModel(Space.name) private spaceModel: Model<Space>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Account.name) private accountModel: Model<Account>,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Tạo cảnh báo và gửi email không đồng bộ (non-blocking)
   */
  async triggerBudgetAlert(
    spaceId: string,
    categoryName: string,
    percentage: number,
    spentAmount: number,
    limitAmount: number,
  ) {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      // Ràng buộc chống Spam: Check xem trong tháng này CÙNG category này đã được báo hay chưa?
      // Bằng cách search Notification Title theo pattern.
      // Dùng regex để check title có chứa tên category không (Đây là cách đơn giản nhất)
      const existingAlert = await this.notificationModel.findOne({
        spaceId: new Types.ObjectId(spaceId),
        title: { $regex: categoryName, $options: 'i' },
        createdAt: {
          $gte: new Date(year, month - 1, 1),
          $lte: new Date(year, month, 0, 23, 59, 59),
        },
      });

      if (existingAlert) {
        // Đã gửi email và cảnh báo rồi => Bỏ qua để chống Spam
        return;
      }

      // Lưu cảnh báo vào database
      await this.notificationModel.create({
        spaceId: new Types.ObjectId(spaceId),
        title: `⚠️ Ngân sách ${categoryName} vượt ngưỡng ${percentage}%`,
        message: `Đã chi: ${spentAmount.toLocaleString('vi-VN')} / ${limitAmount.toLocaleString('vi-VN')} VNĐ`,
        type: NotificationType.WARNING,
        actionLink: '/dashboard',
      });

      // Gửi Email không đồng bộ (Chạy ngầm)
      this.sendAlertEmails(
        spaceId,
        categoryName,
        percentage,
        spentAmount,
        limitAmount,
      ).catch((e) => {
        this.logger.error('Failed to send budget alert email: ' + e.message);
      });
    } catch (error) {
      this.logger.error('Error triggering budget alert: ' + error.message);
    }
  }

  private async sendAlertEmails(
    spaceId: string,
    categoryName: string,
    percentage: number,
    spentAmount: number,
    limitAmount: number,
  ) {
    // Tìm Space để lấy tên phòng và ids thành viên
    const space = await this.spaceModel.findById(spaceId).lean();
    if (!space || !space.membersId || space.membersId.length === 0) return;

    // Lấy thông tin user để có accountId
    const users = await this.userModel
      .find({ _id: { $in: space.membersId } })
      .lean();
    const accountIds = users.filter((u) => u.accountId).map((u) => u.accountId);

    if (accountIds.length === 0) return;

    // Lấy ra email các account
    const accounts = await this.accountModel
      .find({ _id: { $in: accountIds } })
      .lean();
    const emails = accounts.map((a) => a.email).filter(Boolean);

    if (emails.length === 0) return;

    // Gửi email hàng loạt (Sử dụng bcc hoặc vòng lặp. Dùng sendMail đến từng email hoặc array To)
    const context = {
      spaceName: space.name,
      categoryName,
      percentage: Math.round(percentage),
      spentAmount: spentAmount.toLocaleString('vi-VN'),
      limitAmount: limitAmount.toLocaleString('vi-VN'),
      appUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    };

    await this.mailerService.sendMail({
      to: emails,
      subject: `[CẢNH BÁO] Ngân sách ${categoryName} chạm ${Math.round(percentage)}%`,
      template: './budget-alert',
      context,
    });

    this.logger.log(
      `Sent budget alert email for category ${categoryName} to ${emails.length} users.`,
    );
  }

  // Get notifications cho giao diện UI
  async getNotificationsBySpace(spaceId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [result, total] = await Promise.all([
      this.notificationModel
        .find({ spaceId: new Types.ObjectId(spaceId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments({
        spaceId: new Types.ObjectId(spaceId),
      }),
    ]);

    return {
      data: result,
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(id: string, userId: string) {
    return this.notificationModel.findByIdAndUpdate(
      id,
      { $addToSet: { isRead: new Types.ObjectId(userId) } },
      { new: true },
    );
  }
}
