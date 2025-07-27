// src/utils/generar-url.util.ts

/**
 * Genera un código alfanumérico aleatorio de una longitud específica para usar como parte de una URL amigable (slug).
 * @param longitud La longitud del código a generar.
 * @returns Un string con el código aleatorio.
 */
export function generarCodigo(longitud: number): string {
  const caracteres =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let resultado = '';
  const longitudCaracteres = caracteres.length;
  for (let i = 0; i < longitud; i++) {
    resultado += caracteres.charAt(
      Math.floor(Math.random() * longitudCaracteres),
    );
  }
  return resultado;
}