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

      
          const dangerousPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
            /(;|\|\||&&|\|\&)/,
            /(\-\-|\/\*|\*\/)/,
            /(\'|\"|\`)/g,
            /(\bOR\b|\bAND\b).*(\=|\>|\<)/i,
            /(script|javascript|vbscript|onload|onerror)/i,
            /(\<|\>|\%3C|\%3E)/,
            /(eval|exec|system|cmd)/i,
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
          return `${args.property} contiene contenido HTML o JavaScript no permitido`;
        },
      },
    });
  };
}
