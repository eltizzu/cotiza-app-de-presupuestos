# Supabase Setup - Cotiza

Esta carpeta prepara el salto de demo local a SaaS con cuentas y datos en nube.

## 1. Crear proyecto

1. Entra en Supabase y crea un proyecto nuevo.
2. Guarda estos datos del panel:
   - Project URL.
   - Anon public key.
   - Service role key solo para tareas privadas de servidor. No debe ir en frontend.

## 2. Crear tablas

1. Abre SQL Editor en Supabase.
2. Copia el contenido de `supabase/schema.sql`.
3. Ejecuta el script completo.
4. Revisa que no haya errores.

El esquema crea:

- `businesses`: configuracion de cada negocio.
- `prices`: precios base.
- `rules`: consumos y tiempos.
- `templates` y `template_lines`: plantillas de trabajos.
- `clients`: clientes reutilizables.
- `quotes` y `quote_lines`: presupuestos guardados.

Tambien activa Row Level Security para que cada usuario vea solo los datos de sus negocios.

## 3. Configurar autenticacion

Para una primera version simple:

1. Activa Email auth.
2. Desactiva proveedores sociales hasta necesitarlos.
3. Configura Site URL cuando exista dominio o entorno local.
4. Mantén confirmacion de email activada si la demo pasa a publica.

## 4. Variables esperadas

Copia `.env.example` a `.env.local` cuando exista una app con build tooling.

La demo HTML actual no lee `.env.local` directamente. Cuando migremos a app con bundler o framework, usara:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## 5. Proximo paso tecnico

Cuando tengas proyecto y claves:

1. Agregar cliente Supabase en la app.
2. Crear pantalla de login.
3. Sincronizar `state.settings`, `prices`, `rules`, `templates` y `savedQuotes`.
4. Mantener import/export JSON como backup manual.
5. Crear migracion desde `localStorage` hacia Supabase para no perder datos de demo.

## Nota legal

Al guardar datos de clientes en Supabase, Cotiza deja de ser solo demo local. Antes de una demo publica real hay que revisar privacidad, terminos, encargado de tratamiento, backups y retencion de datos.
