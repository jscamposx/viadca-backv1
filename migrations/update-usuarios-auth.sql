-- Migración para actualizar la tabla usuarios con nuevas columnas
-- Ejecutar este script en MySQL

USE viadca_db;

-- Agregar columnas faltantes a la tabla usuarios
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE AFTER correo,
ADD COLUMN IF NOT EXISTS token_verificacion TEXT NULL AFTER email_verificado,
ADD COLUMN IF NOT EXISTS token_recuperacion TEXT NULL AFTER token_verificacion,
ADD COLUMN IF NOT EXISTS token_recuperacion_expira TIMESTAMP NULL AFTER token_recuperacion,
ADD COLUMN IF NOT EXISTS nombre_completo VARCHAR(100) NULL AFTER token_recuperacion_expira;

-- Hacer el campo usuario único si no lo es
ALTER TABLE usuarios 
ADD CONSTRAINT unique_usuario UNIQUE (usuario);

-- Actualizar el enum de roles si es necesario
ALTER TABLE usuarios 
MODIFY COLUMN rol ENUM('admin', 'pre-autorizado', 'usuario') DEFAULT 'pre-autorizado';

-- Agregar índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios(correo);
CREATE INDEX IF NOT EXISTS idx_usuarios_token_verificacion ON usuarios(token_verificacion(100));
CREATE INDEX IF NOT EXISTS idx_usuarios_token_recuperacion ON usuarios(token_recuperacion(100));
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- Marcar usuarios existentes como verificados (opcional)
-- UPDATE usuarios SET email_verificado = TRUE WHERE email_verificado IS NULL;

COMMIT;

-- Verificar la estructura actualizada
DESCRIBE usuarios;
