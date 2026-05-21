# Manual De Uso - Cotiza

## Que Es Cotiza

Cotiza es una herramienta para crear presupuestos de reformas, oficios y trabajos tecnicos a partir de datos controlados por el usuario.

La idea principal es:

> Precios + Rendimientos + Trabajos tipo = Presupuesto base editable.

Cotiza no inventa precios ni decide por el usuario. Calcula una base usando la informacion cargada y deja que la persona revise, edite y cierre el presupuesto.

## Como Esta Organizada La App

La demo tiene cinco secciones principales:

- Inicio.
- Precios.
- Rendimientos.
- Trabajos tipo.
- Presupuesto.

Conviene usarlas en ese orden la primera vez.

## 1. Inicio

En "Inicio" se cargan los datos generales del negocio.

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

## 3. Rendimientos

En "Rendimientos" se cargan reglas simples para estimar cantidades o tiempos.

Un rendimiento responde preguntas como:

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

## 4. Trabajos Tipo

Un trabajo tipo es una plantilla reutilizable.

Ejemplos:

- Pintar habitacion.
- Cambiar grifo.
- Colocar suelo laminado.
- Cambiar foco.

Cada trabajo tipo combina precios y rendimientos.

### Crear Un Trabajo Tipo

En la seccion "Trabajos tipo":

1. Escribir el nombre del trabajo.
2. Escribir una descripcion breve.
3. Agregar partidas.
4. Guardar el trabajo tipo.

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

Cada trabajo tipo se puede:

- Editar.
- Duplicar.

Duplicar sirve para crear variantes sin empezar de cero.

Ejemplo:

- Pintar habitacion.
- Pintar piso completo.
- Pintar local.

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

### Calcular Base

Para crear un presupuesto:

1. Elegir un trabajo tipo.
2. Cargar superficie m2, cantidad o metros lineales segun corresponda.
3. Pulsar "Calcular base".

Cotiza genera partidas usando los precios y rendimientos cargados.

### Editar Partidas

Despues de calcular, las lineas se pueden:

- Editar.
- Reordenar.
- Quitar.
- Ajustar en cantidad.
- Ajustar en precio unitario.

Esto es importante: el resultado calculado es una base, no un presupuesto cerrado automaticamente.

### Agregar Lineas Extra

Se pueden agregar conceptos manuales que no esten en el trabajo tipo.

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

Este historial es local de la demo. No es una base de datos en la nube.

## 7. Imprimir O Guardar PDF

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

### Paso 3: Revisar Rendimientos

Ir a "Rendimientos" y asegurarse de tener:

- Litros pintura por m2 y mano.
- Horas pintura por m2.
- Desplazamiento por trabajo.

### Paso 4: Usar Trabajo Tipo

Ir a "Presupuesto".

Elegir:

- Trabajo tipo: Pintar habitacion.
- Superficie m2: 25.
- Cantidad: 1.

Pulsar "Calcular base".

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

### Paso 8: Imprimir O Guardar PDF

Pulsar "Imprimir / Guardar PDF".

Revisar la vista de impresion y guardar el PDF desde el navegador.

## Buenas Practicas

- Revisar siempre el presupuesto antes de enviarlo.
- Mantener precios actualizados.
- Ajustar rendimientos segun experiencia real.
- Usar trabajos tipo como base, no como verdad absoluta.
- Exportar backup si se cargaron datos importantes.
- No usar la demo como sistema fiscal, contable o legal.
- Imprimir solo despues de revisar el resultado final.

## Limites De La Demo Actual

- Los datos se guardan en el navegador.
- No hay usuarios ni contrasenas.
- No hay sincronizacion en la nube.
- No hay facturacion.
- No hay contabilidad.
- No hay control de obra.
- No hay importador de Excel todavia.

La demo sirve para validar el flujo central de Cotiza: cargar datos propios, calcular una base editable y generar un presupuesto ordenado.
