# Manual De Uso - Cotiza

## Concepto basico

Cotiza funciona con cuatro piezas:

1. Precios: cuanto cuestan materiales, mano de obra, transporte, alquileres y otros conceptos.
2. Rendimientos: como se calcula consumo o tiempo segun medidas o cantidades.
3. Trabajos tipo: plantillas de trabajos frecuentes que combinan precios y reglas.
4. Presupuestos: documentos finales editables creados a partir de trabajos tipo.

## Flujo recomendado

### 1. Configurar el negocio

Cargar:

- Nombre comercial.
- Moneda.
- Impuesto por defecto.
- Margen habitual.

### 2. Cargar precios esenciales

No hace falta cargar todo el catalogo al principio. Conviene empezar con los conceptos que se usan en los presupuestos mas frecuentes.

Ejemplos:

- Pintura plastica interior.
- Cinta, plastico y material auxiliar.
- Hora oficial.
- Hora ayudante.
- Desplazamiento.

### 3. Cargar rendimientos

Los rendimientos explican como estimar cantidades.

Ejemplos:

- Un litro de pintura cubre 8 m2 por mano.
- Cambiar un foco lleva 0,5 horas.
- Alicatar 1 m2 lleva 1,2 horas.

### 4. Crear trabajos tipo

Un trabajo tipo es una receta editable.

Ejemplo: Pintar habitacion.

Puede incluir:

- Pintura segun m2 y manos.
- Material auxiliar.
- Mano de obra segun m2.
- Desplazamiento.
- Margen.
- Notas para el cliente.

En la demo actual se pueden crear trabajos tipo desde la seccion "Trabajos tipo". Cada partida del trabajo puede calcularse de dos maneras:

- Usando un rendimiento cargado.
- Usando una cantidad directa basada en m2, cantidad o metros lineales.

Ejemplo:

- Suelo laminado: m2 x 1,08 para contemplar merma.
- Mano de obra: rendimiento de horas por m2.
- Rodapie: metros lineales x precio unitario.

Los trabajos tipo existentes se pueden editar o duplicar. Duplicar sirve para crear variantes sin empezar de cero.

### 5. Crear presupuesto

El usuario elige un trabajo tipo, introduce medidas o cantidades y Cotiza propone una base calculada.

El presupuesto siempre debe poder editarse antes de enviarlo.

Ademas, se pueden agregar lineas extra manuales para conceptos no incluidos en el trabajo tipo, por ejemplo retirada de escombros, proteccion especial, reparaciones previas o desplazamientos adicionales.

La demo permite cargar datos basicos del presupuesto:

- Numero.
- Cliente.
- Direccion u obra.
- Validez.
- Fecha del presupuesto.
- Estado: borrador, enviado, aceptado o rechazado.

El numero de presupuesto se propone automaticamente al crear un nuevo presupuesto. Tambien se puede editar manualmente si el usuario ya usa su propia numeracion.

Las lineas del presupuesto pueden:

- Editarse manualmente.
- Reordenarse.
- Quitarse.
- Agregarse como lineas extra.

### 6. Guardar presupuesto

El boton "Guardar presupuesto" guarda una copia local del presupuesto actual en el navegador.

Desde "Presupuestos guardados" se puede:

- Abrir un presupuesto anterior.
- Cambiar su estado.
- Eliminarlo del historial local.
- Buscar por numero, cliente, direccion o notas.
- Filtrar por estado.

El resumen comercial muestra una lectura rapida de:

- Borradores.
- Enviados y total enviado.
- Aceptados y total aceptado.
- Rechazados.

Este historial es local de la demo. No es todavia una base de datos en la nube ni un sistema multiusuario.

### 7. Backup local

Desde "Inicio" se puede:

- Exportar un backup JSON con los datos locales.
- Importar un backup JSON exportado desde Cotiza.

Importar un backup reemplaza los datos locales actuales del navegador por los del archivo importado.

Antes de importar, Cotiza pide confirmacion porque la accion reemplaza la base local actual.

### 8. Imprimir o guardar PDF

Desde la seccion "Presupuesto", el boton "Imprimir / Guardar PDF" abre la vista imprimible del presupuesto. Desde el navegador se puede imprimir o guardar como PDF.

Antes de imprimir conviene revisar:

- Datos del cliente.
- Numero, fecha y validez.
- Partidas.
- Cantidades.
- Precio unitario.
- Notas para el cliente.
- Impuesto y total.

La vista de trabajo puede mostrar coste estimado y margen para uso interno. La vista imprimible para cliente no muestra el margen interno.

La impresion incluye condiciones comerciales basicas sobre validez, cambios de alcance y trabajos no incluidos.

## Principios de uso

- Revisar siempre el presupuesto antes de enviarlo.
- Mantener precios actualizados.
- Ajustar rendimientos segun experiencia real.
- Usar trabajos tipo como base, no como verdad absoluta.
- Imprimir solo despues de revisar el resultado final.
