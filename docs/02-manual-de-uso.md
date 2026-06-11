# Manual De Uso - Cotiza

## Que Es Cotiza

Cotiza es una herramienta para crear presupuestos de reformas, oficios y trabajos tecnicos a partir de datos controlados por el usuario.

La idea principal es:

> Precios + Consumos y tiempos + Plantillas = Presupuesto base editable.

Cotiza no inventa precios ni decide por el usuario. Calcula una base usando la informacion cargada y deja que la persona revise, edite y cierre el presupuesto.

## Como Esta Organizada La App

La demo tiene siete secciones principales:

- Inicio.
- Precios.
- Consumos y tiempos.
- Plantillas de trabajos.
- Presupuesto.
- Dashboard.
- Clientes.

Conviene usarlas en ese orden la primera vez.

## 1. Inicio

En "Inicio" se cargan los datos generales del negocio.

La demo tambien muestra un recorrido rapido para probar Cotiza sin cargar datos desde cero. Ese recorrido recomienda empezar por un presupuesto de pintura con datos de ejemplo, editar una partida, agregar una linea extra, guardar el presupuesto y revisar la impresion.

Campos:

- Nombre del negocio.
- Moneda.
- Impuesto por defecto.
- Margen por defecto.

Ejemplo:

- Nombre: Reformas Norte.
- Moneda: EUR.
- Impuesto: 21.
- Margen: 20.

El margen se usa para calcular el precio antes de impuestos a partir del coste estimado. La impresion para cliente no muestra el margen interno.

### Backup Local

Desde "Inicio" tambien se puede:

- Exportar backup.
- Importar backup.

El backup es un archivo JSON con los datos locales de Cotiza.

Importante:

- La demo guarda datos en el navegador.
- Si se inicia sesion, Cotiza puede cargar y guardar datos en Supabase.
- Sin sesion, la app sigue funcionando en modo local con `localStorage`.
- Si se borra el almacenamiento del navegador, se pueden perder datos.
- Conviene exportar backup si se cargan datos importantes.
- Importar un backup reemplaza los datos locales actuales.

## 2. Precios

En "Precios" se carga la base de costes.

Un precio representa algo que se usa en un presupuesto:

- Material.
- Mano de obra.
- Transporte.
- Alquiler.
- Otro concepto.

Campos:

- Concepto.
- Tipo.
- Unidad.
- Precio unitario.

Ejemplos:

| Concepto | Tipo | Unidad | Precio |
| --- | --- | --- | --- |
| Pintura plastica interior | Material | litro | 8,50 |
| Material auxiliar pintura | Material | m2 | 0,65 |
| Hora oficial | Mano de obra | hora | 28 |
| Desplazamiento urbano | Transporte | unidad | 25 |

Consejo: no hace falta cargar todo al principio. Es mejor empezar con los precios necesarios para los trabajos mas frecuentes.

## 3. Consumos Y Tiempos

En "Consumos y tiempos" se cargan reglas simples para estimar cantidades o tiempos.

Un consumo o tiempo responde preguntas como:

- Cuantas horas lleva una tarea.
- Cuanto material se consume por m2.
- Cuantas unidades se necesitan segun cantidad.
- Que relacion hay entre una medida y un coste.

Campos:

- Nombre.
- Variable.
- Resultado por unidad.
- Unidad resultante.

Variables disponibles:

- m2.
- cantidad.
- metros lineales.

Ejemplos:

| Nombre | Variable | Resultado por unidad | Unidad resultante |
| --- | --- | --- | --- |
| Litros pintura por m2 y mano | m2 | 0,125 | litros |
| Horas pintura por m2 | m2 | 0,18 | horas |
| Horas cambio de grifo | cantidad | 1,2 | horas |
| Horas colocar suelo por m2 | m2 | 0,35 | horas |

Ejemplo explicado:

Si "Horas pintura por m2" vale 0,18 y el trabajo tiene 25 m2, Cotiza estima:

```text
25 x 0,18 = 4,5 horas
```

## 4. Plantillas De Trabajos

Una plantilla de trabajo es una receta reutilizable.

Ejemplos:

- Pintar habitacion.
- Cambiar grifo.
- Colocar suelo laminado.
- Cambiar foco.

Cada plantilla combina precios, consumos y tiempos.

### Crear Una Plantilla

En la seccion "Plantillas de trabajos":

1. Escribir el nombre del trabajo.
2. Escribir una descripcion breve.
3. Agregar partidas.
4. Guardar la plantilla.

Cada partida necesita:

- Precio asociado.
- Tipo de calculo.
- Rendimiento o variable directa.
- Multiplicador.

### Tipos De Calculo

Hay dos formas de calcular una partida.

**Usar rendimiento**

Sirve cuando ya existe una regla cargada.

Ejemplo:

