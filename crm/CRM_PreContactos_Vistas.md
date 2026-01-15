# Documentación de Vistas del Módulo CRM Pre-Contactos

Este documento detalla las vistas parciales que se cargan dinámicamente en la sección de "Centro de gestionamiento" (`modo == 3`) del módulo de Pre-Contactos, basado en el `OrigenPreContactoID`.

## Resumen General

El sistema utiliza la directiva `ng-include` con la variable `ViewsCRM` para cargar una vista principal (`.html`). La mayoría de las "sub-vistas" mencionadas a continuación son en realidad **secciones dentro de este archivo HTML principal**, que se muestran u ocultan dinámicamente con `ng-show` o `ng-if`, y no archivos `.html` separados cargados vía `ng-include`.

En total, hay **8 vistas principales** distintas que se cargan en esta sección.

**Importante:** Se ha observado que existen secciones con funcionalidad y apariencia muy similares (como la sección "Inmuebles de interés" en las vistas de GBI Arrendatarios y GBI Ventas). Sin embargo, estas secciones no están implementadas como componentes reutilizables. En su lugar, el código HTML y la lógica asociada han sido duplicados con ligeras adaptaciones para cada contexto específico. Esto implica que cambios en una de estas secciones no se reflejarán automáticamente en las otras, y cada instancia debe ser mantenida de forma independiente.

### Nota sobre Nomenclatura
Los títulos de cada sección a continuación utilizan los nombres "técnicos" derivados de las carpetas en el código fuente (ej. `GBIPropietarios`). Entre paréntesis se incluye el nombre "de negocio" correspondiente que se encuentra en la base de datos (ej. `Captaciones`) para mayor claridad.

---

## Vistas por Origen de Pre-Contacto

### Endpoints Consultados:
Los endpoints se listan con el prefijo de la variable de ámbito (`$scope.serviceBase...`) que indica el microservicio o área de la API a la que pertenecen, seguido de la ruta específica del endpoint.

- `serviceBaseSIS`: Sistema (recursos compartidos).
- `serviceBaseCRM`: Módulo CRM.
- `serviceBaseSTRG`: Módulo de Almacenamiento.
- `serviceBaseGBI`: Módulo de Gestión de Bienes Inmuebles.
- `serviceBaseFAC`: Módulo de Facturación.
- `serviceBaseFIN`: Módulo Financiero.
- `serviceBaseSGD`: Módulo de Gestión Documental.
- `serviceBaseCOM`: Módulo de Comunicaciones.
- `CDNEndPoint`: CDN (Content Delivery Network) para gestión de archivos.

### OrigenPreContactoID: 1 - StorageFull (Storage avanzado)
- **Vista Principal:** `StorageFull/View.html`
- **Controlador:** `ControllerStorageFull.js`
- **Descripción:** Gestiona el proceso completo para servicios de almacenamiento (bodegaje), incluyendo aspectos contractuales y de facturación.
- **Sub-Vistas / Paneles Principales (secciones dentro de `StorageFull/View.html`):**
    - Formato de vinculación
    - Formato de seguro
    - Cotizaciones
    - Órdenes de Servicio
    - Códigos de Barras (Prefacturas)
    - Facturas
- **Vistas Adicionales Incluidas (externas vía `ng-include`):**
    - `ModalReservacion.html` (Ruta: `/js/Areas/STRG/Complejos/ModalReservacion.html`)
