# Guía de Despliegue en Render

Este documento contiene las instrucciones para desplegar la API de TronWeb en Render.

## Configuración Requerida

### Variables de Entorno

**⚠️ IMPORTANTE:** La aplicación valida las variables de entorno al iniciar. Si faltan las variables requeridas, la aplicación no iniciará.

Configura las siguientes variables de entorno en el dashboard de Render (Settings → Environment):

**Variables REQUERIDAS (la aplicación no iniciará sin estas):**
```
TRON_FULLNODE=https://nile.trongrid.io
USDT_CONTRACT=TU93jfy3WbRUoH15ouqepn4Vw85jckcygv
ACCESS_TOKEN=tu_token_de_acceso_seguro
```

**Variables OPCIONALES (pero recomendadas):**
```
PORT=5050  (Render lo asigna automáticamente, pero puedes especificarlo)
TRON_SOLIDITYNODE=https://nile.trongrid.io
TRON_EVENTSERVER=https://nile.trongrid.io
TRON_CUSTODY_PRIVATE_KEY=tu_clave_privada_aqui
TRONGRID_API_KEY=tu_api_key_de_trongrid
```

### Pasos para Desplegar

1. **Conecta tu repositorio a Render:**
   - Ve a [Render Dashboard](https://dashboard.render.com)
   - Haz clic en "New +" → "Web Service"
   - Conecta tu repositorio de GitHub/GitLab

2. **Configura el servicio:**
   - **Name:** tron-api (o el nombre que prefieras)
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Elige el plan que necesites (Free tier disponible)

3. **Agrega las variables de entorno:**
   - En la sección "Environment Variables", agrega todas las variables listadas arriba
   - **IMPORTANTE:** Nunca compartas tus claves privadas o tokens de acceso

4. **Despliega:**
   - Haz clic en "Create Web Service"
   - Render construirá y desplegará tu aplicación automáticamente

### Notas Importantes

- **Validación de variables:** La aplicación valida las variables de entorno requeridas al iniciar. Si faltan, verás un error claro indicando cuáles faltan.
- Render asignará automáticamente un puerto, pero la aplicación está configurada para usar la variable `PORT` de entorno
- El servicio escucha en `0.0.0.0` para aceptar conexiones externas (necesario para Render)
- **Manejo de errores:** Todas las rutas y funciones async tienen manejo de errores para evitar crashes
- Asegúrate de que todas las variables de entorno requeridas estén configuradas antes del primer despliegue
- El archivo `render.yaml` está incluido para configuración automática si prefieres usar Blueprint

### Verificación

Una vez desplegado, puedes verificar que la API funciona haciendo una petición a:
```
https://tu-servicio.onrender.com/wallet/create
```

**Nota:** Recuerda incluir el header `x-api-key` con tu `ACCESS_TOKEN` en todas las peticiones.

