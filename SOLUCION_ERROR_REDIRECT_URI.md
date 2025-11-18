# Solución: Error 400 redirect_uri_mismatch

## El Problema
```
Error 400: redirect_uri_mismatch
Acceso bloqueado: La solicitud de esta app no es válida
```

## Causa
Las URIs de redirección configuradas en Google Cloud Console no coinciden con la URL desde donde se ejecuta la aplicación.

## Solución Paso a Paso

### 1. Verificar la URL Actual de tu Aplicación

**En desarrollo local:**
- Si usas `npm run dev`: probablemente es `http://localhost:3000`
- Verifica en la terminal cuál es la URL exacta

### 2. Ir a Google Cloud Console

1. Ve a: https://console.cloud.google.com/
2. Selecciona tu proyecto
3. En el menú lateral: **APIs y servicios** → **Credenciales**
4. Busca el Client ID: `484915704254-82hmr1igjf3pgi8fjvoamrjkk4tpkov5`
5. Haz clic en el nombre para editarlo

### 3. Configurar URIs Autorizadas

En la configuración del OAuth 2.0 Client ID, agrega estas URIs:

#### Orígenes de JavaScript autorizados:
```
http://localhost:3000
http://localhost:8080
http://127.0.0.1:3000
http://127.0.0.1:8080
```

#### URIs de redireccionamiento autorizadas:
```
http://localhost:3000
http://localhost:8080
http://127.0.0.1:3000
http://127.0.0.1:8080
```

**⚠️ IMPORTANTE:** 
- NO agregues barras finales (`/`) a las URLs
- NO agregues rutas adicionales (como `/callback`)
- Agrega TODAS las variantes que uses (localhost, 127.0.0.1, puertos diferentes)

### 4. Guardar Cambios

1. Haz clic en **GUARDAR** en Google Cloud Console
2. **Espera 5-10 minutos** para que los cambios se propaguen

### 5. Limpiar Caché y Reiniciar

```powershell
# Detener el servidor si está corriendo (Ctrl+C)

# Limpiar caché del navegador
# Chrome: Ctrl+Shift+Delete → Borrar cookies y caché

# Reiniciar el servidor
npm run dev
```

### 6. Probar el Login

1. Abre la aplicación en modo incógnito: `http://localhost:3000`
2. Haz clic en "Iniciar sesión con Google"
3. Debería abrirse el popup de selección de cuenta de Google
4. Selecciona tu cuenta (rogerpillasagua95@gmail.com)
5. Autoriza los permisos solicitados

## Si el Error Persiste

### Opción A: Verificar Variables de Entorno

Abre `.env.local` y verifica:

```env
NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID=484915704254-82hmr1igjf3pgi8fjvoamrjkk4tpkov5.apps.googleusercontent.com
```

- ✅ NO debe tener espacios
- ✅ NO debe tener comillas adicionales
- ✅ Debe terminar en `.apps.googleusercontent.com`

### Opción B: Crear Nuevo Client ID

Si el problema persiste, crea un nuevo Client ID:

1. Google Cloud Console → Credenciales
2. **Crear credenciales** → **ID de cliente de OAuth 2.0**
3. Tipo de aplicación: **Aplicación web**
4. Nombre: `Aquagold Analisis Descongelado`
5. Orígenes autorizados:
   ```
   http://localhost:3000
   http://localhost:8080
   ```
6. URIs de redireccionamiento: (dejar en blanco o igual que orígenes)
7. **CREAR**
8. Copiar el nuevo Client ID
9. Actualizar en `.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID=TU_NUEVO_CLIENT_ID.apps.googleusercontent.com
   ```

### Opción C: Verificar Pantalla de Consentimiento

1. Google Cloud Console → **Pantalla de consentimiento de OAuth**
2. Estado de publicación: Debe estar en **En producción** o **Prueba**
3. Si está en "Prueba", agrega tu email en **Usuarios de prueba**:
   - rogerpillasagua95@gmail.com

## Configuración Completa Recomendada

### Para Desarrollo Local

**Orígenes JavaScript autorizados:**
```
http://localhost:3000
http://localhost:8080
http://127.0.0.1:3000
http://127.0.0.1:8080
```

**URIs de redireccionamiento:**
```
http://localhost:3000
http://localhost:8080
```

### Para Producción (cuando despliegues)

Agrega además:
```
https://tu-dominio.com
https://www.tu-dominio.com
https://tu-app.vercel.app
```

## Verificación Final

Después de configurar, verifica:

1. ✅ Client ID correcto en `.env.local`
2. ✅ URIs configuradas en Google Cloud Console
3. ✅ Pantalla de consentimiento configurada
4. ✅ API de Google Drive habilitada
5. ✅ Esperado 5-10 minutos después de cambios
6. ✅ Caché del navegador limpiado
7. ✅ Aplicación reiniciada

## Comandos Útiles

```powershell
# Ver variables de entorno cargadas
Get-Content .env.local

# Reiniciar servidor limpio
Remove-Item -Recurse -Force .next
npm run dev

# Verificar puerto usado
netstat -ano | findstr :3000
```

## Contacto de Soporte

Si el problema persiste después de seguir todos estos pasos:
1. Captura pantalla del error completo
2. Captura configuración de Google Cloud Console
3. Verifica los logs de la consola del navegador (F12)
4. Comparte el archivo `.env.local` (SIN las claves sensibles)
