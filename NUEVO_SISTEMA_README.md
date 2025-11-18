# Sistema de Análisis de Calidad - Aquagold

## Cambios Implementados

### 1. Nueva Estructura de Datos
- **Tipo de producto**: Entero, Cola, Valor Agregado
- **Campos de análisis**: Lote, Código, Talla, Pesos con fotos, Uniformidad, Defectos
- **Sistema de turnos**: Automático (Día: 7:10 AM - 7:10 PM, Noche: 7:10 PM - 7:10 AM)

### 2. Almacenamiento de Fotos - Google Drive
Se ha migrado el almacenamiento de OneDrive a Google Drive con estructura organizada:
```
Aquagold_Resistencias/
  ├── CODIGO_001/
  │   └── LOTE_123/
  │       ├── peso_bruto_1234567890.jpg
  │       ├── peso_congelado_1234567891.jpg
  │       ├── uniformidad_grandes_1234567892.jpg
  │       └── calidad_1234567893.jpg
```

### 3. Sistema de Reportes
- **Eliminado**: Reportes Excel individuales por análisis
- **Mantenido**: Reporte diario con análisis agrupados por turno

### 4. Dashboard Principal
- Vista de análisis por fecha y turno
- Búsqueda por código o lote
- Edición de análisis (solo campos completados)
- No hay bloqueo de registros

## Configuración de Google Drive API

### Paso 1: Crear Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google Drive:
   - Ve a "APIs y servicios" > "Biblioteca"
   - Busca "Google Drive API"
   - Haz clic en "Habilitar"

### Paso 2: Crear Credenciales

1. Ve a "APIs y servicios" > "Credenciales"
2. Haz clic en "Crear credenciales" > "ID de cliente de OAuth"
3. Tipo de aplicación: "Aplicación web"
4. Orígenes autorizados de JavaScript:
   ```
   http://localhost:3000
   https://tu-dominio.com
   ```
5. URIs de redireccionamiento autorizadas:
   ```
   http://localhost:3000
   https://tu-dominio.com
   ```
6. Guarda el **Client ID** y **API Key**

### Paso 3: Crear Carpeta Raíz en Google Drive

1. Ve a tu Google Drive
2. Crea una carpeta llamada "Aquagold_Resistencias"
3. Haz clic derecho > "Obtener enlace"
4. Copia el ID de la carpeta de la URL:
   ```
   https://drive.google.com/drive/folders/[FOLDER_ID_AQUI]
   ```

### Paso 4: Configurar Variables de Entorno

Crea o actualiza el archivo `.env.local`:

```env
# Firebase (existentes)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Google Drive API (NUEVAS)
NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=your-google-drive-api-key
NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID=your-google-drive-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_DRIVE_ROOT_FOLDER_ID=your-folder-id-from-step-3
```

## Reglas de Firestore

Actualiza las reglas de Firestore para la nueva colección:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Nueva colección de análisis de calidad
    match /quality_analyses/{analysisId} {
      allow read, write: if request.auth != null;
    }
    
    // Mantener colecciones existentes si es necesario
    match /resistance_tests/{testId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Índices de Firestore

Crea los siguientes índices compuestos en Firestore:

1. **quality_analyses**
   - date (Ascending) + createdAt (Descending)
   - date (Ascending) + shift (Ascending) + createdAt (Descending)

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en http://localhost:3000

## Estructura de Archivos Principales

```
├── app/
│   ├── dashboard/
│   │   ├── tests/
│   │   │   └── new/
│   │   │       └── page.tsx          # Formulario de nuevo análisis
│   │   └── analysis/
│   │       └── edit/
│   │           └── [id]/
│   │               └── page.tsx      # Edición de análisis
│   └── page.tsx                      # Login
│
├── components/
│   ├── AnalysisDashboard.tsx        # Dashboard principal
│   ├── ProductTypeSelector.tsx      # Selector de tipo de producto
│   ├── PhotoCapture.tsx             # Componente de captura de fotos
│   └── DailyReportModalNew.tsx      # Modal de reporte diario
│
└── lib/
    ├── types.ts                      # Tipos de datos actualizados
    ├── utils.ts                      # Utilidades (turnos, fechas)
    ├── analysisService.ts            # Servicio de Firestore
    └── googleDriveService.ts         # Servicio de Google Drive
```

## Flujo de Uso

### Crear Nuevo Análisis

1. Clic en "Nuevo Análisis"
2. Seleccionar tipo de producto (Entero/Cola/Valor Agregado)
3. Completar campos básicos (Lote, Código, Talla)
4. Ingresar pesos con opción de foto
5. Ingresar uniformidad con fotos
6. Completar defectos según tipo de producto seleccionado
7. Tomar foto de calidad general
8. Agregar observaciones (opcional)
9. Guardar análisis

### Editar Análisis

1. Desde el dashboard, clic en "Editar" en cualquier análisis
2. Se muestran **solo los campos que fueron completados**
3. Modificar valores necesarios
4. Guardar cambios

### Generar Reporte Diario

1. Clic en "Reporte Diario"
2. Seleccionar fecha
3. Seleccionar turno (Todos/Día/Noche)
4. Generar reporte
5. Descargar Excel con análisis agrupados por turno

## Defectos por Tipo de Producto

### Entero
- Cabeza Roja Fuerte, Cabeza Naranja, Cabeza Floja, Cabeza Descolgada
- Branquias Oscuras/Amarillas (Leves/Fuertes)
- Hongo Bucal (Leve/Fuerte)
- Hepatopáncreas Reventado/Regado
- Flácido, Mudado, Melanosis
- Manchas Negras (Leves/Fuertes)
- Hemolinfas (Leve/Fuertes)
- Pequeños/Juveniles, Quebrados, Material Extraño

### Cola
- Melanosis, Hepatopáncreas Regado
- Flácido, Mudado
- Manchas Negras (Leves/Fuertes)
- Semi Rosado, Rosados, Rojos
- Deformes (Leves/Fuertes)
- Quebrados, Pequeños/Juveniles
- Material Extraño, Mal Descabezado

### Valor Agregado
- Melanosis, Material Extraño, Mal Descabezados
- Residuos de Hepatopáncreas
- Corbata, Patas, Sin Telson, Resto de Venas
- Cáscara Aparte
- Corte Irregular/Profundo, Falta de Corte
- Ojal, Lomo Dañado
- Pegados y Agrupados

## Autenticación Google Drive

El sistema usa OAuth2 de Google. La primera vez que se use:

1. Se abrirá ventana de autenticación de Google
2. Seleccionar cuenta de Google
3. Autorizar acceso a Google Drive
4. El token se guardará en la sesión

## Migración de Datos Existentes

Si tienes datos en el sistema anterior (resistance_tests):

1. Los datos antiguos permanecerán en Firestore
2. El nuevo sistema usa la colección `quality_analyses`
3. Puedes mantener ambos sistemas funcionando simultáneamente
4. O migrar los datos con un script personalizado (contactar a desarrollo)

## Soporte

Para problemas o preguntas:
- Revisar los logs del navegador (F12 > Console)
- Verificar configuración de variables de entorno
- Revisar permisos de Firestore y Google Drive

## Notas Importantes

- Las fotos se almacenan SOLO en Google Drive
- Firestore solo guarda las URLs de las fotos
- Los análisis no se bloquean después de guardar
- El turno se asigna automáticamente según la hora
- Solo se muestran campos completados en la edición
