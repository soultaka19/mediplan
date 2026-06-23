import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../user/user-role.enum';
import { AppointmentsService } from './appointments.service';
import { AppointmentResponse } from './dto/appointment-response.dto';
import { CreateReceptionAppointmentDto } from './dto/create-reception-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post('reception')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  createByReception(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReceptionAppointmentDto,
  ): Promise<AppointmentResponse> {
    return this.appointmentsService.createByReception(user, dto);
  }
}
