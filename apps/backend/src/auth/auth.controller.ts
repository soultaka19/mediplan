import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthResponse } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

/**
 * Endpoints d'authentification, exposés sous le préfixe global `/api/v1`.
 *
 * - POST /api/v1/auth/register        : inscription patient (201).
 * - POST /api/v1/auth/login           : connexion, renvoie un JWT (200) ; 423 si verrouillé.
 * - POST /api/v1/auth/forgot-password : demande de réinitialisation (202, toujours neutre).
 * - POST /api/v1/auth/reset-password  : réinitialisation effective (200) ; 400 si jeton invalide.
 *
 * La validation des entrées est assurée par le ValidationPipe global
 * (`whitelist`, `forbidNonWhitelisted`, `transform`) appliqué aux DTO.
 *
 * Limite de débit : 20 requêtes par minute et par adresse IP, pour chacun de
 * ces endpoints (429 au-delà, plus strict que la limite globale). Complète le
 * verrouillage de compte, qui est par compte et non par IP : il freine la force
 * brute et les verrouillages en masse, que rien ne ralentissait auparavant.
 */
@Controller('auth')
@Throttle({ default: { limit: 20, ttl: 60_000 } })
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

  /** Connexion par e-mail + mot de passe. 423 si le compte est temporairement verrouillé. */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  /**
   * Demande de réinitialisation. Renvoie TOUJOURS 202 avec un message neutre
   * (anti-énumération), que le compte existe ou non. Aucun jeton dans la réponse.
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.authService.forgotPassword(dto);
  }

  /** Réinitialisation effective via jeton. 400 si le jeton est invalide ou expiré. */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(dto);
  }
}
