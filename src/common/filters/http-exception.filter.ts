import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { translateValidationMessage } from '../validation/validation-messages.js';

export interface StandardErrorResponse {
  isSuccess: false;
  message: string;
  data: null;
  error: {
    code: string;
    details?: Record<string, unknown>;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;

        // Caso validación (class-validator): message es un array de errores.
        // Lo aplanamos a string legible, agregamos detalles por campo y usamos
        // el código estable VALIDATION_ERROR del contrato (§5.4).
        if (Array.isArray(resp.message)) {
          const validationMessages = resp.message as string[];
          // Traducimos cada mensaje de validación a español
          const translated = validationMessages.map(translateValidationMessage);
          message = translated[0] ?? 'Error de validación';
          errorCode = 'VALIDATION_ERROR';
          details = { fields: translated };
        } else {
          message = (resp.message as string) || exception.message;
          errorCode = (resp.error as string) || exception.name;
          details = resp.details as Record<string, unknown> | undefined;
        }
      } else {
        message = exception.message;
        errorCode = exception.name;
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
      message = 'Error interno del servidor';
      errorCode = 'INTERNAL_SERVER_ERROR';
    }

    const errorResponse: StandardErrorResponse = {
      isSuccess: false,
      message,
      data: null,
      error: {
        code: errorCode,
        details,
      },
    };

    response.status(status).json(errorResponse);
  }
}