- Precio asociado: Hora oficial.
- Calculo: Usar rendimiento.
- Rendimiento: Horas pintura por m2.
- Multiplicador: 1.

**Cantidad directa**

Sirve cuando la partida depende directamente de m2, cantidad o metros lineales.

Ejemplo:

- Precio asociado: Suelo laminado AC5.
- Calculo: Cantidad directa.
- Variable: m2.
- Multiplicador: 1,08.

Ese 1,08 puede representar un 8% adicional por merma.

### Editar O Duplicar

Cada plantilla se puede:

- Editar.
- Duplicar.

Duplicar sirve para crear variantes sin empezar de cero.

Ejemplo:

- Pintar habitacion.
- Pintar piso completo.
- Pintar local.

Consejo: para empezar mas facil, conviene duplicar una plantilla parecida y cambiarla. Es menos pesado que crear todo desde cero.

## 5. Presupuesto

En "Presupuesto" se crea el documento editable.

### Datos Del Presupuesto

Campos:

- Numero.
- Cliente.
- Direccion / obra.
- Validez.
- Fecha.
- Estado.

Estados disponibles:

- Borrador.
- Enviado.
- Aceptado.
- Rechazado.

El numero se propone automaticamente, pero se puede editar.

### Crear Presupuesto Base

Para crear un presupuesto:

1. Elegir una plantilla de trabajo.
2. Cargar superficie m2, cantidad o metros lineales segun corresponda.
3. Pulsar "Crear presupuesto base".

Cotiza genera partidas usando los precios, consumos y tiempos cargados.

Despues de calcular, Cotiza muestra una explicacion simple de cada partida. Por ejemplo:

```text
25 m2 x 0,18 horas por m2 = 4,5 horas
4,5 horas x 28 EUR = 126 EUR
```

La explicacion sirve para entender de donde sale el numero, pero el usuario siempre puede editar la linea antes de guardar o imprimir.

### Editar Partidas

Despues de calcular, las lineas se pueden:

- Editar.
- Reordenar.
- Quitar.
- Ajustar en cantidad.
- Ajustar en precio unitario.

Esto es importante: el resultado calculado es una base, no un presupuesto cerrado automaticamente.

### Agregar Lineas Extra

Se pueden agregar conceptos manuales que no esten en la plantilla.

Ejemplos:

- Retirada de escombros.
- Proteccion especial.
- Reparacion previa.
- Desplazamiento adicional.
- Ajuste manual.

## 6. Guardar Y Seguir Presupuestos

El boton "Guardar presupuesto" guarda el presupuesto actual en el historial local.

Desde "Presupuestos guardados" se puede:

- Abrir un presupuesto anterior.
- Cambiar su estado.
- Eliminarlo.
- Buscar por numero, cliente, direccion o notas.
- Filtrar por estado.

El resumen comercial muestra:

- Borradores.
- Enviados y total enviado.
- Aceptados y total aceptado.
- Rechazados.

Sin sesion, este historial es local del navegador. Con sesion iniciada, los presupuestos guardados tambien se sincronizan con Supabase.

## 7. Dashboard

En "Dashboard" se ven metricas simples de los presupuestos guardados.

Sirve para responder rapidamente:

- Cuantos presupuestos se hicieron en el periodo.
- Cuanto monto total se presupuesto.
- Que porcentaje esta pendiente, aceptado o rechazado.
- Que clientes concentran mas volumen.

El filtro de periodo permite revisar:

- Esta semana.
- Este mes.
- Ultimos 3 meses.

Los graficos muestran:

- Presupuestos por estado.
- Principales clientes por volumen presupuestado.

Importante:

- En modo local, el dashboard usa los presupuestos guardados en este navegador.
- Con sesion iniciada, el dashboard consulta los presupuestos guardados en Supabase para el negocio del usuario.
- Si no hay presupuestos guardados, el dashboard queda vacio hasta que se guarde al menos uno.

Turnia queda solo como estructura conceptual dentro de esta etapa. Las metricas reales de citas necesitan tablas propias de citas y servicios, por eso no se calculan todavia.

## 8. Clientes

En "Clientes" se arma una base simple a partir de los presupuestos guardados.

No hace falta cargar clientes a mano en esta etapa. Cotiza detecta el nombre del cliente desde cada presupuesto y muestra:

- Nombre.
- Telefono y email, si existen.
- Fecha de primer contacto.
- Cantidad de presupuestos.
- Volumen total presupuestado.

Tambien se puede:

- Buscar por nombre o telefono.
- Ordenar por volumen, fecha o nombre.
- Abrir un cliente para ver su historial de presupuestos.
- Revisar las partidas de cada presupuesto dentro del historial del cliente.

Con sesion iniciada, al guardar un presupuesto Cotiza crea o vincula automaticamente el cliente en la tabla `clients` de Supabase. Para evitar duplicados, primero busca un cliente del mismo negocio con el mismo nombre. Sin sesion, la base de clientes se arma desde los presupuestos locales del navegador.

