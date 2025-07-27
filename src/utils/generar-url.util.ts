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
