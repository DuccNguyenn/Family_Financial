import { Controller, Get, Query, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @Request() req: any,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const spaceId = req.user.spaceId;
    return this.notificationService.getNotificationsBySpace(
      spaceId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }
}