- **Endpoints Consultados:**
    - `serviceBaseSTRG/.../Segmentos/SegmentosConsultar`
    - `serviceBaseCRM/.../Campañas/CampañasConsultar`
    - `serviceBaseSTRG/.../SeriesOrdenesServiciosBodegaje/SeriesOrdenesServiciosBodegajeConsultar`
    - `serviceBaseSGD/.../Tipologias/TipologiasConsultar`
    - `serviceBaseCRM/.../PlantillasDocumentos/PlantillasDocumentosConsultar`
    - `serviceBaseSTRG/.../PlantillasDocumentos/PlantillasDocumentosConsultar`
    - `serviceBaseCRM/.../Convenios/ConveniosConsultar`
    - `serviceBaseSTRG/.../CotizacionesBodegaje/CotizacionBodegajeDetalladoConsultar`
    - `serviceBaseSTRG/.../TiposProductosVariables/TiposProductosVariablesConsultar`
    - `serviceBaseSIS/.../Productos/ProductosConsultar`
    - `serviceBaseSTRG/.../OrigenesCotizaciones/OrigenesCotizacionesConsultar`
    - `serviceBaseSTRG/.../MediosTransporte/MediosTransporteConsultar`
    - `CDNEndPoint/.../Files/CommitFile`
    - `CDNEndPoint/.../Files/DeleteFile`
    - `CDNEndPoint/.../Files/FileBase64`
    - `CDNEndPoint/.../Images/UploadImage`
    - `serviceBaseSTRG/.../CotizacionesBodegaje/CotizacionesBodegajeInsertar`
    - `serviceBaseSTRG/.../CotizacionesBodegaje/CotizacionesBodegajeActualizar`
    - `serviceBaseSTRG/.../CotizacionesBodegaje/CotizacionesBodegajeAprobar`
    - `serviceBaseSIS/.../Cotizaciones/ReversionAprobacionCotizaciones`
    - `serviceBaseCOM/.../CuentasMensajeriaMensajes/CuentasMensajeriaMensajesEnviar`
    - `serviceBaseSTRG/.../OrdenesServiciosBodegaje/OrdenServicioBodegajeDetalladoConsultar`
    - `serviceBaseSIS/.../Paises/PaisesConsultar`
    - `serviceBaseSIS/.../Ciudades/CiudadesComboConsultar`
    - `serviceBaseSTRG/.../Rutas/RutasConsultar`
    - `serviceBaseSTRG/.../OrdenesServiciosBodegaje/OrdenesServiciosBodegajeInsertar`
    - `serviceBaseSTRG/.../OrdenesServiciosBodegaje/OrdenesServiciosBodegajeActualizar`
    - `serviceBaseSTRG/.../OrdenesServiciosBodegaje/OrdenesServiciosBodegajeAprobarStandar`
    - `serviceBaseSTRG/.../OrdenesServiciosBodegaje/EliminarBodegasReservadas`
    - `serviceBaseGBI/.../ContratosBodegas/ContratosBodegasCambioBodegaConsultar`
    - `serviceBaseSTRG/.../OrdenesServiciosBodegaje/OrdenesServiciosBodegajeCambioBodega`
    - `serviceBaseSIS/.../Terceros/TerceroDetalladoConsultar`

### OrigenPreContactoID: 2 - GBIPropietarios (Captaciones)
- **Vista Principal:** `GBIPropietarios/View.html`
- **Controlador:** `ControllerGBIPropietarios.js`
- **Descripción:** Gestiona el proceso de captación de inmuebles de propietarios.
- **Sub-Vistas / Paneles Principales (secciones dentro de `GBIPropietarios/View.html`):**
    - Propuestas comerciales
    - Cupones de pagos
    - Facturas
    - Captación del inmueble (Ficha del inmueble, fotos, características)
    - Contratos de mandato o corretaje
    - Publicación en portales inmobiliarios.
