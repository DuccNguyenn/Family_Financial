import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { GetUser } from '@/decorator/get-user.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@GetUser('spaceId') spaceId: string) {
    return this.dashboardService.getSummary(spaceId);
  }
}
