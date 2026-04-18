import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { GetUser } from '@/decorator/get-user.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@GetUser() user: any) {
    return this.dashboardService.getSummary(
      user?.spaceId,
      user?._id?.toString(),
      user?.role,
    );
  }
}