- **Endpoints Consultados:**
    - `serviceBaseGBI/.../Configuraciones/ConfiguracionesConsultar`
    - `serviceBaseSIS/.../Estratos/EstratosConsultar`
    - `serviceBaseGBI/.../UsosInmuebles/UsosInmueblesConsultar`
    - `serviceBaseGBI/.../CondicionesInmuebles/CondicionesInmueblesConsultar`
    - `serviceBaseGBI/.../TarifasComisiones/TarifasComisionesConsultar`
    - `serviceBaseSIS/.../Impuestos/ComboImpuestosConsultar`
    - `serviceBaseCRM/.../PlantillasDocumentos/PlantillasDocumentosConsultar`
    - `serviceBaseGBI/.../TiposOfertas/TiposOfertasConsultar`
    - `serviceBaseGBI/.../ConfiguracionesDocumentosInmuebles/ConfiguracionesDocumentosInmueblesConsultar`
    - `serviceBaseGBI/.../ResponsablesPagoAdministracion/ResponsablesPagoAdministracionConsultar`
    - `serviceBaseGBI/.../ConfiguracionesInventarios/ConfiguracionesInventariosConsultar`
    - `serviceBaseSIS/.../Productos/ProductosConsultar`
    - `serviceBaseSIS/.../Impuestos/CalcularImpuestosProductosCotizaciones`
    - `serviceBaseSIS/.../Cotizaciones/CotizacionDetalladoConsultar`
    - `serviceBaseCRM/.../Cotizaciones/CotizacionesAprobar`
    - `serviceBaseSIS/.../Cotizaciones/ReversionAprobacionCotizaciones`
    - `serviceBaseCOM/.../CuentasMensajeriaMensajes/CuentasMensajeriaMensajesEnviar`
    - `serviceBaseFAC/.../FacturasInmuebles/GenerarCuponPagoInmuebles`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesEnviarOperacionesMandato`
    - `serviceBaseGBI/.../Inmuebles/NotificarInmuebleCorreo`
    - `serviceBaseGBI/.../Inmuebles/InmueblesDuplicar`
    - `serviceBaseGBI/.../Inmuebles/InmueblesEliminar`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesAnular`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesProcesosContratoMandatoConsultar`
    - `serviceBaseSIS/.../Terceros/TerceroDetalladoConsultar`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesProcesosSolicitarContratoMandato`
    - `CDNEndPoint/.../Files/CommitFile`
    - `CDNEndPoint/.../Files/DeleteFile`
    - `serviceBaseGBI/.../InmueblesInventarios/InmueblesInventariosInsertar`
    - `serviceBaseGBI/.../InmueblesInventarios/InmueblesInventariosActualizar`
    - `serviceBaseGBI/.../InmueblesInventarios/InmueblesInventariosDetalladoConsultar`
    - `serviceBaseGBI/.../InmueblesInventarios/CargarInmuebleInventarioPDF`
    - `serviceBaseGBI/.../ConfiguracionesInventarios/ConfiguracionesInventariosDetalladoConsultar`
    - `CDNEndPoint/.../Images/UploadImage`
    - `CDNEndPoint/.../Files/FileBase64`

### OrigenPreContactoID: 3 - Standard (Clientes)
- **Vista Principal:** `Standard/View.html`
- **Controlador:** `ControllerStandard.js`
- **Descripción:** Una vista genérica y simplificada para contactos que no encajan en las otras categorías especializadas.
- **Sub-Vistas / Paneles Principales (secciones dentro de `Standard/View.html`):**
    - Cotizaciones
    - Facturas.
- **Endpoints Consultados:**
    - `serviceBaseFAC/.../TiposFacturas/TiposFacturasConsultar`
    - `serviceBaseSIS/.../Impuestos/ComboImpuestosConsultar`
    - `serviceBaseCRM/.../PlantillasDocumentos/PlantillasDocumentosConsultar`
    - `serviceBaseSIS/.../FormasPagos/FormasPagosConsultar`
    - `serviceBaseSIS/.../Productos/ProductosConsultar`
    - `serviceBaseSIS/.../Impuestos/CalcularImpuestosProductosCotizaciones`
    - `serviceBaseSIS/.../Cotizaciones/CotizacionDetalladoConsultar`
    - `serviceBaseSIS/.../Cotizaciones/CotizacionesInsertar`
    - `serviceBaseSIS/.../Cotizaciones/CotizacionesActualizar`
    - `serviceBaseSIS/.../Cotizaciones/CotizacionesEliminar`
    - `serviceBaseCRM/.../Cotizaciones/CotizacionesAprobar`
    - `serviceBaseSIS/.../Cotizaciones/ReversionAprobacionCotizaciones`
    - `serviceBaseCOM/.../CuentasMensajeriaMensajes/CuentasMensajeriaMensajesEnviar`
    - `serviceBaseSIS/.../Terceros/TerceroDetalladoConsultar`
    - `serviceBaseCRM/.../Cotizaciones/GenerarFacturasDesdeCotizacion`
    - `serviceBaseSIS/.../Paises/PaisesConsultar`
    - `serviceBaseSIS/.../Ciudades/CiudadesComboConsultar`
    - `serviceBaseSIS/.../ResponsabilidadesTributarias/ResponsabilidadesTributariasConsultar`

