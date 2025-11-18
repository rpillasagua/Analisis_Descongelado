# Sistema de Análisis de Descongelado - Aquagold

Sistema web para la gestión y análisis de calidad en el proceso de descongelado de productos marinos.

## 🎯 Características Principales

- **Análisis por Tipo de Producto**: Entero, Cola, Valor Agregado
- **Captura de Datos**: Pesos, uniformidad, conteo, defectos específicos
- **Fotografías**: Almacenamiento en Google Drive con estructura organizada
- **Sistema de Turnos**: Asignación automática (Día: 7:10 AM - 7:10 PM, Noche: 7:10 PM - 7:10 AM)
- **Reportes**: Generación de reportes diarios en Excel agrupados por turno
- **Dashboard Dinámico**: Vista de análisis con búsqueda y filtros

## 📋 Requisitos

- Node.js 18+ 
- Firebase (Firestore)
- Google Drive API
- npm o yarn

## 🚀 Instalación

1. **Clonar el repositorio:**
```bash
git clone https://github.com/rpillasagua/Analisis_Descongelado.git
cd Analisis_Descongelado
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
```bash
copy .env.local.example .env.local
```

Edita `.env.local` con tus credenciales:
- Firebase (Firestore para almacenar datos)
- Google Drive API (para almacenar fotos)

4. **Iniciar en desarrollo:**
```bash
npm run dev
```

La aplicación estará disponible en http://localhost:3000

## 🔧 Configuración

### Firebase (Firestore)

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita Firestore Database
3. Configura las reglas de seguridad:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /quality_analyses/{analysisId} {
      allow read, write: if request.auth != null;
    }
  }
}
```
4. Crea índices compuestos:
   - `date` (Ascending) + `createdAt` (Descending)
   - `date` (Ascending) + `shift` (Ascending) + `createdAt` (Descending)

### Google Drive API

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto nuevo
3. Habilita Google Drive API
4. Crea credenciales OAuth 2.0
5. Configura orígenes autorizados
6. Copia API Key y Client ID a `.env.local`

**Nota:** La carpeta "descongelado" se creará automáticamente en tu Google Drive la primera vez que uses el sistema.

## 📁 Estructura del Proyecto

```
├── app/
│   ├── dashboard/
│   │   ├── tests/new/          # Formulario de nuevo análisis
│   │   └── analysis/edit/      # Edición de análisis
│   └── page.tsx                # Página principal
├── components/
│   ├── AnalysisDashboard.tsx   # Dashboard principal
│   ├── ProductTypeSelector.tsx # Selector de tipo de producto
│   ├── PhotoCapture.tsx        # Captura de fotos
│   └── DailyReportModalNew.tsx # Reporte diario
├── lib/
│   ├── types.ts                # Tipos de datos
│   ├── utils.ts                # Utilidades
│   ├── analysisService.ts      # Servicio de Firestore
│   └── googleDriveService.ts   # Servicio de Google Drive
└── public/                     # Recursos estáticos
```

## 📊 Flujo de Trabajo

### Crear Análisis
1. Seleccionar tipo de producto (Entero/Cola/Valor Agregado)
2. Ingresar datos básicos (Lote, Código, Talla)
3. Registrar pesos con fotos opcionales
4. Capturar uniformidad (Grandes/Pequeños)
5. Registrar defectos específicos según tipo de producto
6. Tomar foto de calidad general
7. Guardar análisis

### Ver y Editar
- Dashboard muestra análisis agrupados por turno
- Filtros por fecha y búsqueda por código/lote
- Edición muestra solo campos completados
- Sin bloqueo de registros

### Reportes
- Seleccionar fecha y turno
- Generar reporte en Excel
- Incluye análisis agrupados y subtotales

## 🔒 Almacenamiento de Fotos

Las fotos se organizan automáticamente en Google Drive:
```
Google Drive/
└── descongelado/
    ├── CODIGO_001/
    │   └── LOTE_123/
    │       ├── peso_bruto_1234567890.jpg
    │       ├── peso_neto_1234567891.jpg
    │       └── calidad_1234567892.jpg
    └── CODIGO_002/
        └── LOTE_456/
            └── ...
```

## 📝 Defectos por Tipo de Producto

### Entero (23 defectos)
Cabeza, branquias, hepatopáncreas, melanosis, manchas, hemolinfas, etc.

### Cola (15 defectos)  
Melanosis, deformidades, rosados, quebrados, mal descabezado, etc.

### Valor Agregado (16 defectos)
Residuos, cortes irregulares, patas, corbata, lomo dañado, etc.

## 🛠️ Tecnologías

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos**: Firebase Firestore
- **Almacenamiento**: Google Drive API
- **UI**: React, Tailwind CSS
- **Reportes**: ExcelJS

## 📖 Documentación Adicional

Ver archivos en el repositorio:
- `NUEVO_SISTEMA_README.md` - Guía completa de configuración
- `RESUMEN_CAMBIOS.md` - Detalles de implementación

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Proyecto privado - Aquagold S.A.

## 👥 Equipo

Desarrollado para Aquagold S.A.

## 📞 Soporte

Para problemas o preguntas, contacta al equipo de desarrollo.
