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

## Abrir la demo

Abrir este archivo en el navegador:

`app/index.html`

La demo guarda los cambios en el navegador mediante almacenamiento local.

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
- Reordenar y quitar lineas del presupuesto.
- Exportacion e importacion de backup local en JSON.
- Aviso visible de demo publica.
- Boton para restaurar la demo a datos iniciales.
- Ajustes responsive para uso en movil.
- Totales con margen e impuesto.
- Vista imprimible para guardar como PDF desde el navegador.

Todavia no incluye:

- Importacion desde Excel.
- Gestion de clientes.
- Facturacion.
- Usuarios o permisos.
- Sincronizacion en la nube.
