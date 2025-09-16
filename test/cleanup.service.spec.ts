import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CleanupService } from '../src/common/services/cleanup.service';
import { CloudinaryService } from '../src/cloudinary/cloudinary.service';
import { Paquete } from '../src/paquetes/entidades/paquete.entity';
import { Usuario } from '../src/entities/usuario.entity';
import { Mayoristas } from '../src/entities/mayoristas.entity';
import { Imagen } from '../src/entities/imagen.entity';

/**
 * Archivo de prueba para el sistema de limpieza
 *
 * Para ejecutar las pruebas:
 * npm test -- cleanup.service.spec.ts
 *
 * O para probar manualmente:
 * 1. Ejecutar la aplicación en modo desarrollo
 * 2. Usar los endpoints de administración
 */

describe('CleanupService', () => {
  let service: CleanupService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        // Para pruebas reales necesitarías configurar una BD de prueba
        // TypeOrmModule.forRoot({...}),
        // TypeOrmModule.forFeature([Paquete, Usuario, Mayoristas, Imagen]),
      ],
      providers: [
        CleanupService,
        {
          provide: CloudinaryService,
          useValue: {
            deleteFile: jest.fn(),
          },
        },
        // Mocks de repositorios para pruebas unitarias
        {
          provide: 'PaqueteRepository',
          useValue: {
            createQueryBuilder: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: 'UsuarioRepository',
          useValue: {
            createQueryBuilder: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: 'MayoristasRepository',
          useValue: {
            createQueryBuilder: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: 'ImagenRepository',
          useValue: {
            createQueryBuilder: jest.fn(),
            count: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CleanupService>(CleanupService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have cleanup configuration', () => {
    expect(service).toHaveProperty('config');
    // Verificar que tiene la configuración por defecto
  });

  // Agregar más pruebas según necesidades
});

/**
 * Ejemplos de uso manual
 */

// Ejemplo 1: Verificar estadísticas
// GET /admin/cleanup/stats

// Ejemplo 2: Ejecutar limpieza manual
// POST /admin/cleanup/run

// Ejemplo 3: Solo eliminar registros expirados
// POST /admin/cleanup/hard-delete

// Ejemplo 4: Solo limpiar imágenes huérfanas
// POST /admin/cleanup/cleanup-images
