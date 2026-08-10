import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentSlot } from '../appointment/appointment-slot.entity';
import { Appointment } from '../appointment/appointment.entity';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, AppointmentSlot])],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
