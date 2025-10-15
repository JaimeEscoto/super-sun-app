# Guía de pruebas con Postman

Esta guía explica cómo preparar y ejecutar pruebas manuales de la API REST usando Postman. Los ejemplos utilizan el backend del ERP y están pensados para entornos locales, pero pueden adaptarse a cualquier despliegue.

## 1. Preparación del backend

1. Clona el repositorio y entra al directorio `backend/`.
2. Copia y configura el archivo de entorno:
   ```bash
   cp .env.example .env
   ```
3. Instala dependencias y levanta el servidor en modo desarrollo:
   ```bash
   npm install
   npm run dev
   ```
4. Ejecuta las migraciones iniciales y, si lo necesitas, los datos de prueba:
   ```bash
   psql "$DATABASE_URL" -f migrations/001_init.sql
   npm run seed
   ```
5. Por defecto la API queda disponible en `http://localhost:3000/api/v1`. Si cambias el puerto, actualiza la variable `base_url` en Postman.

> **Nota:** La aplicación requiere `JWT_SECRET` y `DATABASE_URL` definidos en tu `.env`.

## 2. Crear entorno en Postman

1. Abre Postman y crea un nuevo **Environment** llamado, por ejemplo, `ERP Local`.
2. Define las variables:
   - `base_url`: `http://localhost:3000`
   - `auth_token`: deja el valor inicial vacío. Postman lo llenará automáticamente tras el login.
   - Opcional: `usuario_demo` y `password_demo` para guardar credenciales de pruebas (`demo@solarishn.com` / `Honduras2024!`).
3. Activa el entorno para que las variables estén disponibles.

## 3. Crear colección base

1. Crea una colección nueva llamada `ERP API`.
2. En la pestaña **Authorization** de la colección, selecciona `Bearer Token` y usa `{{auth_token}}` como token. Así todos los requests heredarán el token almacenado en el entorno.
3. Opcional: en la pestaña **Pre-request Script** agrega lógica común (por ejemplo, refrescar tokens) si tu escenario lo requiere.

## 4. Iniciar sesión y almacenar el token

1. Dentro de la colección crea una carpeta `Autenticación` con la solicitud `Login`.
2. Configura la solicitud:
   - Método `POST`
   - URL `{{base_url}}/api/v1/auth/login`
   - Cuerpo `raw` (JSON) con las credenciales que prefieras:
     ```json
     {
       "email": "demo@solarishn.com",
       "password": "Honduras2024!"
     }
     ```
     También puedes usar los usuarios sembrados (`director@solarishn.com` o `finanzas@solarishn.com`) con la contraseña `Demo123*`.
3. En la pestaña **Tests** agrega el siguiente script para guardar el token en el entorno activo:
   ```javascript
   if (pm.response.code === 200) {
     const json = pm.response.json();
     pm.environment.set('auth_token', json.token);
     pm.environment.set('usuario_actual', json.user.email);
   }
   ```
4. Ejecuta la solicitud. Si la autenticación es correcta, el token quedará disponible para las siguientes peticiones.

## 5. Verificar salud del servicio

- Crea un request `GET {{base_url}}/api/v1/health` dentro de la carpeta `Utilidades`.
- No requiere autenticación, por lo que puedes usarlo como verificación rápida de disponibilidad.

## 6. Probar módulos funcionales

A continuación se muestran ejemplos de requests comunes. Todos requieren el token Bearer y validan permisos específicos.

### Catálogos

- **Listar clientes**
  - Método: `GET {{base_url}}/api/v1/catalogos/clientes?page=1&pageSize=25`
  - Permiso necesario: `catalogos:ver`
  - Tests sugeridos:
    ```javascript
    pm.test('Código 200', () => pm.response.code === 200);
    pm.test('Lista tiene datos', () => pm.response.json().data.length > 0);
    ```

- **Crear cliente**
  - Método: `POST {{base_url}}/api/v1/catalogos/clientes`
  - Cuerpo de ejemplo:
    ```json
    {
      "codigo": "CLI-HN-TEST",
      "razonSocial": "Cliente Postman",
      "nif": "08011999000001",
      "limiteCredito": 150000,
      "saldo": 0,
      "estado": "ACTIVO"
    }
    ```
  - Permiso: `catalogos:crear`
  - Test sugerido para validar creación (`response.code === 201`).

- **Actualizar cliente**
  - Método: `PUT {{base_url}}/api/v1/catalogos/clientes/{{clienteId}}`
  - Reutiliza el body anterior. Verifica `response.code === 200` y que `json.data.codigo` coincida con el enviado.

- **Eliminar cliente**
  - Método: `DELETE {{base_url}}/api/v1/catalogos/clientes/{{clienteId}}`
  - Espera respuesta `{"success": true}` y status `200`.

### Inventario

- **Listar productos** (desde catálogos): `GET {{base_url}}/api/v1/catalogos/productos`
- **Consultar kardex**: `GET {{base_url}}/api/v1/inventario/kardex/{{productoId}}?almacenId={{almacenId}}`
- **Ver valuación de inventario**: `GET {{base_url}}/api/v1/inventario/valuacion`
- **Registrar ajuste**: `POST {{base_url}}/api/v1/inventario/ajustes`

Adapta el cuerpo a tus escenarios. Las validaciones con Joi te ayudarán a detectar datos faltantes o mal formateados.

### Compras, Ventas y Facturación

- **Listar órdenes de compra**: `GET {{base_url}}/api/v1/compras/ordenes`
- **Crear orden de compra**: `POST {{base_url}}/api/v1/compras/ordenes`
- **Listar pedidos de venta**: `GET {{base_url}}/api/v1/ventas/pedidos`
- **Crear pedido de venta**: `POST {{base_url}}/api/v1/ventas/pedidos`
- **Listar facturas**: `GET {{base_url}}/api/v1/facturacion/facturas`
- **Generar factura**: `POST {{base_url}}/api/v1/facturacion/facturas`

En cada request documenta en Postman las dependencias (IDs de proveedor, productos, impuestos). Puedes usar variables de entorno/colección para guardar valores que se reutilicen.

## 7. Manejo de permisos

- Los roles determinan los permisos disponibles. Tras un login revisa `json.user.permissions` en la respuesta para confirmar qué operaciones tienes habilitadas.
- Si obtienes un `403 Forbidden`, revisa que el usuario tenga el permiso correspondiente o utiliza las credenciales de administrador (`demo@solarishn.com`).

## 8. Buenas prácticas en Postman

- **Colecciones versionadas**: exporta la colección a JSON y súbela al repositorio si deseas compartir los flujos.
- **Pruebas automáticas**: agrega scripts en la pestaña **Tests** para validar respuesta, esquema y tiempos (`pm.expect(pm.response.responseTime).to.be.below(300);`).
- **Documentación**: aprovecha la descripción de cada request en Postman para registrar precondiciones (por ejemplo, "requiere cliente existente").
- **Variables seguras**: utiliza el valor **Current Value** para contraseñas/token y evita exponerlos en el **Initial Value** si compartes el entorno.

Con estos pasos podrás cubrir los flujos principales del ERP y validar rápidamente nuevas iteraciones del backend utilizando Postman.