### OrigenPreContactoID: 4 - GBIArrendatarios (Arrendatarios)
- **Vista Principal:** `GBIArrendatarios/View.html`
- **Controlador:** `ControllerArrendatarios.js`
- **Descripción:** Gestiona el proceso para clientes interesados en arrendar un inmueble.
- **Sub-Vistas / Paneles Principales (secciones dentro de `GBIArrendatarios/View.html`):**
    - Inmuebles de interés
    - Documentos para la solicitud de contrato
    - Proceso de arrendamiento
    - Contratos y documentos (incluye inventario y actas de entrega)
    - Cupones de pago y Facturas.
- **Endpoints Consultados:**
    - `serviceBaseGBI/.../TiposOfertas/TiposOfertasConsultar`
    - `serviceBaseGBI/.../TiposInmuebles/TiposInmueblesConsultar`
    - `serviceBaseGBI/.../AntiguedadesInmuebles/AntiguedadesInmueblesConsultar`
    - `serviceBaseGBI/.../ConfiguracionesInventarios/ConfiguracionesInventariosConsultar`
    - `serviceBaseGBI/.../Configuraciones/ConfiguracionesConsultar`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesProcesosAsociar`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesDisponiblesConsultar`
    - `serviceBaseGBI/.../InmueblesInventarios/InmueblesInventariosConsultar`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesProcesosActualizar`
    - `serviceBaseCRM/.../Inmuebles/ReservarProcesoInmueble`
    - `serviceBaseCRM/.../Inmuebles/LiberarProcesoInmueble`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesProcesosIniciarArrendamiento`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesProcesosReversarArrendamiento`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesProcesosDocumentosConsultar`
    - `serviceBaseGBI/.../Aseguradoras/AseguradorasConsultar`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesProcesosDocumentosActualizar`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesProcesosEnviarOperaciones`
    - `serviceBaseFAC/.../FacturasInmuebles/GenerarCuponPagoSeparacionInmuebles`
    - `serviceBaseGBI/.../ContratosInventarios/ContratosInventariosInsertar`
    - `serviceBaseGBI/.../ContratosInventarios/ContratosInventariosActualizar`
    - `serviceBaseGBI/.../ContratosInventarios/ContratosInventariosDetalladoConsultar`
    - `serviceBaseGBI/.../ContratosInventarios/CargarContratoInventarioPDF`
    - `serviceBaseGBI/.../Contratos/ContratosActaEntrega`

### OrigenPreContactoID: 5 - GBIVentas (Ventas)
- **Vista Principal:** `GBIVentas/View.html`
- **Controlador:** `ControllerGBIVentas.js`
- **Descripción:** Gestiona el proceso para clientes interesados en comprar un inmueble.
- **Sub-Vistas / Paneles Principales (secciones dentro de `GBIVentas/View.html`):**
    - Inmuebles de interés
    - Ofertas y contraofertas del inmueble
    - Condiciones de pago del inmueble
    - Documentos cargados (incluye promesa de venta)
    - Actividades del proceso de venta (escrituración, etc.).
- **Endpoints Consultados:**
    - `serviceBaseGBI/.../Configuraciones/ConfiguracionesConsultar`
    - `serviceBaseGBI/.../TiposInmuebles/TiposInmueblesConsultar`
    - `serviceBaseGBI/.../AntiguedadesInmuebles/AntiguedadesInmueblesConsultar`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/FormasPagosComprasInmueblesConsultar`
    - `serviceBaseSIS/.../TiposCalendariosActividades/TiposCalendariosActividadesConsultar`
    - `serviceBaseGBI/.../TarifasComisiones/TarifasComisionesConsultar`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesProcesosAsociar`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesDisponiblesConsultar`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesProcesosActualizar`
    - `serviceBaseCRM/.../Inmuebles/ReservarProcesoInmueble`
    - `serviceBaseCRM/.../Inmuebles/LiberarProcesoInmueble`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesProcesosReversarCompra`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesProcesosProcesosComprasConsultar`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesProcesosIniciarCompra`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesAceptarOfertaCompra`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesProcesosCargarPromesaVenta`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesProcesosNotificarComisionVenta`
    - `serviceBaseGBI/.../InmueblesProcesosProcesos/InmueblesProcesosNotificacionSagrlaf`
    - `serviceBaseSIS/.../CalendariosActividades/CalendariosActividadesInsertar`
    - `serviceBaseSIS/.../CalendariosActividades/CalendariosActividadesActualizar`
    - `serviceBaseSIS/.../CalendariosActividades/CalendariosActividadesCerrar`

