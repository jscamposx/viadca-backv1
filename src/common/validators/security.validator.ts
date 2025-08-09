import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsNoSQLInjection(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNoSQLInjection',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return true;

          try {
            const url = new URL(value);
            if (url.protocol === 'http:' || url.protocol === 'https:') {
              const urlSqlPatterns = [
                /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
                /(;[\s]*\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
                /(\-\-[\s]*\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
              ];
              return !urlSqlPatterns.some((pattern) => pattern.test(value));
            }
          } catch (e) {}

          const dangerousPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
            /(;|\|\||&&)[\s]*\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b/i,
            /(\-\-|\/\*|\*\/)[\s]*\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b/i,
            /(\'|\"|\`)[\s]*\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b/i,
            /(\bOR\b|\bAND\b).*(\=|\>|\<).*\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b/i,
            /(script|javascript|vbscript)[\s]*:/i,
            /(eval|exec|system|cmd)[\s]*\(/i,
          ];

          return !dangerousPatterns.some((pattern) => pattern.test(value));
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} contiene caracteres o patrones no permitidos por seguridad`;
        },
      },
    });
  };
}

export function IsCleanText(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isCleanText',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return true;

          try {
            const url = new URL(value);

            if (url.protocol === 'http:' || url.protocol === 'https:') {
              const urlDangerousPatterns = [
                /javascript:/gi,
                /vbscript:/gi,
                /data:text\/html/gi,
                /data:application\/javascript/gi,
                /<script/gi,
                /<iframe/gi,
                /<object/gi,
                /<embed/gi,
              ];
              return !urlDangerousPatterns.some((pattern) =>
                pattern.test(value),
              );
            }
          } catch (e) {}

          const cleanPatterns = [
            /\<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /\<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
            /\<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
            /\<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
            /\<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
            /\<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
            /javascript:/gi,
            /vbscript:/gi,
            /data:/gi,
            /on\w+\s*=/gi,
          ];

          return !cleanPatterns.some((pattern) => pattern.test(value));
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} contiene contenido no válido`;
        },
      },
    });
  };
}
