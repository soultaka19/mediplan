import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../user/user-role.enum';
import { StatisticsQueryDto } from './dto/statistics-query.dto';
import { StatisticsResponse } from './dto/statistics-response.dto';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('activity')
  getActivityStatistics(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: StatisticsQueryDto,
  ): Promise<StatisticsResponse> {
    return this.statisticsService.getActivityStatistics(user, query);
  }
}
