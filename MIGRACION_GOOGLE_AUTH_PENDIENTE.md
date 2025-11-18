# Migración Azure AD → Google OAuth2 - Pendiente

## ✅ Completado

1. ✅ `lib/googleAuthService.ts` - Servicio de autenticación Google creado
2. ✅ `components/GoogleLoginButton.tsx` - Botón de login creado
3. ✅ `app/page.tsx` - Hook `useGoogleAuth` creado
4. ✅ `app/page.tsx` - Componente `App` actualizado
5. ✅ `app/page.tsx` - Componente `LoginPage` creado
6. ✅ `app/page.tsx` - `DashboardPage` actualizado (user, logout)
7. ✅ `app/page.tsx` - `ResistanceTestList` actualizado
8. ✅ `app/page.tsx` - `NewTestPage` actualizado
9. ✅ `.env.local.example` - Variables de entorno actualizadas
10. ✅ `README.md` - Documentación actualizada

## ❌ Pendiente - Crítico

### 1. `app/page.tsx` - TestDetailPage
**Líneas:** ~845-1500

**Cambios necesarios:**
- Eliminar `const { instance } = useMsal();`
- Actualizar `handlePhotoUpload`:
  - Eliminar validaciones de MSAL (líneas 1107-1118)
  - Cambiar `uploadPhotoReliably(instance, loginRequest.scopes, ...)` por versión sin instance
- Actualizar `handleComplete`:
  - Eliminar validaciones de MSAL
  - Cambiar `saveExcelToOneDrive(instance, loginRequest.scopes, ...)` por versión sin instance
- Actualizar zona de eliminación:
  - Cambiar `deleteTest(editedTest.id, editedTest.lotNumber, editedTest.testType, instance, loginRequest.scopes)` 
  - Por `deleteTest(editedTest.id, editedTest.lotNumber, editedTest.testType)`

### 2. `lib/graphService.ts`
**Función:** `initialize()`

**Cambios necesarios:**
```typescript
// ANTES:
export async function initialize(msalInstance: any, scopes: string[]): Promise<void> {
  // ... lógica MSAL
}

// DESPUÉS:
export async function initialize(): Promise<void> {
  const token = await googleAuthService.ensureValidToken();
  accessToken = token;
}
```

**Funciones a actualizar:**
- `getAllDriveFiles()` - Cambiar endpoint y auth
- `createFolderStructure()` - Cambiar endpoint y auth
- `createLotFolder()` - Remover parámetros msalInstance y scopes
- `uploadPhotoToDrive()` - Remover parámetros msalInstance y scopes
- `saveExcelToDrive()` - Remover parámetros msalInstance y scopes
- `deleteAllLotFiles()` - Remover parámetros msalInstance y scopes

### 3. `lib/photoUploadService.ts`
**Función:** `uploadPhotoReliably()`

**Cambios necesarios:**
```typescript
// ANTES:
export async function uploadPhotoReliably(
  msalInstance: any,
  scopes: string[],
  lotNumber: string,
  ...
): Promise<UploadResult>

// DESPUÉS:
export async function uploadPhotoReliably(
  lotNumber: string,
  ...
): Promise<UploadResult>
```

**Líneas a actualizar:**
- Remover parámetros `msalInstance` y `scopes`
- Cambiar llamadas a `uploadPhotoToDrive(msalInstance, scopes, ...)` por versión sin instance

### 4. `lib/firestoreService.ts`
**Funciones que usan instance:**

- `deleteTest()` - Línea ~xxx
  ```typescript
  // ANTES:
  export async function deleteTest(id: string, lotNumber: string, testType: TestType, msalInstance?: any, scopes?: string[]): Promise<void>
  
  // DESPUÉS:
  export async function deleteTest(id: string, lotNumber: string, testType: TestType): Promise<void>
  ```
  - Cambiar `deleteAllLotFiles(msalInstance, scopes, ...)` por versión sin instance

### 5. `lib/excelExport.ts`
**Función:** `saveExcelToOneDrive()`

**Cambios necesarios:**
```typescript
// ANTES:
export async function saveExcelToOneDrive(msalInstance: any, scopes: string[], lotNumber: string, excelBlob: Blob, testType: TestType): Promise<void>

// DESPUÉS:
export async function saveExcelToOneDrive(lotNumber: string, excelBlob: Blob, testType: TestType): Promise<void>
```

## Orden de Ejecución Recomendado

1. **Primero:** `lib/graphService.ts` (base para todo)
2. **Segundo:** `lib/photoUploadService.ts` (depende de graphService)
3. **Tercero:** `lib/excelExport.ts` (depende de graphService)
4. **Cuarto:** `lib/firestoreService.ts` (depende de graphService)
5. **Quinto:** `app/page.tsx` - TestDetailPage (depende de todo lo anterior)

## Pruebas Necesarias

Después de completar los cambios:

1. ✅ Login con Google
2. ✅ Crear nueva resistencia
3. ✅ Subir foto (verificar Google Drive)
4. ✅ Completar resistencia (verificar Excel en Drive)
5. ✅ Eliminar resistencia (verificar borrado en Drive)
6. ✅ Cerrar sesión

## Comandos para Verificar

```bash
# Buscar referencias a MSAL que quedan
grep -r "useMsal\|@azure/msal" --include="*.ts" --include="*.tsx" lib/ app/

# Buscar referencias a "instance" como parámetro
grep -r "msalInstance:" --include="*.ts" --include="*.tsx" lib/

# Verificar imports de MSAL
grep -r "from '@azure/msal" --include="*.ts" --include="*.tsx" .
```

## Notas Importantes

- ⚠️ **No eliminar** `package.json` dependencies de MSAL hasta verificar que todo funcione
- ⚠️ **Probar** cada cambio individualmente antes de continuar
- ⚠️ **Backup** de archivos críticos antes de modificar
- ⚠️ **Verificar** que Google Drive API está habilitada en Google Cloud Console
