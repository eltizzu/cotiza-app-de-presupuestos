# Decisiones De Producto - Cotiza

## 2026-05-14 - Base inicial

Decisiones tomadas:

- El producto se llama provisionalmente Cotiza.
- Cotiza se enfoca en presupuestos para reformas, oficios y trabajos tecnicos.
- No sera planteado inicialmente como ERP.
- La V1 se centrara en precios, rendimientos, trabajos tipo y presupuestos editables.
- Los calculos deben basarse en datos cargados por el usuario.
- La edicion humana final es obligatoria como principio de producto.
- La IA queda como posibilidad futura, siempre como ayuda y no como decision automatica.

## Regla central

Si una funcion no mejora directamente la creacion, claridad o control del presupuesto, no entra en V1.

## 2026-05-14 - Primera demo

Se creo una demo web local en `app/` con:

- Configuracion basica del negocio.
- Base manual de precios.
- Base manual de rendimientos.
- Un trabajo tipo inicial: pintar habitacion.
- Generacion de presupuesto calculado desde superficie y cantidad.
- Lineas editables antes del resultado final.
- Calculo de subtotal, margen, impuesto y total.
- Guardado local en el navegador.

La demo mantiene el criterio de producto: Cotiza propone una base calculada, pero el usuario puede revisar y editar antes de usar el presupuesto.

## 2026-05-14 - Trabajos tipo e impresion

Se amplio la demo con:

- Trabajos tipo iniciales adicionales: cambiar grifo, colocar suelo laminado y cambiar foco.
- Mas precios y rendimientos base para cubrir pintura, fontaneria, suelo y electricidad simple.
- Creacion manual de nuevos trabajos tipo desde la interfaz.
- Partidas calculadas por rendimiento o por variable directa.
- Campo de metros lineales para trabajos como rodapies y remates.
- Vista imprimible del presupuesto para imprimir o guardar como PDF desde el navegador.

Decision de alcance:

- La V1 puede crear nuevos trabajos tipo, pero la edicion avanzada de trabajos tipo existentes queda para el siguiente paso.
- La impresion desde navegador es suficiente para la demo V1; un generador PDF propio queda para despues.

## 2026-05-15 - Ajuste manual y presupuesto mas presentable

Se amplio la demo con:

- Lineas sueltas agregadas manualmente al presupuesto.
- Datos basicos de presupuesto: numero, cliente, direccion u obra y validez.
- Impresion con encabezado, datos del cliente, partidas, notas y totales.
- Edicion de trabajos tipo existentes.
- Duplicado de trabajos tipo para crear variantes.

Decision de producto:

- Las lineas manuales son parte esencial de la V1 porque los presupuestos reales casi siempre necesitan ajustes fuera de la plantilla.
- La impresion para cliente no debe mostrar coste interno ni margen. Esos datos quedan para la vista de trabajo.
- La gestion de clientes como modulo completo queda fuera de V1; por ahora solo se cargan datos basicos dentro del presupuesto.

## 2026-05-15 - Historial local y orden de partidas

Se amplio la demo con:

- Numeracion automatica simple para nuevos presupuestos.
- Guardado local de presupuestos en el navegador.
- Historial local con opcion de abrir o eliminar presupuestos guardados.
- Reordenamiento de lineas del presupuesto.
- Controles mas claros para quitar lineas.

Decision de producto:

- Para la V1 demo, el historial local alcanza para validar el flujo sin montar usuarios, nube ni base de datos.
- Los estados comerciales simples ya entran en V1; seguimiento avanzado queda para una etapa posterior.
- La numeracion debe poder editarse manualmente porque muchos usuarios ya tendran su propia forma de numerar.

## 2026-05-15 - Estados comerciales simples

Se agregaron estados de presupuesto:

- Borrador.
- Enviado.
- Aceptado.
- Rechazado.

Los estados se muestran en el presupuesto actual y en el historial local. Tambien pueden cambiarse desde el historial. No se muestran en la impresion para cliente.

Decision de producto:

