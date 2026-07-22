import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../user/user-role.enum';
import { AppointmentsService } from './appointments.service';
import { AppointmentResponse } from './dto/appointment-response.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateReceptionAppointmentDto } from './dto/create-reception-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

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

  @Get('today')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR, UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  findToday(@CurrentUser() user: AuthenticatedUser): Promise<AppointmentResponse[]> {
    return this.appointmentsService.findToday(user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR, UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<AppointmentResponse[]> {
    return this.appointmentsService.findAll(user);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR, UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ): Promise<AppointmentResponse> {
    return this.appointmentsService.updateStatus(user, id, dto);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
  ): Promise<AppointmentResponse> {
    return this.appointmentsService.cancel(user, id, dto);
  }
}
