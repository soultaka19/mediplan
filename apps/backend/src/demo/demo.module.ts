import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DemoCleanupService } from './demo-cleanup.service';
import { DemoController } from './demo.controller';
import { DemoService } from './demo.service';

@Module({
  imports: [AuthModule],
  controllers: [DemoController],
  providers: [DemoService, DemoCleanupService],
})
export class DemoModule {}