- Los estados entran en V1 porque ayudan al seguimiento comercial sin convertir Cotiza en CRM.
- Quedan para despues el historial visible de cambios de estado, metricas comerciales y seguimiento avanzado.

## 2026-05-15 - Busqueda y filtro de historial

Se agrego al historial local:

- Busqueda por numero, cliente, direccion y notas.
- Filtro por estado.

Decision de producto:

- La busqueda y el filtro por estado entran en V1 porque mejoran el seguimiento sin sumar complejidad de CRM.
- Las metricas comerciales, historial visible de cambios de estado y paneles de conversion quedan para despues.

## 2026-05-15 - Resumen comercial y endurecimiento

Se agrego:

- Resumen comercial simple por estado.
- Total enviado y total aceptado.
- Normalizacion basica para presupuestos guardados con versiones anteriores de la demo.
- Escape de textos ingresados por el usuario antes de mostrarlos como HTML.

Decision tecnica:

- Mientras la demo siga en HTML, CSS y JavaScript simple, conviene revisar fragilidad en cada bloque nuevo.
- El riesgo estructural detectado fue que el archivo unico inicial de JavaScript estaba creciendo demasiado; por eso se separaron datos, renderizado y acciones en archivos distintos.

## 2026-05-16 - Revision de cierre V1 demo

Se reviso el flujo completo esperado de la demo:

- Configuracion del negocio.
- Alta de precios y rendimientos.
- Creacion, edicion y duplicado de trabajos tipo.
- Generacion de presupuesto desde trabajo tipo.
- Edicion manual de partidas.
- Lineas extra.
- Guardado de presupuesto.
- Estados comerciales.
- Historial con busqueda y filtro.
- Resumen comercial.
- Backup local.
- Impresion desde navegador.

Tambien se actualizaron los documentos comercial, legal/fiscal y web legal para reflejar el producto real actual.

Decision de cierre:

- La V1 demo ya representa de forma coherente la propuesta de Cotiza.
- Los siguientes avances deberian ser pulido visual, prueba manual en navegador y decision tecnica sobre si evolucionar a SaaS, app local o app de escritorio.

## 2026-05-21 - Correccion de carga de scripts

Problema detectado:

- Al separar JavaScript en varios archivos y cargarlos como scripts clasicos, algunos nombres internos chocaban en el ambito global del navegador.
- Eso podia impedir que `actions.js` llegara a vincular eventos, dejando los botones sin respuesta.

Correccion:

- `state.js`, `render.js` y `actions.js` quedaron envueltos en bloques aislados.
- Solo se exponen `window.Cotiza` y `window.CotizaRender` como puntos compartidos.

Decision tecnica:

- Mientras la demo siga sin bundler ni modulos, los archivos JavaScript deben evitar declarar nombres globales accidentales.

## 2026-05-21 - Manual de uso completo

Se reescribio el manual de uso como guia practica:

- Explicacion del concepto base.
- Recorrido por cada seccion de la app.
- Ejemplos de precios y rendimientos.
- Explicacion de trabajos tipo.
- Uso del presupuesto, historial, backup e impresion.
- Tutorial completo para crear un primer presupuesto de pintura.
- Buenas practicas y limites de la demo.

Decision de producto:

- El manual debe explicar la logica de Cotiza sin asumir conocimiento tecnico.
- Los ejemplos deben mostrar datos reales de oficio, no texto generico.

## 2026-05-21 - Preparacion para demo publica

Se agrego:

- Aviso visible de demo publica.
- Texto legal minimo dentro de la app.
- Boton "Restaurar demo" para volver a datos iniciales.
- Exportacion de backup sin estado temporal de filtros o edicion.
- Ajustes responsive adicionales para pantallas moviles.

Decision de producto:

- La demo publica debe advertir que los datos se guardan localmente en el navegador.
- La demo publica debe facilitar volver a los ejemplos iniciales.
- Antes de publicarla definitivamente conviene hacer una prueba visual real en movil y escritorio.

## 2026-05-27 - Logo y recorrido guiado de demo

Se agrego:

