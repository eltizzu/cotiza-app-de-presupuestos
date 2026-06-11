# Cotiza

Cotiza es una app en construccion para crear presupuestos de reformas, oficios y trabajos tecnicos de forma rapida, clara y editable.

La base del producto es simple: el usuario carga precios, rendimientos y trabajos tipo; Cotiza propone una base de presupuesto; el usuario revisa y edita el resultado final.

## Estructura

- `app/`: primera demo web local.
- `docs/`: documentos vivos del producto, negocio, uso, checklist, legal inicial e ideas futuras.

## Estructura tecnica actual

- `app/index.html`: interfaz principal.
- `app/styles.css`: estilos.
- `app/state.js`: datos iniciales, guardado local y utilidades compartidas.
- `app/render.js`: renderizado de pantalla.
- `app/actions.js`: acciones del usuario y eventos.
- `app/dashboard.js`: metricas comerciales de presupuestos y graficos.
- `app/clients.js`: base de clientes detectada desde presupuestos.
- `app/core.js`: validaciones y utilidades compartidas.
- `app/config.js`: carga configuracion publica de runtime desde `/api/config`.
- `app/monitoring.js`: inicializa Sentry si existe `SENTRY_DSN`.
- `app/supabase-client.js`: autenticacion y business inicial.
- `app/supabase-sync.js`: sincronizacion de datos con Supabase cuando hay sesion.
- `api/config.js`: endpoint para leer variables de entorno en Vercel.
- `tests/`: pruebas de regresion con Node.
- `supabase/`: esquema y guia inicial de base de datos.

## Abrir la demo

Abrir este archivo en el navegador:

`app/index.html`

La demo guarda los cambios en el navegador mediante almacenamiento local.

Si se abre `app/index.html` directamente, Cotiza funciona en modo local. Para conectar Supabase sin claves hardcodeadas, usar un entorno que sirva `/api/config` con variables `SUPABASE_URL` y `SUPABASE_ANON_KEY`, por ejemplo Vercel o `vercel dev`.

Para monitoreo de errores con Sentry, cargar tambien `SENTRY_DSN` y opcionalmente `SENTRY_ENVIRONMENT`. Si no hay DSN, el monitoreo queda apagado sin romper la app.

En Vercel, `vercel.json` aplica headers basicos de seguridad y una CSP compatible con Supabase, Sentry, Chart.js y Google Fonts.

## Verificar

Ejecutar las pruebas de logica:

`node --test tests/cotiza-core.test.js tests/cotiza-sync.test.js tests/cotiza-clients.test.js`

Revisar sintaxis de JavaScript:

`node --check app/core.js app/state.js app/render.js app/actions.js app/dashboard.js app/clients.js app/supabase-client.js app/supabase-sync.js`

## Alcance actual

Incluye:

- Configuracion basica del negocio.
- Precios manuales.
- Rendimientos manuales.
- Trabajos tipo iniciales de pintura, fontaneria, suelo y electricidad.
- Creacion manual de nuevos trabajos tipo.
- Edicion y duplicado de trabajos tipo.
- Presupuesto calculado y editable.
- Lineas extra agregadas manualmente al presupuesto.
- Datos basicos de cliente, direccion, numero y validez.
- Estados simples: borrador, enviado, aceptado y rechazado.
- Numeracion automatica simple de presupuestos.
- Historial local de presupuestos guardados.
- Busqueda y filtro por estado en el historial.
- Resumen comercial simple por estado.
- Dashboard de metricas de Cotiza por periodo.
- Graficos simples de estados y principales clientes.
- Base de clientes detectada automaticamente desde presupuestos.
- Creacion o vinculacion automatica de clientes en Supabase al guardar presupuestos.
- Reordenar y quitar lineas del presupuesto.
- Exportacion e importacion de backup local en JSON.
- Aviso visible de demo publica.
- Boton para restaurar la demo a datos iniciales.
- Ajustes responsive para uso en movil.
- Totales con margen e impuesto.
- Vista imprimible para guardar como PDF desde el navegador.
- Validacion basica de backups, moneda, numeros y logo.
- Login inicial con Supabase.
- Sincronizacion con Supabase para negocio, precios, rendimientos, plantillas y presupuestos cuando hay usuario logueado.
- Fallback local con `localStorage` para usuarios sin login.

Todavia no incluye:

- Importacion desde Excel.
- Carga manual avanzada de clientes.
- Metricas reales de Turnia; por ahora solo queda preparada la idea hasta tener tablas de citas.
- Facturacion.
- Roles/permisos avanzados.
- Gestion multiempresa.
