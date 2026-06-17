import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Forme normalisée des réponses d'erreur de l'API.
 * Contrat stable pour le frontend (mediplan-angular-frontend).
 */
interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
}

/**
 * Filtre d'exception global : normalise TOUTES les erreurs en un JSON cohérent
 * `{ statusCode, error, message }`, sans fuite d'information sensible.
 *
 * - Les `HttpException` (400/401/403/404/409/423…) conservent leur statut et
 *   leur message applicatif (volontairement génériques côté login pour
 *   l'anti-énumération).
 * - Toute autre erreur inattendue est masquée derrière un 500 générique ;
 *   le détail est journalisé côté serveur, jamais renvoyé au client.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.resolveStatus(exception);
    const { error, message } = this.resolveBody(exception);

    if (status >= 500) {
      // On journalise le détail réel uniquement côté serveur.
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ErrorResponseBody = { statusCode: status, error, message };
    response.status(status).json(body);
  }

  private resolveStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveBody(exception: unknown): {
    error: string;
    message: string | string[];
  } {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        return { error: exception.name, message: res };
      }
      // NestJS renvoie en général { statusCode, message, error }.
      const obj = res as {
        message?: string | string[];
        error?: string;
      };
      return {
        error: obj.error ?? exception.name,
        message: obj.message ?? exception.message,
      };
    }

    // Erreur non maîtrisée : message générique, aucun détail interne exposé.
    return {
      error: 'Internal Server Error',
      message: 'Une erreur interne est survenue.',
    };
  }
}
