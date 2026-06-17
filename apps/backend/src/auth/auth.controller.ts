import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResponse } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/**
 * Endpoints d'authentification, exposés sous le préfixe global `/api/v1`.
 *
 * - POST /api/v1/auth/register : inscription patient (201).
 * - POST /api/v1/auth/login    : connexion, renvoie un JWT (200).
 *
 * La validation des entrées est assurée par le ValidationPipe global
 * (`whitelist`, `forbidNonWhitelisted`, `transform`) appliqué aux DTO.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Inscription d'un patient. Renvoie l'utilisateur public + un access token
   * pour permettre une connexion immédiate côté client.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  /** Connexion par e-mail + mot de passe. */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }
}
