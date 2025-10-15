# Configuración de CORS para la API

Este documento describe los ajustes necesarios para eliminar el error:

```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://super-sun-app.onrender.com/api/v1/auth/login. (Reason: CORS header 'Access-Control-Allow-Origin' missing). Status code: 200.
```

La causa es que el backend no está devolviendo el encabezado **`Access-Control-Allow-Origin`** para el dominio desde el que se carga el frontend. Sigue los pasos siguientes para habilitarlo correctamente en la API desplegada en Render.

## 1. Verificar el origen del frontend

1. Abre la aplicación del frontend en el navegador.
2. Copia el dominio completo (por ejemplo, `https://super-sun-app-frontend.onrender.com`).
3. Si trabajas en local, anota también `http://localhost:3000` (o el puerto que utilices).

## 2. Configurar `CORS_ALLOWED_ORIGINS`

El backend ya incluye la lectura del entorno `CORS_ALLOWED_ORIGINS` para construir las opciones de CORS:

```ts
// backend/src/config/env.ts
corsAllowedOrigins:
  process.env.CORS_ALLOWED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0) ?? ['*']
```

Para que el encabezado se envíe correctamente:

1. Entra al panel de Render del servicio **Backend** (`super-sun-app`).
2. Ve a **Environment** → **Environment Variables**.
3. Crea (o edita) la variable `CORS_ALLOWED_ORIGINS`.
4. Asigna una lista separada por comas con todos los orígenes permitidos. Ejemplo:
   ```
   CORS_ALLOWED_ORIGINS=https://super-sun-app-frontend.onrender.com,https://super-sun-app.onrender.com
   ```
   *Incluye también los orígenes locales si los necesitas para desarrollo (`http://localhost:3000`).*
5. Guarda los cambios y vuelve a desplegar el servicio.

> **Nota:** si quieres permitir cualquier origen temporalmente, usa `CORS_ALLOWED_ORIGINS=*`. No se recomienda en producción.

## 3. Reiniciar y validar

1. Tras guardar la variable, pulsa **Manual Deploy → Clear build cache & Deploy** o reinicia el servicio para que se apliquen las nuevas variables.
2. Una vez desplegado, abre el frontend y repite la petición de login.
3. En las herramientas de desarrollo del navegador (pestaña **Network**), verifica que la respuesta incluye el encabezado:
   ```
   Access-Control-Allow-Origin: https://tu-frontend...
   ```

Si el encabezado no aparece, revisa que el dominio figure exactamente igual (incluyendo protocolo `https://`, subdominios y sin barra final) en `CORS_ALLOWED_ORIGINS`.

## 4. Comprobación local

Si trabajas en local:

1. Copia el archivo `.env.example` a `.env` en `backend/`.
2. Añade la línea:
   ```
   CORS_ALLOWED_ORIGINS=http://localhost:3000
   ```
3. Inicia el backend con `npm run dev` dentro de `backend/`.
4. Desde el frontend ejecuta la petición y comprueba que el encabezado aparece en la respuesta.

Con esta configuración la API devolverá el encabezado `Access-Control-Allow-Origin` correcto y el navegador permitirá las peticiones cross-origin.