- Logo base de Cotiza en la carpeta `assets/`.
- Logo visible en la cabecera principal de la app.
- Uso del logo de Cotiza en la impresion cuando el usuario no cargo un logo propio del negocio.
- Guia rapida dentro de "Inicio" para que una persona pueda probar la demo sin explicacion externa.

Decision de producto:

- La demo debe sentirse como producto presentable, no como prototipo anonimo.
- La guia rapida prioriza una prueba concreta: calcular un presupuesto de pintura, editar una linea, agregar una extra, guardar, cambiar estado e imprimir.
- La identidad visual no debe tapar el objetivo principal: validar si el flujo de presupuesto se entiende y aporta valor.

## 2026-05-28 - Analisis inicial de competencia

Se creo un documento de analisis competitivo con referencias de apps y programas cercanos.

Decision de producto:

- Cotiza no debe competir como ERP ni como software tecnico de mediciones.
- Cotiza tampoco debe posicionarse como una IA que inventa presupuestos.
- La posicion recomendada es una herramienta simple y profesional para crear presupuestos a partir de precios, rendimientos y trabajos tipo controlados por el usuario.
- Las ideas utiles de la competencia se usaran como aprendizaje, no como excusa para agregar modulos antes de validar.

## 2026-05-28 - Aprendizaje de competencia aplicado a carga y calculadora

Se aclaro el objetivo del analisis competitivo:

- No se busca salir a competir copiando funcionalidades.
- Se busca aprender como hacer mas facil cargar precios, consumos, tiempos y trabajos tipo.
- Se busca que la calculadora sea mas clara para una persona no tecnica.

Decision de producto:

- Cotiza debe reducir friccion con asistentes cortos por oficio, ejemplos precargados y explicaciones visibles del calculo.
- La estructura interna puede seguir siendo precios, rendimientos y trabajos tipo, pero la interfaz no debe obligar al usuario a pensar en esos conceptos desde el primer minuto.
- El siguiente pulido de demo deberia mejorar ayudas en pantalla y mostrar formulas humanas despues de calcular.

## 2026-05-28 - Profesional por dentro, simple por fuera

Se ajusto la demo para reforzar la direccion del producto:

- Ayudas visibles en precios, consumos/tiempos y plantillas.
- Lenguaje mas cercano para reducir friccion.
- Boton principal del presupuesto renombrado a "Crear presupuesto base".
- Explicacion visible de formulas despues de calcular un presupuesto.

Decision de producto:

- Cotiza no debe perder funcionalidad profesional, pero debe evitar que el cliente sienta que esta configurando un sistema complejo.
- La complejidad debe estar ordenada por debajo; la interfaz debe resolver el siguiente paso del usuario.
- La version movil se mantiene como condicion importante para cada cambio de experiencia.

## 2026-05-28 - Ayuda sin inflar la interfaz

Se agrego una ayuda simple en "Plantillas" para orientar al usuario a duplicar una plantilla de ejemplo y ajustarla.

Decision de producto:

- Antes de crear asistentes completos, Cotiza debe probar ayudas pequenas y claras.
- No se agregan muchos botones si la misma claridad puede lograrse con texto corto y una accion existente.
- La carga guiada debe nacer solo si reduce esfuerzo real, no por sumar una funcion mas.

## 2026-06-05 - Sync inicial con Supabase validado

Se reviso y ajusto la integracion Supabase:

- Login inicial con Supabase.
- Business creado/cargado por usuario.
- Lectura de negocio, precios, rendimientos, plantillas y presupuestos.
- Escritura de settings, precios, rendimientos, plantillas y presupuestos.
- Fallback local con `localStorage` para usuarios sin login.
- Pruebas automatizadas con cliente Supabase simulado.

Decision tecnica:

- La demo debe seguir funcionando sin cuenta.
- Cuando hay sesion, las acciones principales deben sincronizar contra Supabase sin cambiar el flujo visual.
- La coherencia entre datos locales y remotos es prioritaria: no se deben permitir duplicados locales que choquen con claves unicas remotas.

## 2026-05-15 - Separacion inicial de JavaScript