### OrigenPreContactoID: 6 - Storage (Storage estandar)
- **Vista Principal:** `Storage/View.html`
- **Controlador:** `ControllerStorage.js`
- **Descripción:** Versión más sencilla para servicios de almacenamiento que la `StorageFull`.
- **Sub-Vistas / Paneles Principales (secciones dentro de `Storage/View.html`):**
    - Cotizaciones
    - Órdenes de Servicio
    - Códigos de Barras (Prefacturas)
    - Facturas
- **Vistas Adicionales Incluidas (externas vía `ng-include`):**
    - `ModalReservacion.html` (Ruta: `/js/Areas/STRG/Complejos/ModalReservacion.acion.html`)
- **Endpoints Consultados:**
    - `serviceBaseSTRG/.../Segmentos/SegmentosConsultar`
    - `serviceBaseCRM/.../Campañas/CampañasConsultar`
    - `serviceBaseSTRG/.../SeriesOrdenesServiciosBodegaje/SeriesOrdenesServiciosBodegajeConsultar`
    - `serviceBaseSGD/.../Tipologias/TipologiasConsultar`
    - `serviceBaseSTRG/.../PlantillasDocumentos/PlantillasDocumentosConsultar`
    - `serviceBaseCRM/.../PlantillasDocumentos/PlantillasDocumentosConsultar`
    - `serviceBaseSIS/.../FormasPagos/FormasPagosConsultar`
    - `serviceBaseCOM/.../PlantillasEmail/PlantillasEmailConsultar`
    - `serviceBaseSTRG/.../CotizacionesBodegaje/CotizacionBodegajeDetalladoConsultar`
    - `serviceBaseSTRG/.../SegmentosCategorias/SegmentosCategoriasPlanoConsultar`
    - `serviceBaseSTRG/.../SegmentosCategorias/SegmentosArticulosConsultar`
    - `serviceBaseSIS/.../Productos/ProductosConsultar`
    - `serviceBaseSTRG/.../MediosTransporte/MediosTransporteConsultar`
    - `serviceBaseSTRG/.../Rutas/RutasConsultar`
    - `CDNEndPoint/.../Files/CommitFile`
    - `CDNEndPoint/.../Files/DeleteFile`
    - `serviceBaseSTRG/.../CotizacionesBodegaje/CotizacionesBodegajeInsertar`
    - `serviceBaseSTRG/.../CotizacionesBodegaje/CotizacionesBodegajeActualizar`
    - `serviceBaseSIS/.../Cotizaciones/ReversionAprobacionCotizaciones`
    - `serviceBaseSTRG/.../CotizacionesBodegaje/CotizacionesBodegajeAprobar`
    - `serviceBaseCOM/.../CuentasMensajeriaMensajes/CuentasMensajeriaMensajesEnviar`
    - `serviceBaseSTRG/.../OrdenesServiciosBodegaje/OrdenServicioBodegajeDetalladoConsultar`
    - `serviceBaseSTRG/.../OrdenesServiciosBodegaje/OrdenesServiciosBodegajeInsertar`
    - `serviceBaseSTRG/.../OrdenesServiciosBodegaje/OrdenesServiciosBodegajeActualizar`
    - `serviceBaseSTRG/.../OrdenesServiciosBodegaje/OrdenesServiciosBodegajeAprobarStandar`
    - `serviceBaseSTRG/.../OrdenesServiciosBodegaje/EliminarBodegasReservadas`
    - `serviceBaseSTRG/.../OrdenesServiciosBodegaje/OrdenesServiciosBodegajeArchivosInsertar`
    - `serviceBaseSTRG/.../OrdenesServiciosBodegaje/OrdenesServiciosBodegajeArchivosEliminar`
    - `serviceBaseSIS/.../Terceros/TerceroDetalladoConsultar`

