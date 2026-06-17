import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';

/**
 * Expose le repository User. Le Lot 2 (module Auth) importera ce module pour
 * accéder au repository sans redéclarer l'entité.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  exports: [TypeOrmModule],
})
export class UserModule {}
