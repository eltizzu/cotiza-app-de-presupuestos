# Checklist Final Del Producto - Cotiza

## V1 - Producto minimo util

- [x] Demo inicial con configuracion basica del negocio.
- [x] Demo inicial con alta manual de precios.
- [x] Demo inicial con alta manual de rendimientos.
- [x] Demo inicial con trabajo tipo de pintura.
- [x] Demo inicial con trabajos tipo de fontaneria, suelo y electricidad.
- [x] Creacion manual de nuevos trabajos tipo.
- [x] Edicion de trabajos tipo existentes.
- [x] Duplicado rapido de trabajos tipo.
- [x] Demo inicial con generacion de presupuesto desde trabajo tipo.
- [x] Demo inicial con edicion manual de lineas del presupuesto.
- [x] Boton para agregar lineas sueltas al presupuesto.
- [x] Datos basicos de cliente, direccion, numero y validez.
- [x] Fecha propia de presupuesto.
- [x] Estados simples de presupuesto.
- [x] Fecha de cambio de estado.
- [x] Numeracion automatica simple de presupuestos.
- [x] Historial local de presupuestos guardados.
- [x] Abrir y eliminar presupuestos guardados.
- [x] Cambiar estado desde el historial.
- [x] Busqueda en historial.
- [x] Filtro por estado en historial.
- [x] Resumen comercial simple por estado.
- [x] Dashboard de Cotiza con metricas por periodo.
- [x] Graficos simples para estados y principales clientes.
- [x] Base de clientes detectada automaticamente desde presupuestos.
- [x] Busqueda y detalle de historial por cliente.
- [x] Normalizacion basica de datos guardados antiguos.
- [x] Proteccion basica de textos ingresados por el usuario al mostrarlos en HTML.
- [x] Separacion inicial de datos/utilidades en `state.js`.
- [x] Separacion de renderizado en `render.js`.
- [x] Separacion de acciones en `actions.js`.
- [x] Exportacion de backup local JSON.
- [x] Importacion de backup local JSON.
- [x] Exportacion de backup sin estado temporal de filtros/edicion.
- [x] Confirmacion antes de importar backup.
- [x] Confirmaciones visuales para acciones principales.
- [x] Confirmacion antes de eliminar presupuestos guardados.
- [x] Confirmacion antes de quitar lineas del presupuesto.
- [x] Reordenar lineas de presupuesto.
- [x] Demo inicial con calculo de subtotal, margen, impuestos y total.
- [x] Explicacion visible de las formulas usadas para crear el presupuesto base.
- [x] Demo inicial con notas visibles para cliente.
- [x] Vista imprimible desde el navegador con datos de cliente.
- [x] Condiciones comerciales basicas en impresion.
- [x] Aviso visible de demo publica.
- [x] Texto legal minimo visible dentro de la demo.
- [x] Boton para restaurar datos iniciales de demo.
- [x] Logo base de Cotiza guardado en `assets/`.
- [x] Logo visible en cabecera de la app.
- [x] Logo visible en impresion si el usuario no cargo logo propio.
- [x] Guia rapida dentro de la app para probar la demo sin explicacion externa.
- [x] Ayuda simple en plantillas para empezar duplicando ejemplos sin agregar un asistente pesado.
- [x] Explicacion practica en app de como una plantilla se convierte en presupuesto.
- [x] Ajustes responsive para pantallas moviles.
- [x] Persistencia local de la demo en el navegador.
- [x] Login inicial con Supabase.
- [x] Sincronizacion de settings, precios, rendimientos, plantillas y presupuestos cuando hay sesion.
- [x] Creacion o vinculacion automatica de clientes en Supabase al guardar presupuestos.
- [x] Consultas de dashboard y clientes filtradas por negocio del usuario.
- [x] Fallback local sin login conservado.
- [x] Pruebas automatizadas para mapeo de Supabase y operaciones principales de sync.
- [x] Documentacion viva actualizada con la primera demo.

## Calidad minima esperada

- [x] El usuario puede crear su primer presupuesto sin cargar un catalogo enorme.
- [x] Los calculos son visibles y entendibles en la demo.
- [x] La app explica la carga de precios, consumos y plantillas con ayudas en pantalla.
- [x] Los importes pueden editarse manualmente.
- [x] La interfaz evita lenguaje tecnico innecesario.
- [x] No hay modulos que distraigan del presupuesto.
- [ ] Mejor gestion visual de partidas dentro de trabajos tipo.
- [ ] Confirmacion visual mas detallada para eliminaciones.
- [ ] Mostrar historial de cambios de estado.
- [ ] Prueba visual real en movil antes de publicacion final.

## Revision de flujo V1 demo

- [x] Crear o editar configuracion del negocio.
- [x] Crear precio manual.
- [x] Crear rendimiento manual.
- [x] Crear, editar y duplicar trabajo tipo.
- [x] Generar presupuesto desde trabajo tipo.
- [x] Agregar linea extra.
- [x] Editar cantidades e importes.
- [x] Reordenar y quitar lineas.
- [x] Guardar presupuesto.
- [x] Cambiar estado.
- [x] Buscar y filtrar historial.
- [x] Ver resumen comercial.
- [x] Revisar dashboard por semana, mes o ultimos 3 meses.
- [x] Buscar cliente y abrir historial.
- [x] Exportar backup.
- [x] Importar backup con confirmacion.
- [x] Imprimir o guardar PDF desde navegador.

## Revision documental

- [x] Documento comercial actualizado con funciones reales de la demo.
- [x] Manual de uso actualizado.
- [x] Manual de uso reescrito como guia paso a paso.
- [x] Tutorial de primer presupuesto incluido.
- [x] Guia de trabajos no basados solo en pintura o m2 incluida en el manual.
- [x] Ejemplo completo "Cambiar grifo" documentado paso a paso.
- [x] Guia rapida de prueba incorporada en la app.
- [x] Resumen legal/fiscal actualizado para demo local.
- [x] Documento de web legal actualizado para almacenamiento local y backup.
- [x] Decisiones de producto actualizadas.

## Fuera de V1

- [ ] Facturacion.
- [ ] Contabilidad.
- [ ] Stock avanzado.
- [ ] Gestion de obras.
- [ ] Multiusuario complejo.
- [ ] IA autonoma.
- [ ] Importadores avanzados.
- [ ] App movil nativa.
- [ ] Metricas reales de Turnia hasta crear tablas de citas, servicios y estados.