### OrigenPreContactoID: 7 - Avaluos (Avaluos)
Este origen se divide en dos, según el `TipoAvaluoID`.

####  TipoAvaluoID: 1 (Avalúo en Línea)
- **Vista Principal:** `AvaluosLinea/View.html`
- **Controlador:** `ControllerAvaluosLinea.js`
- **Descripción:** Flujo de trabajo simplificado para avalúos en línea.
- **Sub-Vistas / Paneles Principales (secciones dentro de `AvaluosLinea/View.html`):**
    - Gestión de Cupones de pago.
- **Endpoints Consultados:**
    - `serviceBaseFAC/.../Facturas/TiposOperacionesConsultar`
    - `serviceBaseFAC/.../TiposPreFacturas/TiposPreFacturasConsultar`
    - `serviceBaseFAC/.../OrigenesFacturas/OrigenesFacturasConsultar`
    - `serviceBaseSIS/.../TipoPersonas/TipoPersonasConsultar`
    - `serviceBaseSIS/.../TipoDocumentos/TipoDocumentosConsultar`
    - `serviceBaseGBI/.../TiposOfertas/TiposOfertasConsultar`
    - `serviceBaseSIS/.../ResponsabilidadesTributarias/ResponsabilidadesTributariasConsultar`
    - `serviceBaseFAC/.../PreFacturas/PreFacturasDetalladoConsultar`
    - `serviceBaseFAC/.../PreFacturas/PreFacturasInsertar`
    - `serviceBaseFAC/.../PreFacturas/PreFacturasActualizar`
    - `serviceBaseFAC/.../PreFacturas/PreFacturasEliminar`
    - `serviceBaseSIS/.../Terceros/TerceroDetalladoConsultar`
    - `serviceBaseSIS/.../Paises/PaisesConsultar`
    - `serviceBaseSIS/.../Ciudades/CiudadesComboConsultar`
    - `serviceBaseFIN/.../CentrosCostos/CentrosCostosPlanoConsultar`
    - `serviceBaseSIS/.../Impuestos/CalcularImpuestosProductosPreFacturas`
    - `serviceBaseFAC/.../PreFacturas/PreFacturasAnular`

#### TipoAvaluoID: != 1 (Avalúo Certificado)
- **Vista Principal:** `AvaluosCertificados/View.html`
- **Controlador:** `ControllerAvaluosCertificados.js`
- **Descripción:** Flujo de trabajo para avalúos que requieren un proceso más detallado.
- **Sub-Vistas / Paneles Principales (secciones dentro de `AvaluosCertificados/View.html`):**
    - Cotizaciones
    - Cupones de pago.
- **Endpoints Consultados:**
    - `serviceBaseFAC/.../TiposPreFacturas/TiposPreFacturasConsultar`
    - `serviceBaseGBI/.../TiposOfertas/TiposOfertasConsultar`
    - `serviceBaseSIS/.../Impuestos/ComboImpuestosConsultar`
    - `serviceBaseCRM/.../PlantillasDocumentos/PlantillasDocumentosConsultar`
    - `serviceBaseSIS/.../Productos/ProductosConsultar`
    - `serviceBaseSIS/.../Impuestos/CalcularImpuestosProductosCotizaciones`
    - `serviceBaseSIS/.../Cotizaciones/CotizacionDetalladoConsultar`
    - `serviceBaseSIS/.../Cotizaciones/CotizacionesInsertar`
    - `serviceBaseSIS/.../Cotizaciones/CotizacionesActualizar`
    - `serviceBaseSIS/.../Cotizaciones/CotizacionesEliminar`
    - `serviceBaseCRM/.../Cotizaciones/CotizacionesAprobar`
    - `serviceBaseSIS/.../Cotizaciones/ReversionAprobacionCotizaciones`
    - `serviceBaseFAC/.../PreFacturas/PreFacturasInsertar`
