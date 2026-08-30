import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentSlot } from './appointment-slot.entity';
import { Appointment } from './appointment.entity';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { UserModule } from '../user/user.module';
import { NotificationsModule } from '../notification/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, AppointmentSlot]),
    UserModule,
    NotificationsModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
