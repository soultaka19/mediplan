import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../user/user-role.enum';
import { ClinicService } from './clinic.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';

@Controller('clinics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClinicController {
  constructor(private readonly clinicService: ClinicService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateClinicDto) {
    return this.clinicService.create(dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  findAll() {
    return this.clinicService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.clinicService.findOneScoped(user, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateClinicDto) {
    return this.clinicService.update(id, dto);
  }
}
