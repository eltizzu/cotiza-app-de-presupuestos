# Resumen Legal Y Fiscal Inicial - Cotiza

## Aviso

Este documento es una orientacion inicial de producto. No sustituye asesoramiento legal, fiscal ni contable profesional.

## Riesgos a contemplar

Cotiza ayuda a preparar presupuestos, pero el usuario sigue siendo responsable de:

- Verificar precios.
- Aplicar impuestos correctos.
- Confirmar normativas aplicables.
- Revisar mediciones.
- Validar condiciones comerciales.
- Emitir facturas si corresponde usando herramientas o procesos adecuados.

## Enfoque recomendado

La app debe presentarse como una herramienta de apoyo para calculo y organizacion de presupuestos, no como asesor fiscal, tecnico o legal.

## Impuestos

En V1 se permite configurar un impuesto por defecto, por ejemplo IVA, pero deben evitarse promesas de automatizacion fiscal completa.

El usuario debe revisar si el impuesto aplicado corresponde a su actividad, ubicacion, cliente y tipo de trabajo. La demo no determina regimen fiscal ni excepciones.

## Condiciones del presupuesto

La demo ya incluye condiciones comerciales basicas en la impresion. Mas adelante deberia permitir editar textos como:

- Validez temporal del presupuesto.
- Alcance incluido y excluido.
- Forma de pago.
- Plazos estimados.
- Condiciones de modificacion por imprevistos.

## Datos personales

La demo permite escribir datos basicos de cliente y direccion/obra. Actualmente esos datos quedan guardados localmente en el navegador del usuario mediante almacenamiento local.

Si Cotiza pasa a ser SaaS, app con cuentas o herramienta con sincronizacion, habra que definir:

- Responsable del tratamiento.
- Finalidad del tratamiento.
- Base legal.
- Conservacion de datos.
- Derechos del usuario.
- Encargados externos si hay hosting, analitica, pagos o email.
- Medidas de seguridad.

## Backup local

La exportacion genera un archivo JSON con datos locales. El usuario es responsable de guardar ese archivo de forma segura, especialmente si contiene datos de clientes, direcciones o importes comerciales.
