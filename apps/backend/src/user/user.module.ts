import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentSlot } from '../appointment/appointment-slot.entity';
import { Appointment } from '../appointment/appointment.entity';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * Expose le repository User et les endpoints utilisateurs (MEDIPLAN-17).
 * Le module Auth importe ce module pour accéder au repository sans redéclarer
 * l'entité ; l'export de `TypeOrmModule` reste donc en place.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, Appointment, AppointmentSlot])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [TypeOrmModule, UsersService],
})
export class UserModule {}
