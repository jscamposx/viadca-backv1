export const EXCEL_TEMPLATE_CONFIG = {
  colors: {
    primary: '2E5BBA', // Azul principal para títulos
    secondary: '4472C4', // Azul secundario para subtítulos
    accent: 'E7F3FF', // Azul claro para campos
    white: 'FFFFFF', // Blanco para texto
    black: '000000', // Negro para texto normal
  },

  // === CONFIGURACIÓN DE FUENTES ===
  fonts: {
    primary: 'Arial', // Fuente principal
    titleSize: 16, // Tamaño para títulos principales
    subtitleSize: 14, // Tamaño para subtítulos
    contentSize: 11, // Tamaño para contenido
  },

  // === CONFIGURACIÓN DE TEXTO ===
  texts: {
    mainTitle: 'INFORMACIÓN COMPLETA DEL PAQUETE TURÍSTICO',
    sections: {
      basicInfo: 'INFORMACIÓN BÁSICA',
      includes: 'QUÉ INCLUYE',
      notIncludes: 'QUÉ NO INCLUYE',
      requirements: 'REQUISITOS',
      notes: 'NOTAS ADICIONALES',
      destinations: 'DESTINOS DEL VIAJE',
      hotel: 'INFORMACIÓN DEL HOTEL',
      itinerary: 'ITINERARIO DETALLADO',
      wholesalers: 'MAYORISTAS ASOCIADOS',
    },
    labels: {
      codeUrl: 'Código URL',
      title: 'Título del paquete',
      origin: 'Origen',
      originCoords: 'Coordenadas Origen',
      startDate: 'Fecha de Inicio',
      endDate: 'Fecha de Fin',
      duration: 'Duración',
      totalPrice: 'Precio Total',
  flightPrice: 'Precio Vuelo',
  lodgingPrice: 'Precio Hospedaje',
      discount: 'Descuento',
      advance: 'Anticipo',
      status: 'Estado',
      createdAt: 'Fecha de Creación',
      updatedAt: 'Última Actualización',
      hotelName: 'Nombre del Hotel',
      stars: 'Estrellas',
      placeId: 'Place ID',
      customHotel: 'Hotel Personalizado',
      totalRatings: 'Total de Calificaciones',
      destination: 'Destino',
      day: 'Día',
      wholesaler: 'Mayorista',
      // Valores por defecto
      notSpecified: 'No especificado',
      notDefined: 'No definido',
      active: 'Activo',
      inactive: 'Inactivo',
      yes: 'Sí',
      no: 'No',
      days: 'días',
      invalidDate: 'Fecha inválida',
    },
  },

  // === CONFIGURACIÓN DE LAYOUT ===
  layout: {
    columnWidths: {
      field: 25, // Ancho columna de campos
      value: 50, // Ancho columna de valores
    },
    pageSetup: {
      paperSize: 9, // Tamaño de papel (A4)
      orientation: 'portrait', // Orientación
      margins: {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3,
      },
    },
    rowHeights: {
      minimum: 20, // Altura mínima de fila
      lineMultiplier: 15, // Multiplicador por línea de texto
    },
  },

  // === CONFIGURACIÓN DE METADATOS ===
  metadata: {
    creator: 'Viadca Sistema',
    lastModifiedBy: 'Viadca Sistema',
    worksheetName: 'Información del Paquete',
  },

  // === CONFIGURACIÓN DE FORMATO ===
  formatting: {
    locale: 'es-ES', // Locale para formateo de números y fechas
    currency: {
      symbol: '$',
      minimumFractionDigits: 2,
    },
    textWrapThreshold: 80, // Caracteres antes de hacer wrap
  },
} as const;

// Tipo para asegurar que la configuración sea tipada
export type ExcelTemplateConfig = typeof EXCEL_TEMPLATE_CONFIG;
