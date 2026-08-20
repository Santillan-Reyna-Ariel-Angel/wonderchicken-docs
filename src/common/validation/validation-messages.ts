/**
 * Traducción de mensajes de validación de class-validator a español.
 *
 * class-validator genera mensajes en inglés con un formato estándar:
 *   "{property} must be one of the following values: A, B, C"
 *   "{property} must be longer than or equal to {n} characters"
 *
 * Este mapa centraliza la traducción para que el HttpExceptionFilter
 * devuelva mensajes legibles para el usuario final.
 *
 * NOTA: Solo cubrimos los casos más comunes. Si a futuro aparece un
 * mensaje sin traducción, se agrega su patrón acá (fallback: inglés).
 */

interface ValidationRule {
  pattern: RegExp;
  /** Función que arma el mensaje en español a partir de los grupos capturados */
  build: (groups: string[]) => string;
}

const VALIDATION_TRANSLATIONS: ValidationRule[] = [
  {
    // "role must be one of the following values: SUPER_ADMIN, ADMIN"
    pattern: /^(\w+) must be one of the following values: (.+)$/,
    build: ([, field, values]) =>
      `El campo ${field} debe ser uno de los siguientes valores: ${values}`,
  },
  {
    // "name should not be empty"
    pattern: /^(\w+) should not be empty$/,
    build: ([, field]) => `El campo ${field} no debe estar vacío`,
  },
  {
    // "name must not be empty"
    pattern: /^(\w+) must not be empty$/,
    build: ([, field]) => `El campo ${field} no debe estar vacío`,
  },
  {
    // "name must be a string"
    pattern: /^(\w+) must be a string$/,
    build: ([, field]) => `El campo ${field} debe ser un texto`,
  },
  {
    // "password must be longer than or equal to 6 characters"
    pattern: /^(\w+) must be longer than or equal to (\d+) characters$/,
    build: ([, field, count]) =>
      `El campo ${field} debe tener al menos ${count} ${count === '1' ? 'carácter' : 'caracteres'}`,
  },
  {
    // "password must be shorter than or equal to 20 characters"
    pattern: /^(\w+) must be shorter than or equal to (\d+) characters$/,
    build: ([, field, count]) =>
      `El campo ${field} debe tener como máximo ${count} ${count === '1' ? 'carácter' : 'caracteres'}`,
  },
  {
    // "branchId must be a UUID"
    pattern: /^(\w+) must be a UUID$/,
    build: ([, field]) => `El campo ${field} debe ser un UUID válido`,
  },
  {
    // "active must be a boolean value"
    pattern: /^(\w+) must be a boolean value$/,
    build: ([, field]) => `El campo ${field} debe ser un valor booleano`,
  },
  {
    // "email must be an email"
    pattern: /^(\w+) must be an email$/,
    build: ([, field]) => `El campo ${field} debe ser un email válido`,
  },
  {
    // "phone must be a valid phone number"
    pattern: /^(\w+) must be a valid phone number$/,
    build: ([, field]) => `El campo ${field} debe ser un teléfono válido`,
  },
  {
    // "price must be a number conforming to the specified constraints"
    pattern: /^(\w+) must be a number conforming to the specified constraints$/,
    build: ([, field]) => `El campo ${field} debe ser un número válido`,
  },
  {
    // "price must be a positive number"
    pattern: /^(\w+) must be a positive number$/,
    build: ([, field]) => `El campo ${field} debe ser un número positivo`,
  },
  {
    // "date must be a valid date"
    pattern: /^(\w+) must be a valid date$/,
    build: ([, field]) => `El campo ${field} debe ser una fecha válida`,
  },
  {
    // "role must be a valid enum value"
    pattern: /^(\w+) must be a valid enum value$/,
    build: ([, field]) => `El campo ${field} debe ser un valor válido`,
  },
];

/**
 * Traduce un mensaje de validación de class-validator a español.
 * Si no hay traducción conocida, devuelve el mensaje original.
 */
export function translateValidationMessage(message: string): string {
  for (const { pattern, build } of VALIDATION_TRANSLATIONS) {
    const match = message.match(pattern);
    if (match) {
      return build(match);
    }
  }
  return message;
}