Se separo la primera parte de la estructura tecnica:

- `state.js`: datos iniciales, carga desde almacenamiento local, normalizacion, guardado y utilidades compartidas.
- `render.js`: renderizado de interfaz.
- `actions.js`: acciones del usuario y eventos.

Decision tecnica:

- Se evito usar modulos `type="module"` para que la demo siga pudiendo abrirse directamente desde `index.html`.
- La separacion reduce fragilidad sin introducir herramientas, compiladores ni dependencias.
- Si el producto sigue creciendo, el siguiente paso tecnico sera separar calculos y validaciones en archivos propios.

## 2026-05-15 - Backup local y separacion por responsabilidades

Se agrego:

- `render.js` para funciones de renderizado.
- `actions.js` para eventos y acciones.
- Exportacion de backup local en JSON.
- Importacion de backup local desde JSON.

Decision de producto:

- La exportacion/importacion de backup entra en V1 demo porque reduce el riesgo de perder configuraciones locales.
- La importacion reemplaza los datos locales actuales y por eso ya pide confirmacion antes de aplicar el cambio.

## 2026-05-16 - Confirmaciones visuales y proteccion de importacion

Se agrego:

- Aviso visual para guardar configuracion, precios, rendimientos, trabajos tipo, presupuestos y exportar backup.
- Confirmacion antes de importar backup, porque reemplaza los datos locales actuales.
- Mensaje de error visual si el archivo importado no tiene formato valido.

Decision de producto:

- Las acciones que modifican datos deben dar respuesta visible al usuario.
- Las acciones destructivas o reemplazantes deben pedir confirmacion antes de ejecutarse.

## 2026-05-16 - Fechas, eliminaciones e impresion

Se agrego:

- Fecha propia del presupuesto.
- Fecha interna de ultimo cambio de estado.
- Confirmacion antes de eliminar presupuestos guardados.
- Confirmacion antes de quitar lineas del presupuesto.
- Condiciones comerciales basicas en la impresion.

Decision de producto:

- La impresion debe usar la fecha guardada del presupuesto, no siempre la fecha actual.
- El estado comercial ayuda internamente, pero no se muestra en la impresion para cliente.
- Las condiciones comerciales impresas deben ser simples y editables en una etapa posterior.

## 2026-06-10 - Dashboard y clientes desde presupuestos

Se agrego una primera capa comercial sin convertir Cotiza en un CRM pesado:

- Dashboard de Cotiza con total de presupuestos, monto presupuestado, estados y principales clientes.
- Filtro simple por periodo: esta semana, este mes y ultimos 3 meses.
- Graficos basicos con Chart.js.
- Seccion "Clientes" generada automaticamente desde presupuestos guardados.
- En Supabase, al guardar un presupuesto se crea o vincula el cliente usando la tabla `clients` existente.
- Sin login, Dashboard y Clientes siguen funcionando con los presupuestos locales del navegador.

Decision de producto:

- Clientes no se carga manualmente en esta etapa para no agregar friccion inicial.
- El dashboard se limita a metricas accionables para validar valor: volumen, estado y clientes.
- Turnia queda solo como estructura conceptual hasta tener tablas reales de citas, servicios, estados y horarios.
- No se agrega infraestructura extra antes de validar si estas metricas ayudan al usuario a entender mejor su negocio.

## 2026-06-15 - Manual ampliado para oficios variados

Se amplio el manual para explicar como adaptar Cotiza a trabajos que no son solo pintura por m2:

- Reparaciones puntuales.
- Cambios de piezas o instalaciones por cantidad.
- Demoliciones o retirada de pared por m2.
- Trabajos por horas.
- Presupuestos mixtos con parte calculada y parte manual.

Decision de producto:

- Cotiza debe presentarse como herramienta para oficios y trabajos tecnicos en general, no como calculadora de pintura.
- La documentacion debe explicar cuando usar `m2`, `cantidad`, `metros lineales` o lineas manuales.
- La app puede mantener una interfaz simple si el manual y los textos guian bien la creacion de plantillas.