Primer paso recomendado:

- Guardar dos o tres presupuestos de ejemplo con clientes distintos.
- Entrar a "Clientes".
- Buscar un cliente y revisar su historial.

## 9. Imprimir O Guardar PDF

El boton "Imprimir / Guardar PDF" abre la impresion del navegador.

Desde ahi se puede:

- Imprimir.
- Guardar como PDF.

Antes de imprimir conviene revisar:

- Datos del cliente.
- Numero.
- Fecha.
- Validez.
- Partidas.
- Cantidades.
- Precio unitario.
- Notas.
- Impuesto.
- Total.

La impresion muestra:

- Datos del negocio.
- Datos del cliente.
- Fecha.
- Partidas.
- Notas.
- Subtotal.
- Impuesto.
- Total.
- Condiciones comerciales basicas.

La impresion no muestra:

- Coste interno.
- Margen interno.
- Estado comercial interno.

## Tutorial: Crear Un Primer Presupuesto De Pintura

Este ejemplo sirve para entender el flujo completo.

### Paso 1: Revisar Configuracion

Ir a "Inicio" y cargar:

- Nombre del negocio.
- Moneda: EUR.
- Impuesto: 21.
- Margen: 20.

Pulsar "Guardar configuracion".

### Paso 2: Revisar Precios

Ir a "Precios" y asegurarse de tener:

- Pintura plastica interior.
- Material auxiliar pintura.
- Hora oficial.
- Desplazamiento urbano.

Si falta alguno, cargarlo manualmente.

### Paso 3: Revisar Consumos Y Tiempos

Ir a "Consumos y tiempos" y asegurarse de tener:

- Litros pintura por m2 y mano.
- Horas pintura por m2.
- Desplazamiento por trabajo.

### Paso 4: Usar Una Plantilla

Ir a "Presupuesto".

Elegir:

- Plantilla de trabajo: Pintar habitacion.
- Superficie m2: 25.
- Cantidad: 1.

Pulsar "Crear presupuesto base".

Cotiza deberia crear lineas similares a:

- Pintura plastica interior.
- Material auxiliar pintura.
- Hora oficial.
- Desplazamiento urbano.

### Paso 5: Ajustar El Presupuesto

Revisar:

- Cantidades.
- Precio unitario.
- Total de cada partida.
- Notas.

Agregar una linea extra si hace falta.

Ejemplo:

- Linea extra: Reparacion pequena de pared.
- Cantidad: 1.
- Unidad: unidad.
- Precio: 35.

### Paso 6: Guardar

Cargar:

- Cliente.
- Direccion / obra.
- Fecha.
- Validez.
- Estado: Borrador.

Pulsar "Guardar presupuesto".

### Paso 7: Cambiar Estado

Cuando se envie al cliente, cambiar estado a:

- Enviado.

Si el cliente acepta:

- Aceptado.

Si no avanza:

- Rechazado.

### Paso 8: Revisar Dashboard

Ir a "Dashboard" y comprobar:

- Total de presupuestos del periodo.
- Monto total presupuestado.
- Estados.
- Top clientes.

Si no aparece informacion, revisar que el presupuesto este guardado y que el filtro de periodo incluya la fecha del presupuesto.

### Paso 9: Revisar Clientes

Ir a "Clientes".

Buscar el cliente del presupuesto guardado y abrir su detalle para ver el historial.

### Paso 10: Imprimir O Guardar PDF

Pulsar "Imprimir / Guardar PDF".

Revisar la vista de impresion y guardar el PDF desde el navegador.

## Buenas Practicas

- Revisar siempre el presupuesto antes de enviarlo.
- Mantener precios actualizados.
- Ajustar consumos y tiempos segun experiencia real.
- Usar plantillas como base, no como verdad absoluta.
- Revisar Dashboard y Clientes despues de guardar presupuestos para detectar si la informacion comercial queda clara.
- Exportar backup si se cargaron datos importantes.
- No usar la demo como sistema fiscal, contable o legal.
- Imprimir solo despues de revisar el resultado final.

## Limites De La Demo Actual

- Los datos se guardan en el navegador.
- Hay login inicial con Supabase, pero todavia no hay roles avanzados ni panel de administracion.
- Sin login, la demo sigue usando almacenamiento local.
- Clientes se detecta desde presupuestos; todavia no es un CRM completo.
- Dashboard muestra metricas comerciales basicas, no analitica avanzada.
- Turnia no tiene metricas reales hasta que existan tablas de citas y servicios.
- No hay facturacion.
- No hay contabilidad.
- No hay control de obra.
- No hay importador de Excel todavia.

La demo sirve para validar el flujo central de Cotiza: cargar datos propios, calcular una base editable y generar un presupuesto ordenado.
