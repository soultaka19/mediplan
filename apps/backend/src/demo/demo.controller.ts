import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DemoService } from './demo.service';
import { DemoSession } from './demo.types';

/**
 * Porte d'entrée publique de la démonstration.
 *
 * Aucune garde : c'est précisément le point d'entrée de quelqu'un qui n'a pas
 * de compte. Rien ne lui est demandé — ni adresse courriel, ni mot de passe.
 */
@Controller('demo')
@Throttle({ default: { limit: 3, ttl: 600_000 } })
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Post('sandbox')
  @HttpCode(HttpStatus.CREATED)
  createSandbox(): Promise<DemoSession> {
    return this.demoService.createSandbox();
  }
}
