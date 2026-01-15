ERP.controller("ControllerStorageFull", ['$scope', '$timeout', '$q', 'Services', '$filter', 'alertify', function ($scope, $timeout, $q, Services, $filter, alertify) {
    $scope.MailModel = {};
    $scope.ModoView = 1;
    $scope.SIoNo = [{ ID: null, Nombre: " -- Seleccione -- " }, { ID: true, Nombre: "SI" }, { ID: false, Nombre: "NO" }];

    $scope.options = {
        height: 100,
        toolbar: [
            ['edit', ['undo', 'redo']],
            ['headline', ['style']],
            ['style', ['bold', 'italic', 'underline', 'superscript', 'subscript', 'strikethrough', 'clear']],
            ['fontface', ['fontname']],
            ['textsize', ['fontsize']],
            ['fontclr', ['color']],
            ['alignment', ['ul', 'ol', 'paragraph', 'lineheight']],
            ['height', ['height']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video', 'hr']],
            ['view', ['fullscreen', 'codeview']],
            ['help', ['help']]
        ]
    };

    $scope.MailOptions = {        
        Title: "Enviar documento por correo electronico",
        RefScope: $scope,
        CargarFirma: true,
        TipoFirmaID: 7,
    };

    $scope.viewer = {
        Token: $scope.Usuario.Token,        
        CDNEndPoint: $scope.Usuario.CDNEndPoint,
        CDNLlavePublica: $scope.Usuario.CDNLlavePublica
    };

    $scope.Init = function () {
        $scope.ModoView = 1;
        $scope.ConsultarCombos();
    };
        
    $scope.AtrasModoView = function () {
        $scope.ModoView = 1;
        $scope.MostrarHeaderPrincipal(true);
    };

    $scope.ConsultarCombos = function () {        
        Services.Async(
            $scope.serviceBaseSTRG + "Segmentos/SegmentosConsultar/",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ SegmentoID: null, Descripcion: " -- Seleccione -- " });
                $scope.Segmentos = response.rows;
            }
        );
        Services.Async(
            $scope.serviceBaseCRM + "Campañas/CampañasConsultar/",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token, Aplicable: true },
            function (response) {
                response.rows.unshift({ CampanaID: null, Nombre: " -- Seleccione -- " });
                $scope.Campanas = response.rows;
            }
        );        
        Services.Async(
            $scope.serviceBaseSTRG + "SeriesOrdenesServiciosBodegaje/SeriesOrdenesServiciosBodegajeConsultar/",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ SerieID: null, DescripcionSerie: " -- Seleccione -- " });
                $scope.SeriesOrdenesServiciosBodegaje = response.rows;
            }
        );        
        Services.Async(
            $scope.serviceBaseSGD + "Tipologias/TipologiasConsultar/",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                $scope.Tipologias = response.rows;
            }
        );       
        Services.Async(
            $scope.serviceBaseCRM + "PlantillasDocumentos/PlantillasDocumentosConsultar/",
            { Rows: 0, Page: 0, TiposDocumentosID: 1, SucursalID: $scope.Usuario.SucursalID },
            function (response) {
                response.rows.unshift({ PlantillaDocumentoID: null, Nombre: " -- Seleccione -- " });
                $scope.CotizacionesPlantillasDocumentos = response.rows;
            }
        );
        Services.Async(
            $scope.serviceBaseSTRG + "PlantillasDocumentos/PlantillasDocumentosConsultar/",
            { Rows: 0, Page: 0, TipoDocumentoID: 3, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ PlantillaDocumentoID: null, Nombre: " -- Seleccione -- " });
                $scope.OrdenServicioPlantillasDocumentos = response.rows;
            }
        );
        Services.Async(
            $scope.serviceBaseCRM + "Convenios/ConveniosConsultar/",
            { Rows: 0, Page: 0, Activo: true, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ ConvenioID: null, Nombre: " -- Seleccione -- " });
                $scope.Convenios = response.rows;
            }
        );
    };

    $scope.DireccionOptions = {
        InputID: "ContactoDireccion",
        RefScope: $scope,
    };

    $scope.cargarDireciones = function (Direccion) {
        $scope.Direcciones = Direccion;
    };

    $scope.BodegasModel = {};

    $scope.BodegasOptions = {
        ModalID: "ModalBodegasDisponibles",
        Title: "Disponibilidad de bodegas",
        RefScope: $scope,
    };

    $scope.AbrirModalDisponibilidadBodegas = function (Direccion) {
        $scope.BodegasModel = Direccion;
        $("#ModalBodegasDisponibles").modal("show");
    };

    $scope.ArrayFalse = function (array) {
        angular.forEach(array, function (elem) {
            elem.Eliminar = false;
        })
    };

    $scope.InitObjectCotizacion = function () {
        $scope.Variable = {
            CotizacionBodegajeAlcanceID: null,
            TipoProductoID: null,
            TipoProductoVariableID: null,
            Eliminar: false
        };
        $scope.CopyVariable = angular.copy($scope.Variable);
        $scope.Origen = {
            CotizacionDireccionID: null,
            Origen: true,
            Eliminar: false
        };
        $scope.CopyOrigen = angular.copy($scope.Origen);
        $scope.Destino = {
            CotizacionDireccionID: null,
            Origen: false,
            Eliminar: false
        };
        $scope.CopyDestino = angular.copy($scope.Destino);
        $scope.Servicio = {
            CotizacionProductoID: null,
            ProductoID: null,
            Descripcion: null,
            Cantidad: 1,            
            PrecioDiario: 0,            
            ValorUnitarioDescuento: null,
            ValorTotal: 0,
            Eliminar: false
        };
        $scope.CopyServicio = angular.copy($scope.Servicio);
        $scope.NoServicio = {
            CotizacionProductoID: null,
            ProductoID: null,
            Descripcion: null,
            Cantidad: 1,
            ValorTotal: 0,
            Eliminar: false
        };
        $scope.CopyNoServicio = angular.copy($scope.NoServicio);       
        $scope.Archivo = {
            ArchivoID: null,
            SerieID: null,
            Eliminar: false
        };
        $scope.CopyArchivo = angular.copy($scope.Archivo);
        $scope.Material = {
            CotizacionBodegajeMaterialID: null,
            ProductoID: null,
            Cantidad: null,
            Eliminar: false
        };
        $scope.CopyMaterial = angular.copy($scope.Material);
    };

    $scope.AbrirNuevaCotizacion = function () {
        $scope.MostrarProgress(true);
        $scope.Cotizacion = angular.extend({}, angular.copy($scope.PreContacto));
        $scope.Cotizacion.DirIP = $scope.Usuario.Ip;
        $scope.Cotizacion.Usuario = $scope.Usuario.UsuarioID;
        $scope.Cotizacion.Token = $scope.Usuario.Token;
        if ($scope.Cotizacion.ClienteTipoPersonaID != null)
            $scope.ChangeTipoPersona($scope.Cotizacion);
        else
            $scope.Cotizacion.ShowTipoPersona = true;
        if ($scope.Cotizacion.Observaciones != null)
            $scope.Cotizacion.Observaciones = $scope.HtmlToText($scope.Cotizacion.Observaciones);
        $scope.Cotizacion.PreContactoObservaciones = $scope.Cotizacion.Observaciones;
        $scope.Cotizacion.MostrarCliente = $scope.Cotizacion.ClienteDocumento != null;
        $scope.Cotizacion.Observaciones = null;
        $scope.Cotizacion.SegmentoID = null;
        $scope.Cotizacion.ConvenioID = null;
        $scope.Cotizacion.PlantillaDocumentoID = null;
        $scope.cargarDireciones($scope.Cotizacion.Direccion);
        $scope.Cotizacion.Aprobada = false;
        $scope.Cotizacion.Aprobado = false;
        $scope.Cotizacion.RequiereAprobacionDescuento = false;
        $scope.Cotizacion.Diario = false;
        $scope.Cotizacion.Duracion = null;
        $scope.Cotizacion.PagoAnticipado = false;
        $scope.Cotizacion.MesesAnticipados = null;
        $scope.Cotizacion.CampanaID = null;
        $scope.Cotizacion.CotizacionesBodegajeAlcances = [];
        $scope.Cotizacion.CotizacionesBodegajeDirecciones = [];                
        $scope.Cotizacion.CotizacionesProductos = [];
        $scope.Cotizacion.CotizacionesBodegajeArticulos = [];
        $scope.Cotizacion.CotizacionesBodegajeArchivos = [];
        $scope.Cotizacion.CotizacionesBodegajeBodegas = [];
        $scope.Cotizacion.CotizacionesBodegajeMateriales = [];
        $scope.InitObjectCotizacion();
        $scope.CalcularTotalesCotizacion();
        $scope.ChangeSerieCotizacionBodegajeInput();
        $scope.ServicioBodega == undefined;
        $scope.Titulo = "NUEVA COTIZACIÓN";        
        $scope.MostrarHeaderPrincipal(false);
        $scope.ModoView = 2;
        $scope.MostrarProgress(false);
    };

    $scope.AbrirEditarCotizacion = function (item) {
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseSTRG + "CotizacionesBodegaje/CotizacionBodegajeDetalladoConsultar/",
            { CotizacionBodegajeID: item.CotizacionBodegajeID, Token: $scope.Usuario.Token },
            function (response) {
                $scope.Cotizacion = angular.extend({}, angular.copy($scope.PreContacto), response.data);
                $scope.Cotizacion.DirIP = $scope.Usuario.Ip;
                $scope.Cotizacion.Usuario = $scope.Usuario.UsuarioID;
                $scope.Cotizacion.Token = $scope.Usuario.Token;
                if ($scope.Cotizacion.ClienteTipoPersonaID != null)
                    $scope.ChangeTipoPersona($scope.Cotizacion);
                else
                    $scope.Cotizacion.ShowTipoPersona = true;
                $scope.InitObjectCotizacion();
                $scope.cargarDireciones($scope.Cotizacion.Direccion);
                if ($scope.Cotizacion.PreContactoObservaciones != null)
                    $scope.Cotizacion.PreContactoObservaciones = $scope.HtmlToText($scope.Cotizacion.PreContactoObservaciones);
                $scope.Cotizacion.MostrarCliente = $scope.Cotizacion.ClienteDocumento != null;
                $scope.ArrayFalse($scope.Cotizacion.CotizacionesBodegajeAlcances);
                $scope.ArrayFalse($scope.Cotizacion.CotizacionesBodegajeDirecciones);
                $scope.ArrayFalse($scope.Cotizacion.CotizacionesProductos);
                $scope.ArrayFalse($scope.Cotizacion.CotizacionesBodegajeBodegas);
                $scope.ArrayFalse($scope.Cotizacion.CotizacionesBodegajeArchivos);
                $scope.ArrayFalse($scope.Cotizacion.CotizacionesBodegajeMateriales);
                $scope.CalcularTotalesCotizacion();
                let _array = $filter('filter')($scope.Cotizacion.CotizacionesProductos, function (elem) { return elem.TipoProductoBodegaje == true }, true);
                if (_array.length > 0) 
                    $scope.ServicioBodega = _array[0];                
                $scope.ChangeSerieCotizacionBodegajeInput();
                angular.forEach($scope.Cotizacion.CotizacionesBodegajeBodegas, function (value, key) {
                    _array = $filter('filter')($scope.Cotizacion.CotizacionesProductos, function(elem) { return elem.ProductoID == value.ProductoID }, true);
                    if (_array.length > 0) 
                        $scope.LlenarObjeto(angular.copy(_array), value);                    
                });
                $scope.ChangeServicio();
                $scope.CotizacionCopia = angular.copy($scope.Cotizacion);
                $scope.Titulo = "COTIZACIÓN N° " + $scope.Cotizacion.Consecutivo;                
                $scope.MostrarHeaderPrincipal(false);
                $scope.ModoView = 2;
                $scope.MostrarProgress(false);
            }
        );
    };

    $scope.searchTiposProductosVariables = function (term) {
        var deferred = $q.defer();
        if ($scope.Variable == undefined)
            deferred.resolve([]);
        else if ($scope.Variable.TipoProductoID == undefined)
            deferred.resolve([]);
        else
            Services.Async(
                $scope.serviceBaseSTRG + "TiposProductosVariables/TiposProductosVariablesConsultar/",
                { Rows: 30, Page: 1, Token: $scope.Usuario.Token, Descripcion: term, TipoProductoID: $scope.Variable.TipoProductoID },
                function (response) {
                    deferred.resolve(response.rows);
                }
            );
        return deferred.promise;
    };

    $scope.ddlSearchTiposProductosCotizacion = {
        onSelect: function (item) {
            $scope.Variable = angular.extend({}, $scope.Variable, item);
            $scope.Variable.TipoProductoNombre = item.Nombre;
            $scope.Variable.TipoProductoVariableID = null;
        }
    };

    $scope.ddlSearchTiposProductosCotizacionVariables = {
        onSelect: function (item) {
            $scope.Variable = angular.extend({}, $scope.Variable, item);
            $scope.Variable.TipoProductoVariableDescripcion = item.Descripcion;            
        }
    };

    $scope.AgregarVariable = function () {
        if ($scope.Variable.TipoProductoID == undefined || $scope.Variable.TipoProductoID == null) {
            alertify.error("Error debe seleccionar un servicio.");
            return false;
        } else if ($scope.Variable.TipoProductoVariableID == undefined || $scope.Variable.TipoProductoVariableID == null) {
            alertify.error("Error debe seleccionar una variable.");
            return false;
        } else if ($filter('filter')($scope.Cotizacion.CotizacionesBodegajeAlcances, function (elem) { return elem.Eliminar == false && elem.TipoProductoVariableID == $scope.Variable.TipoProductoVariableID; }, true).length > 0) {
            alertify.error("La variable ya esta en la lista.");
            return false;
        } else {
            $scope.Cotizacion.CotizacionesBodegajeAlcances.push(angular.copy($scope.Variable));            
            if ($scope.Variable.Transporte == true) 
                $scope.Cotizacion.ConTransporte = true;            
            if ($scope.Variable.Empaque == true)
                $scope.Cotizacion.ConEmpaque = true;            
            $scope.Variable = angular.copy($scope.CopyVariable);
        }
    };

    $scope.EliminarVariable = function (item, index) {
        if (item.CotizacionBodegajeAlcanceID == null)
            $scope.Cotizacion.CotizacionesBodegajeAlcances.splice(index, 1);
        else
            item.Eliminar = true;
        if ($filter('filter')($scope.Cotizacion.CotizacionesBodegajeAlcances, function (elem) { return elem.Eliminar == false && elem.Transporte == true }, true).length == 0) {
            $scope.Cotizacion.ConTransporte = false;
            $scope.Cotizacion.NumeroOperarios = 0;
            $scope.Cotizacion.NumeroCamiones = 0;
        }
        if ($filter('filter')($scope.Cotizacion.CotizacionesBodegajeAlcances, function (elem) { return elem.Eliminar == false && elem.Empaque == true }, true).length == 0) {
            $scope.Cotizacion.ConEmpaque = false;
            $scope.Cotizacion.NumeroOperariosEmpaque = 0;
            $scope.Cotizacion.NumeroDiasEmpaque = 0;
        }
    };

    $scope.AgregarDireccion = function (origen) {
        let _Direccion;
        if (origen)
            _Direccion = angular.copy($scope.Origen);
        else
            _Direccion = angular.copy($scope.Destino);
        if (_Direccion.Direccion == undefined || _Direccion.Direccion == null) {
            alertify.error("Error ingrese una dirección de origen");
            return false;
        } else {            
            $scope.Cotizacion.CotizacionesBodegajeDirecciones.push(_Direccion);
            if (origen)
                $scope.Origen = angular.copy($scope.CopyOrigen);
            else
                $scope.Destino = angular.copy($scope.CopyDestino);    
        }
    };

    $scope.EliminarDireccion = function (item, index) {
        if (item.CotizacionDireccionID == null)
            $scope.Cotizacion.CotizacionesBodegajeDirecciones.splice(index, 1);
        else
            item.Eliminar = true;
    };

    $scope.searchProductos = function (term) {
        var deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseSIS + "Productos/ProductosConsultar/",
            { Rows: 30, Page: 1, Token: $scope.Usuario.Token, FullSearch: term },
            function (response) {                
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.ddlSearchProductosCotizacion = {
        onSelect: function (item) {
            $scope.Servicio = angular.extend({}, $scope.Servicio, item);
            $scope.Servicio.Cantidad = 1;
            $scope.Servicio.ValorUnitarioDescuento = 0;
            $scope.Servicio.Descripcion = $scope.Servicio.Nombre;
            $scope.Servicio.ValorUnitario = $scope.Servicio.PrecioBase;
            if ($scope.Cotizacion.Diario == true) {                                
                $scope.Servicio.ValorUnitario = (item.PrecioBase == null ? $scope.Servicio.PrecioDiario : item.PrecioBase);
                $scope.Servicio.ValorTotal = ($scope.Servicio.PrecioDiario * $scope.Servicio.Cantidad * $scope.Cotizacion.Duracion);                
            } else 
                $scope.Servicio.ValorTotal = ($scope.Servicio.ValorUnitario * $scope.Servicio.Cantidad);            
        }
    };

    $scope.AgregarServicio = function () {
        if ($scope.Cotizacion.RequiereAprobacionDescuento == true) {
            if ($scope.Servicio.ValorUnitarioDescuento == undefined || $scope.Servicio.ValorUnitarioDescuento == 0) {
                alertify.error("Error el valor unitario del descuento es requerido");
                return false;
            }
        }
        if ($scope.Cotizacion.Diario == true) {
            if ($scope.Cotizacion.Duracion == undefined || $scope.Cotizacion.Duracion == 0) {
                alertify.error("La duración es requerida");
                return false;
            }
            if ($scope.Servicio.ValorUnitario == undefined || $scope.Servicio.ValorUnitario == 0)
                $scope.Servicio.ValorUnitario = $scope.Servicio.PrecioDiario;
        }
        if ($scope.Servicio.ProductoID == undefined || $scope.Servicio.ProductoID == null) {
            alertify.error("Error seleccione un servicio");
            return false;
        } else if ($scope.Servicio.Cantidad == undefined || $scope.ServicioCantidad == 0) {
            alertify.error("Error ingrese una cantidad valida");
            return false;
        } else if ($scope.Servicio.ValorUnitario == undefined || $scope.Servicio.ValorUnitario == 0) {
            alertify.error("Error ingrese una valor");
            return false;

        } else if ($filter('filter')($scope.Cotizacion.CotizacionesProductos, function (elem) { elem.Eliminar == false && elem.ProductoID == $scope.Servicio.ProductoID }, true).length > 0) {
            alertify.error("Error el producto ya se ingreso");
            return false;
        } else {
            if ($scope.Cotizacion.Diario == true)                 
                $scope.Servicio.ValorUnitario = $scope.Servicio.PrecioDiario;
            $scope.Servicio.PorcentajeDescuento = 0;
            $scope.Cotizacion.CotizacionesProductos.push(angular.copy($scope.Servicio));
            let _copyServicio = angular.copy($scope.Servicio);
            $scope.Servicio = angular.copy($scope.CopyServicio);            
            $scope.Servicio.TipoProductoBodegaje = _copyServicio.TipoProductoBodegaje == undefined ? false : _copyServicio.TipoProductoBodegaje;            
            $scope.CotizacionCopia = angular.copy($scope.Cotizacion);
            if ($scope.ServicioBodega == undefined) {
                let tipoBodegaje = $filter('filter')($scope.Cotizacion.CotizacionesProductos, function (elem) { return elem.Eliminar == false && elem.TipoProductoBodegaje == true }, true);
                if (tipoBodegaje.length > 0)
                    $scope.ServicioBodega = tipoBodegaje[0];
            }
            $scope.CalcularTotalesCotizacion();
        }
    };

    $scope.EliminarServicio = function (item, index) {
        if (item.CotizacionProductoID == null)
            $scope.Cotizacion.CotizacionesProductos.splice(index, 1);
        else
            item.Eliminar = true;
        $scope.RemoverBodegaServicio(item); 
        $scope.CalcularTotalesCotizacion();
    };

    $scope.RemoverBodegaServicio = function (item) {        
        for (var i = $scope.Cotizacion.CotizacionesBodegajeBodegas.length - 1; i >= 0; i--) {
            let _elem = $scope.Cotizacion.CotizacionesBodegajeBodegas[i];
            if (_elem.ProductoID == item.ProductoID) {
                if (item.CotizacionBodegajeBodegaID == null)
                    $scope.Cotizacion.CotizacionesBodegajeBodegas.splice(i, 1);                    
                else
                    $scope.Cotizacion.CotizacionesBodegajeBodegas[i].Eliminar = true;
            }
        }
    };

    $scope.CalcularTotalesCotizacion = function () {
        $scope.Cotizacion.SubTotalServicio = 0;
        $scope.Cotizacion.SubTotalNoServicio = 0;
        $scope.Cotizacion.TotalServicio = 0;
        angular.forEach($scope.Cotizacion.CotizacionesProductos, function (elem) {
            if (elem.Eliminar == false) {
                if (elem.ProductoID == null)
                    $scope.Cotizacion.SubTotalNoServicio += elem.ValorTotal;
                else
                    $scope.Cotizacion.SubTotalServicio += elem.ValorTotal;
            }
        });
        $scope.Cotizacion.TotalServicio = $scope.Cotizacion.SubTotalServicio + $scope.Cotizacion.SubTotalNoServicio;
    };

    $scope.ChangeServicio = function () {
        if ($scope.Cotizacion.RequiereAprobacionDescuento == true && $scope.Cotizacion.Diario == true) {
            if ($scope.Servicio != undefined && $scope.Servicio.TipoProductoBodegaje == true)
                $scope.Servicio.ValorTotal = ($scope.Servicio.ValorUnitarioDescuento * parseInt($scope.Servicio.Cantidad) * parseInt($scope.Cotizacion.Duracion));
            else
                $scope.Servicio.ValorTotal = ($scope.Servicio.ValorUnitarioDescuento * parseInt($scope.Servicio.Cantidad));
            angular.forEach($scope.Cotizacion.CotizacionesProductos, function (elem) {
                if (elem.ProductoID != null) {
                    if (elem.TipoProductoBodegaje == true)
                        elem.ValorTotal = (elem.ValorUnitarioDescuento * elem.Cantidad * $scope.Cotizacion.Duracion);
                    else
                        elem.ValorTotal = (elem.ValorUnitarioDescuento * elem.Cantidad);
                }
            });
        } else if ($scope.Cotizacion.RequiereAprobacionDescuento == true && $scope.Cotizacion.Diario == false) {
            if ($scope.Servicio != undefined && $scope.Servicio.TipoProductoBodegaje == true)
                $scope.Servicio.ValorTotal = ($scope.Servicio.ValorUnitarioDescuento * parseInt($scope.Servicio.Cantidad));
            else
                $scope.Servicio.ValorTotal = ($scope.Servicio.ValorUnitarioDescuento * parseInt($scope.Servicio.Cantidad));
            angular.forEach($scope.Cotizacion.CotizacionesProductos, function (elem) {
                if (elem.ProductoID != null) {
                    if (elem.TipoProductoBodegaje == true)
                        elem.ValorTotal = (elem.ValorUnitarioDescuento * elem.Cantidad);
                    else
                        elem.ValorTotal = (elem.ValorUnitarioDescuento * elem.Cantidad);
                }
            });
        } else if ($scope.Cotizacion.RequiereAprobacionDescuento == false && $scope.Cotizacion.Diario == true) {
            if ($scope.Servicio != undefined && $scope.Servicio.TipoProductoBodegaje == true)
                $scope.Servicio.ValorTotal = (parseInt($scope.Servicio.Cantidad) * $scope.Servicio.PrecioDiario * $scope.Cotizacion.Duracion);
            else
                $scope.Servicio.ValorTotal = (parseInt($scope.Servicio.Cantidad) * $scope.Servicio.PrecioDiario);
            angular.forEach($scope.Cotizacion.CotizacionesProductos, function (elem) {
                if (elem.ProductoID != null) {
                    if (elem.TipoProductoBodegaje == true)
                        elem.ValorTotal = (elem.PrecioDiario * elem.Cantidad * $scope.Cotizacion.Duracion);
                    else
                        elem.ValorTotal = (elem.PrecioDiario * elem.Cantidad);
                }
            });
        } else {
            if ($scope.Servicio != undefined)
                $scope.Servicio.ValorTotal = ($scope.Servicio.ValorUnitario * parseInt($scope.Servicio.Cantidad));
            //angular.forEach($scope.Cotizacion.CotizacionesProductos, function (elem) {
            //    if (elem.ProductoID != null)
            //        elem.ValorTotal = (elem.ValorUnitario * elem.Cantidad);
            //});
        }
        $scope.CalcularTotalesCotizacion();
    };

    $scope.ChangeServicioItem = function (item) {
        if ($scope.Cotizacion.Diario == true && $scope.Cotizacion.RequiereAprobacionDescuento == true) {
            if (item.TipoProductoBodegaje == true)
                item.ValorTotal = (parseInt($scope.Cotizacion.Duracion) * item.Cantidad * item.ValorUnitarioDescuento);
            else
                item.ValorTotal = (item.Cantidad * item.ValorUnitarioDescuento);

        } else if ($scope.Cotizacion.RequiereAprobacionDescuento == true && $scope.Cotizacion.Diario == false) {
            if (item.TipoProductoBodegaje == true)
                item.ValorTotal = (item.Cantidad * item.ValorUnitarioDescuento);
            else
                item.ValorTotal = (item.Cantidad * item.ValorUnitarioDescuento);
        } else if ($scope.Cotizacion.RequiereAprobacionDescuento == false && $scope.Cotizacion.Diario == true) {
            if (item.TipoProductoBodegaje == true)
                item.ValorTotal = (parseInt($scope.Cotizacion.Duracion) * item.Cantidad * item.PrecioDiario);
            else
                item.ValorTotal = (item.Cantidad * item.PrecioDiario);
        } else if ($scope.Cotizacion.RequiereAprobacionDescuento == false && $scope.Cotizacion.Diario == false) {
            if (item.TipoProductoBodegaje == true)
                item.ValorTotal = (item.Cantidad * item.ValorUnitario);
            else
                item.ValorTotal = (item.Cantidad * item.ValorUnitario);
        }
        else
            item.ValorTotal = (item.ValorUnitario * item.Cantidad);
        $scope.CalcularTotalesCotizacion();
    };

    $scope.ValorDefault = function () {
        angular.forEach($scope.Cotizacion.CotizacionesProductos, function (elem) {
            angular.forEach($scope.CotizacionCopia.CotizacionesProductos, function (CopiaElem) {
                if (elem.ProductoID == CopiaElem.ProductoID && elem.ProductoID != null) {
                    if ($scope.Cotizacion.Diario == true && $scope.Cotizacion.RequiereAprobacionDescuento == true) {
                        if (elem.TipoProductoBodegaje == true) {
                            elem.ValorTotal = (elem.ValorUnitarioDescuento * elem.Cantidad * $scope.Cotizacion.Duracion);
                        } else {
                            elem.ValorTotal = (elem.ValorUnitarioDescuento * elem.Cantidad);
                        }
                        elem.PrecioDiario = CopiaElem.PrecioDiario;
                    } else if ($scope.Cotizacion.Diario == true && $scope.Cotizacion.RequiereAprobacionDescuento == false) {
                        if (elem.TipoProductoBodegaje == true) {
                            elem.ValorTotal = (CopiaElem.PrecioDiario * elem.Cantidad * $scope.Cotizacion.Duracion);
                        } else {
                            elem.ValorTotal = (CopiaElem.PrecioDiario * elem.Cantidad);
                        }
                        elem.PrecioDiario = CopiaElem.PrecioDiario;
                    } else if ($scope.Cotizacion.Diario == false && $scope.Cotizacion.RequiereAprobacionDescuento == true) {
                        if (elem.TipoProductoBodegaje == true) {
                            elem.ValorTotal = (elem.ValorUnitarioDescuento * elem.Cantidad);
                        } else {
                            elem.ValorTotal = (elem.ValorUnitarioDescuento * elem.Cantidad);
                        }
                        elem.PrecioDiario = CopiaElem.ValorUnitario;
                    } else if ($scope.Cotizacion.Diario == false && $scope.Cotizacion.RequiereAprobacionDescuento == false) {
                        if (elem.TipoProductoBodegaje == true) {
                            elem.ValorTotal = (elem.ValorUnitario * elem.Cantidad);
                        } else {
                            elem.ValorTotal = (elem.ValorUnitario * elem.Cantidad);
                        }
                        elem.PrecioDiario = CopiaElem.ValorUnitario;
                    }
                }
            });
        });
        if ($scope.Cotizacion.RequiereAprobacionDescuento == true && $scope.Cotizacion.Diario == true) {
            if ($scope.Servicio.TipoProductoBodegaje == true) {
                $scope.Servicio.ValorTotal = ($scope.Servicio.ValorUnitarioDescuento * $scope.Servicio.Cantidad * parseInt($scope.Cotizacion.Duracion));
            } else {
                $scope.Servicio.ValorTotal = ($scope.Servicio.ValorUnitarioDescuento * $scope.Servicio.Cantidad);
            }
        } else if ($scope.Cotizacion.RequiereAprobacionDescuento == true && $scope.Cotizacion.Diario == false) {
            if ($scope.Servicio.TipoProductoBodegaje == true) {
                $scope.Servicio.ValorTotal = ($scope.Servicio.ValorUnitarioDescuento * $scope.Servicio.Cantidad)
            } else {
                $scope.Servicio.ValorTotal = ($scope.Servicio.ValorUnitarioDescuento * $scope.Servicio.Cantidad)
            }
        } else if ($scope.Cotizacion.RequiereAprobacionDescuento == false && $scope.Cotizacion.Diario == true) {
            if ($scope.Servicio.TipoProductoBodegaje == true) {
                $scope.Servicio.ValorTotal = ($scope.Servicio.Cantidad * parseInt($scope.Cotizacion.Duracion) * $scope.Servicio.PrecioDiario);
            } else {
                $scope.Servicio.ValorTotal = ($scope.Servicio.Cantidad * $scope.Servicio.PrecioDiario);
            }
        } else if ($scope.Cotizacion.RequiereAprobacionDescuento == false || $scope.Cotizacion.Diario == false) {
            if ($scope.Servicio.TipoProductoBodegaje == true) {
                $scope.Servicio.ValorTotal = ($scope.Servicio.ValorUnitario * $scope.Servicio.Cantidad);
            } else {
                $scope.Servicio.ValorTotal = ($scope.Servicio.ValorUnitario * $scope.Servicio.Cantidad);
            }
        } else {
            $scope.Servicio.ValorTotal = ($scope.Servicio.ValorUnitario * $scope.Servicio.Cantidad);
        }
        $scope.CalcularTotalesCotizacion();
    };

    $scope.AbrirModalBodegas = function () {
        if ($scope.ServicioBodega == undefined || $scope.ServicioBodega == null) {
            alertify.error("Seleccione un servicio primero");
            return false;
        } else if ($filter('filter')($scope.Cotizacion.CotizacionesBodegajeBodegas, function (elem) { return elem.Eliminar == false && elem.ProductoID == $scope.ServicioBodega.ProductoID }, true).length >= $scope.ServicioBodega.Cantidad) {
            alertify.error("Ya alcanzo la cantidad de reservas permitidas");
            return false;
        } else {
            $scope.MostrarProgress(true);
            $scope.Controller_ModalReservacion = angular.element($(".Controller_ModalReservacion")[0]).scope();
            $scope.Controller_ModalReservacion.InitModalReservacion($scope.ServicioBodega, function (BodegaSeleccionada) {
                if ($filter('filter')($scope.Cotizacion.CotizacionesBodegajeBodegas, function (elem) { return elem.Eliminar == false && elem.ProductoID == $scope.ServicioBodega.ProductoID }, true).length >= $scope.ServicioBodega.Cantidad) {
                    alertify.error("Ya alcanzo la cantidad de reservas permitidas");
                    return false;
                } else if ($filter('filter')($scope.Cotizacion.CotizacionesBodegajeBodegas, function (elem) { return elem.Eliminar == false && elem.BodegaID == BodegaSeleccionada.BodegaID }, true).length > 0) {
                    alertify.error("La bodega N°-" + BodegaSeleccionada.Codigo + " ya la tiene reservada.");
                    return false;
                } else {
                    angular.forEach(BodegaSeleccionada.Atributos, function (elem) {
                        $scope.ServicioBodega[elem.Nombre] = elem.Valor;
                    });
                    BodegaSeleccionada.CotizacionBodegajeBodegaID = null;
                    BodegaSeleccionada.Eliminar = false;
                    BodegaSeleccionada.CodigoBodega = BodegaSeleccionada.Codigo;
                    let _ServicioBodega = angular.extend({}, $scope.ServicioBodega, BodegaSeleccionada);
                    $scope.Cotizacion.CotizacionesBodegajeBodegas.push(angular.copy(_ServicioBodega));
                }
            });
            $scope.MostrarProgress(false);
        }
    };

    $scope.RemoveBodega = function (item, index) {
        if (item.CotizacionBodegajeBodegaID == null)
            $scope.Cotizacion.CotizacionesBodegajeBodegas.splice(index, 1);
        else {            
            Services.Async(
                $scope.serviceBaseSTRG + "OrdenesServiciosBodegaje/EliminarBodegasReservadas/",
                {
                    DirIP: $scope.Usuario.Ip,
                    Usuario: $scope.Usuario.UsuarioID,
                    CotizacionBodegajeBodegaID: item.CotizacionBodegajeBodegaID,
                    Token: $scope.Usuario.Token
                },
                function (response) {
                    $scope.Cotizacion.CotizacionesBodegajeBodegas.splice(index, 1);
                }
            );
        }
    };

    $scope.AgregarNoServicio = function () {        
        if ($scope.NoServicio.Descripcion == undefined || $scope.NoServicio.Descripcion == null) {
            alertify.error("Error ingrese una descripción del servicio no contemplado");
            return false;
        } else if ($scope.NoServicio.Cantidad == undefined || $scope.NoServicio.Cantidad == 0 || $scope.NoServicio.Cantidad == null) {
            alertify.error("Error ingrese una cantidad valida");
            return false;
        } else if ($scope.NoServicio.ValorUnitario == undefined || $scope.NoServicio.ValorUnitario == null || $scope.NoServicio.ValorUnitario == 0) {
            alertify.error("Error ingrese un valor");
            return false;
        } else {
            $scope.NoServicio.PorcentajeDescuento = 0;
            $scope.Cotizacion.CotizacionesProductos.push(angular.copy($scope.NoServicio));
            $scope.NoServicio = angular.copy($scope.CopyNoServicio);
            $scope.CalcularTotalesCotizacion();
        }
    };

    $scope.EliminarNoServicio = function (item, index) {
        if (item.CotizacionProductoID == null)
            $scope.Cotizacion.CotizacionesProductos.splice(index, 1);
        else
            item.Eliminar = true;
        $scope.CalcularTotalesCotizacion();       
    };

    $scope.ChangeNoServicio = function () {
        $scope.NoServicio.ValorTotal = ($scope.NoServicio.ValorUnitario * $scope.NoServicio.Cantidad);
    };

    $scope.AgregarMaterialesCotizacion = function () {
        if ($scope.Material.ProductoID == undefined || $scope.Material.ProductoID == null) {
            alertify.error("Seleccione un material");
            return;
        } else if ($filter('filter')($scope.Cotizacion.CotizacionesBodegajeMateriales, function (elem) { return elem.Eliminar == false && elem.ProductoID == $scope.Material.ProductoID }, true).length > 0) {
            alertify.error("El material ya esta ingresado");
            return;
        } else if ($scope.Material.Cantidad == undefined || $scope.Material.Cantidad == null || $scope.Material.Cantidad < 0 || $scope.Material.Cantidad == "") {
            alertify.error("Ingrese una cantidad valida");
            return;
        } else {
            $scope.Cotizacion.CotizacionesBodegajeMateriales.push(angular.copy($scope.Material));
            $scope.Material = angular.copy($scope.CopyMaterial);
        }
    };

    $scope.EliminarMaterialesCotizacion = function (item, index) {
        if (item.CotizacionBodegajeMaterialID == null)
            $scope.Cotizacion.CotizacionesBodegajeMateriales.splice(index, 1);
        else
            item.Eliminar = true;
    };

    $scope.searchOrigenesCotizaciones = function (term) {
        var deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseSTRG + "OrigenesCotizaciones/OrigenesCotizacionesConsultar/",
            { Rows: 30, Page: 1, Token: $scope.Usuario.Token, Nombre: term },
            function (response) {
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.searchMediosTransporte = function (term) {
        var deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseSTRG + "MediosTransporte/MediosTransporteConsultar/",
            { Rows: 30, Page: 1, Token: $scope.Usuario.Token, Nombre: term },
            function (response) {
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.ddlMediosTransporte = {
        onSelect: function (item) {            
            $scope.Cotizacion.RequiereDirecciones = item.RequiereDirecciones;
            if (item.RequiereDirecciones == false) {
                angular.forEach($scope.Cotizacion.CotizacionesBodegajeDirecciones, function (elem) {
                    elem.Eliminar = true;
                });
            }
        }
    };

    $scope.ConfigInputCotizacion = {
        IsDisabled: false,
        CDNEndPoint: $scope.Usuario.CDNEndPoint,
        CDNLlavePublica: $scope.Usuario.CDNLlavePublica,
        CDNLlavePrivada: $scope.Usuario.CDNLlavePrivada,
        Token: $scope.Usuario.Token,
        PreUploadFileCDN: function (_file, _config) {
            let extension = _file.name.split('.').pop().toLowerCase();
            if ($scope.Archivo.SerieID == undefined || $scope.Archivo.SerieID == null) {
                alertify.error("Seleccione un tipo de documento.");
                return false;
            }
            let _tipologias = $filter('filter')($scope.Tipologias, function (elem) { return elem.Extension == extension }, true);
            if (_tipologias.length == 0) {
                alertify.error("La tipologia ." + extension + " de este archivo no esta registrada.");
                return false;
            }
            return true;           
        },
        UploadFileCDN: function (response, _file) {
            let extension = _file.name.split('.').pop().toLowerCase();
            let _tipologias = $filter('filter')($scope.Tipologias, function (elem) { return elem.Extension == extension }, true);
            let item = {
                NombreArchivo: _file.name,
                TipologiaID: _tipologias[0].TipologiaID,
                DescripcionSerie: $filter('filter')($scope.SeriesOrdenesServiciosBodegaje, function (elem) { return elem.SerieID == $scope.Archivo.SerieID }, true)[0].DescripcionSerie,
                Ruta: "cdn://" + response.CodigoUnico,
                MimeType: _file.type,
                Eliminar: false
            };
            $scope.Archivo = angular.extend({}, $scope.Archivo, item);
            $scope.Cotizacion.CotizacionesBodegajeArchivos.push(angular.copy($scope.Archivo));
            $scope.Archivo = angular.copy($scope.CopyArchivo);
            $scope.ChangeSerieCotizacionBodegajeInput();
        }
    };     

    $scope.EliminarArchivo = function (item, index) {
        alertify.confirm("¿Desea eliminar el archivo?", function () {
            if (item.ArchivoID == null) {
                $scope.EliminarArchivoCDN([{ CodigoUnico: item.Ruta.replaceAll("cdn://", "") }], function (response) {
                    $scope.Cotizacion.CotizacionesBodegajeArchivos.splice(index, 1);
                });
            } else
                item.Eliminar = true;
        });
    };

    $scope.VerArchivo = function (elem) {
        if (elem.MimeType != undefined && elem.Ruta == null) {
            let _base64 = elem.Base64.substring(elem.Base64.indexOf(",") + 1);
            $scope.Base64aFile(_base64, elem.NombreArchivo, elem.MimeType);
        } else
            $scope.viewer.Open(elem.Ruta);
    };

    $scope.Base64aFile = function (Base64, filename, mimeType) {
        var bstr = atob(Base64),
            n = bstr.length,
            u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        var blob = new Blob([u8arr], { type: mimeType });
        var elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    };

    $scope.ChangeSerieCotizacionBodegajeInput = function () {
        if ($scope.Archivo.SerieID == null)
            $scope.ConfigInputCotizacion.SetFieldBaseArchivo("IsDisabled", true);                                 
        else
            $scope.ConfigInputCotizacion.SetFieldBaseArchivo("IsDisabled", false);                                 
    };

    $scope.ValidarCotizacion = function () {               
        if ($scope.Cotizacion.Nombres == undefined || $scope.Cotizacion.Nombres == null) {
            alertify.error("Los nombres del contacto es obligatorio.");
            return false;
        }
        if ($scope.Cotizacion.Apellidos == undefined || $scope.Cotizacion.Apellidos == null) {
            alertify.error("Los apellidos del contacto son obligatorios.");
            return false;
        }
        if ($scope.Cotizacion.Celular == undefined || $scope.Cotizacion.Celular == null) {
            alertify.error("Debe ingresar un numero de celular para el contacto");
            return false;
        }
        if ($scope.Cotizacion.Email == undefined || $scope.Cotizacion.Email == null) {
            alertify.error("Debe ingresar un correo electronico para el contacto");
            return false;
        }
        if ($scope.Cotizacion.AsesorID == undefined || $scope.Cotizacion.AsesorID == null) {
            alertify.error("Debe seleccionar un asesor.");
            return false;
        }
        if ($scope.Cotizacion.MedioTransporteID == undefined || $scope.Cotizacion.MedioTransporteID == null) {
            alertify.error("Debe seleccionar un medio de transporte.");
            return false;
        }
        if ($scope.Cotizacion.PlantillaDocumentoID == undefined || $scope.Cotizacion.PlantillaDocumentoID == null) {
            alertify.error("Debe seleccionar una plantilla es obligatorio");
            return false;
        }
        if ($scope.Cotizacion.SegmentoID == undefined || $scope.Cotizacion.SegmentoID == null) {
            alertify.error("Debe seleccionar un segmento es obligatorio");
            return false;
        }
        if ($filter("filter")($scope.Cotizacion.CotizacionesBodegajeAlcances, function (elem) { return elem.Eliminar == false; }, true).length == 0) {
            alertify.error("Debe ingresar al menos un alcance de la cotización.");
            return false;
        }       
        if ($scope.Cotizacion.ConTransporte == true) {
            if ($scope.Cotizacion.NumeroCamiones == undefined || $scope.Cotizacion.NumeroCamiones == null || $scope.Cotizacion.NumeroCamiones == 0) {
                alertify.error("Debe ingresar un numero de camiones.");
                return false;
            }
            if ($scope.Cotizacion.NumeroOperarios == undefined || $scope.Cotizacion.NumeroOperarios == null || $scope.Cotizacion.NumeroOperarios == 0) {
                alertify.error("Debe ingresar un numero de operarios.");
                return false;
            }
        }
        if ($scope.Cotizacion.ConEmpaque == true) {
            if ($scope.Cotizacion.NumeroOperariosEmpaque == undefined || $scope.Cotizacion.NumeroOperariosEmpaque == null || $scope.Cotizacion.NumeroOperariosEmpaque == 0) {
                alertify.error("Debe ingresar un numero de operarios para empaque.");
                return false;
            }
            if ($scope.Cotizacion.NumeroDiasEmpaque == undefined || $scope.Cotizacion.NumeroDiasEmpaque == null || $scope.Cotizacion.NumeroDiasEmpaque == 0) {
                alertify.error("Debe ingresar un numero de dias de empaque.");
                return false;
            }
        }
        if ($scope.Cotizacion.OrigenCotizacionID == undefined || $scope.Cotizacion.OrigenCotizacionID == null) {
            alertify.error("Debe seleccionar un item de la información de la cotizacion.");
            return false;
        }        
        if ($scope.Cotizacion.RequiereDirecciones == true) {
            if ($filter('filter')($scope.Cotizacion.CotizacionesBodegajeDirecciones, function (elem) { return elem.Eliminar == false && elem.Origen == true; }, true).length == 0) {
                alertify.error("Debe ingresar al menos una dirección de origen.");
                return false;
            }
            if ($filter('filter')($scope.Cotizacion.CotizacionesBodegajeDirecciones, function (elem) { return elem.Eliminar == false && elem.Origen == false; }, true).length == 0) {
                alertify.error("Debe ingresar al menos una dirección de destino.");
                return false;
            }
        } else {
            angular.forEach($scope.Cotizacion.CotizacionesBodegajeDirecciones, function (elem) {
                elem.Eliminar = true;
            });
        }            
        if ($scope.Cotizacion.FechaSolicitud == undefined || $scope.Cotizacion.FechaSolicitud == null || $scope.Cotizacion.FechaSolicitud == "") {
            alertify.error("Debe ingresar una fecha de solicitud.");
            return false;
        }
        if ($filter('filter')($scope.Cotizacion.CotizacionesProductos, function (elem) { return elem.Eliminar == false; }, true).length == 0) {
            alertify.error("Debe ingresar al menos un servicio en la cotización.");
            return false;
        }
        if ($scope.Cotizacion.PagoAnticipado == false)
            $scope.Cotizacion.MesesAnticipados = null;
        else {
            if ($scope.Cotizacion.MesesAnticipados == null || $scope.Cotizacion.MesesAnticipados <= 0) {
                alertify.error("La cantidad de meses anticipados son requeridos.");
                return false;
            }
        }
        return true;
    };

    $scope.GuardarCotizacion = function () {
        if ($scope.ValidarCotizacion()) {
            alertify.confirm("¿Desea crear la cotización?", function () {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseSTRG + "CotizacionesBodegaje/CotizacionesBodegajeInsertar/",
                    $scope.Cotizacion,
                    function (response) {                                                
                        let _arrayFiles = [], _arrayDeleteFiles = [];
                        angular.forEach($scope.Cotizacion.CotizacionesBodegajeArchivos, function (elem) {
                            if (elem.Eliminar == false)
                                _arrayFiles.push(elem.Ruta.replaceAll("cdn://", ""));
                            else
                                _arrayDeleteFiles.push({ CodigoUnico: elem.Ruta.replaceAll("cdn://", "") });
                        });
                        $scope.CommitCDN(_arrayFiles);
                        $scope.EliminarArchivoCDN(_arrayDeleteFiles);
                        alertify.success(response.rows[0].Descripcion);
                        $scope.Sincronizar(function () {
                            $scope.AtrasModoView();
                            $scope.PreContacto.ShowCotizaciones = true;
                            $scope.MostrarProgress(false);
                        });
                    },
                    function (response) {
                        $scope.Sincronizar(function () {
                            $scope.MostrarProgress(false);
                        });
                        alertify.error(response.data.Message);
                    }
                );
            });
        }
    };

    $scope.ActualizarCotizacion = function () {
        if ($scope.ValidarCotizacion()) {
            alertify.confirm("¿Desea guardar los cambios de la cotización?", function () {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseSTRG + "CotizacionesBodegaje/CotizacionesBodegajeActualizar/",
                    $scope.Cotizacion,
                    function (response) {                        
                        let _arrayFiles = [], _arrayDeleteFiles = [];
                        angular.forEach($scope.Cotizacion.CotizacionesBodegajeArchivos, function (elem) {
                            if (elem.Eliminar == false)
                                _arrayFiles.push(elem.Ruta.replaceAll("cdn://", ""));
                            else
                                _arrayDeleteFiles.push({ CodigoUnico: elem.Ruta.replaceAll("cdn://", "") });
                        });
                        $scope.CommitCDN(_arrayFiles);
                        $scope.EliminarArchivoCDN(_arrayDeleteFiles);
                        alertify.success(response.rows[0].Descripcion);
                        $scope.Sincronizar(function () {
                            $scope.AtrasModoView();
                            $scope.PreContacto.ShowCotizaciones = true;
                            $scope.MostrarProgress(false);
                        });
                    },
                    function (response) {
                        $scope.Sincronizar(function () {
                            $scope.MostrarProgress(false);
                        });
                        alertify.error(response.data.Message);
                    }
                );
            });
        }
    };

    $scope.CommitCDN = function (_arrayFiles, OnSuccess) {
        if (_arrayFiles.length > 0) {
            Services.Async(
                $scope.Usuario.CDNEndPoint + "/api/Files/CommitFile/",
                {
                    Files: _arrayFiles,
                    PrivateKey: $scope.Usuario.CDNLlavePrivada
                },
                function (response) {
                    if (OnSuccess)
                        OnSuccess(response);
                },
                function (response) {
                    if (OnSuccess)
                        OnSuccess(response);
                }
            );
        }
    };

    $scope.EliminarArchivoCDN = function (_arrayFiles, OnSuccess) {
        if (_arrayFiles.length > 0) {
            Services.Async(
                $scope.Usuario.CDNEndPoint + "/api/Files/DeleteFile/",
                {
                    Files: _arrayFiles,
                    PrivateKey: $scope.Usuario.CDNLlavePrivada
                },
                function (response) {
                    if (OnSuccess)
                        OnSuccess(response);
                },
                function (response) {
                    if (OnSuccess)
                        OnSuccess(response);
                }
            );
        }
    };

    $scope.AbrirModalMailCotizacion = function (elem) {
        $scope.MailModel.Asunto = "Cotización N°." + elem.Consecutivo;
        $scope.MailModel.Destinatarios = $scope.PreContacto.Email;
        $scope.MailModel.Adjuntos = [{
            Ruta: $scope.serviceBaseSTRG + "PDFs/DocumentoB?TipoDocumentoID=2&UniqueID=" + elem.UniqueID + "&Attachment=true",
            Nombre: "Cotización_N°_" + elem.Consecutivo + ".pdf",
            NombreArchivo: "Cotización_N°_" + elem.Consecutivo + ".pdf",
            Tipo: 2,
            Token: $scope.Usuario.Token
        }];
        $scope.MailModel.Open();
    };

    $scope.MenuCotizaciones = [
        {
            text: '<i class="fal fa-file-invoice-dollar blue"></i>&nbsp;&nbsp;Documento PDF',
            click: function ($itemScope) {
                $scope.viewer.Open("API_STRG/api/PDFs/DocumentoD?TipoDocumentoID=2&DocumentoID=" + $itemScope.item.CotizacionID);
            }
        },
        {
            text: '<i class="fal fa-copy green"></i>&nbsp;&nbsp;Duplicar',
            click: function ($itemScope) {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseSTRG + "CotizacionesBodegaje/CotizacionBodegajeDetalladoConsultar/",
                    { CotizacionBodegajeID: $itemScope.item.CotizacionBodegajeID, Token: $scope.Usuario.Token },
                    function (response) {
                        $scope.Cotizacion = angular.extend({}, angular.copy($scope.PreContacto), response.data);
                        $scope.Cotizacion.CotizacionBodegajeID = null;
                        $scope.Cotizacion.CotizacionID = null;
                        $scope.Cotizacion.Aprobada = false;
                        $scope.Cotizacion.Aprobado = false;
                        $scope.Cotizacion.DirIP = $scope.Usuario.Ip;
                        $scope.Cotizacion.Usuario = $scope.Usuario.UsuarioID;
                        $scope.Cotizacion.Token = $scope.Usuario.Token;
                        if ($scope.Cotizacion.ClienteTipoPersonaID != null)
                            $scope.ChangeTipoPersona($scope.Cotizacion);
                        else
                            $scope.Cotizacion.ShowTipoPersona = true;
                        if ($scope.Cotizacion.PreContactoObservaciones != null)
                            $scope.Cotizacion.PreContactoObservaciones = $scope.HtmlToText($scope.Cotizacion.PreContactoObservaciones);
                        $scope.Cotizacion.MostrarCliente = $scope.Cotizacion.ClienteDocumento != null;
                        $scope.Cotizacion.CotizacionesBodegajeArchivos = [];
                        $scope.InitObjectCotizacion();
                        $scope.cargarDireciones($scope.Cotizacion.Direccion);
                        $scope.ArrayFalse($scope.Cotizacion.CotizacionesBodegajeAlcances);
                        $scope.ArrayFalse($scope.Cotizacion.CotizacionesBodegajeDirecciones);
                        $scope.ArrayFalse($scope.Cotizacion.CotizacionesProductos);                        
                        $scope.ArrayFalse($scope.Cotizacion.CotizacionesBodegajeArchivos);
                        $scope.ArrayFalse($scope.Cotizacion.CotizacionesBodegajeMateriales);
                        $scope.Cotizacion.CotizacionesBodegajeBodegas = [];
                        $scope.ServicioBodega == undefined;
                        $scope.CalcularTotalesCotizacion();
                        let _array = $filter('filter')($scope.Cotizacion.CotizacionesProductos, function (elem) { return elem.TipoProductoBodegaje == true }, true);
                        if (_array.length > 0)
                            $scope.ServicioBodega = _array[0];
                        $scope.ChangeSerieCotizacionBodegajeInput();
                        $scope.ChangeServicio();
                        $scope.Titulo = "NUEVA COTIZACIÓN";                                                
                        $scope.MostrarHeaderPrincipal(false);
                        $scope.ModoView = 2;
                        $scope.MostrarProgress(false);
                    }
                );
            }
        },
        {
            text: '<i class="fal fa-edit blue"></i>&nbsp;&nbsp;Editar',
            click: function ($itemScope) {
                $scope.AbrirEditarCotizacion($itemScope.item);
            }
        },
        {
            text: '<i class="fal fa-check-circle orange"></i>&nbsp;&nbsp;Aprobar',
            click: function ($itemScope) {
                alertify.confirm("¿Desea aprobar la cotización N°" + $itemScope.item.Consecutivo + "?", function () {
                    $scope.MostrarProgress(true);
                    $itemScope.item.DirIp = $scope.Usuario.Ip;
                    $itemScope.item.Usuario = $scope.Usuario.UsuarioID;
                    $itemScope.item.Token = $scope.Usuario.Token;
                    Services.Async(
                        $scope.serviceBaseSTRG + "CotizacionesBodegaje/CotizacionesBodegajeAprobar",
                        $itemScope.item,
                        function (response) {
                            alertify.success(response.rows[0].Descripcion);
                            $scope.Sincronizar(function () {
                                $scope.MostrarProgress(false);
                            });
                        },
                        function (response) {
                            $scope.Sincronizar(function () {
                                $scope.MostrarProgress(false);
                            });
                            alertify.error(response.data.Message);
                        }
                    );
                });
            },
            displayed: function ($itemScope) {
                return $itemScope.item.Aprobada == false;
            }
        },
        {
            text: '<i class="fal fa-backward red"></i>&nbsp;&nbsp;Reversar aprobación',
            click: function ($itemScope) {
                alertify.confirm("¿Desea reversar la aprobación de la cotización N°" + $itemScope.item.Consecutivo + "?", function () {
                    $scope.MostrarProgress(true);
                    $itemScope.item.DirIp = $scope.Usuario.Ip;
                    $itemScope.item.Usuario = $scope.Usuario.UsuarioID;
                    $itemScope.item.Token = $scope.Usuario.Token;
                    Services.Async(
                        $scope.serviceBaseSIS + "Cotizaciones/ReversionAprobacionCotizaciones",
                        $itemScope.item,
                        function (response) {
                            alertify.success(response.rows[0].Descripcion);
                            $scope.Sincronizar(function () {
                                $scope.MostrarProgress(false);
                            });
                        },
                        function (response) {
                            $scope.Sincronizar(function () {
                                $scope.MostrarProgress(false);
                            });
                            alertify.error(response.data.Message);
                        }
                    );
                });
            },
            displayed: function ($itemScope) {
                return $itemScope.item.Aprobado;
            }
        },
        {
            text: '<i class="fal fa-clone orange"></i>&nbsp;&nbsp;Generar orden de servicio',
            click: function ($itemScope) {
                $scope.AbrirNuevaOrdenServicio($itemScope.item);
            },
            displayed: function ($itemScope) {
                return $itemScope.item.Aprobado;
            }
        },
        {
            text: '<i class="fal fa-link green"></i>&nbsp;&nbsp;Copiar link de cliente',
            click: function ($itemScope) {
                navigator.clipboard.writeText(window.location.origin + '/Cotizaciones/VisorInteractivas?UniqueID=' + $itemScope.item.UniqueID);
                alertify.success("El link se copio en el portapapeles");
            }
        },
        {
            text: '<i class="fab fa-whatsapp"></i>&nbsp;&nbsp;Enviar cotizacion por el centro de contacto',
            click: function ($itemScope) {
                alertify.confirm("¿Desea enviar la cotización al centro de contacto?", function () {
                    $scope.MostrarProgress(true);
                    let _mensaje = {
                        CuentaMensajeriaContactoID: $scope.PreContacto.CuentaMensajeriaContactoID,
                        Mensaje: "Estimado cliente envio el link de la cotización N." + $itemScope.item.Consecutivo + " \n " + window.location.origin + '/Cotizaciones/VisorInteractivas?UniqueID=' + $itemScope.item.UniqueID
                    };
                    Services.Async(
                        $scope.serviceBaseCOM + "CuentasMensajeriaMensajes/CuentasMensajeriaMensajesEnviar",
                        _mensaje,
                        function (response) {
                            alertify.success(response.rows[0].Descripcion);
                            $scope.MostrarProgress(false);
                        }
                    );                   
                });
            },
            enabled: function ($itemScope) {
                return $scope.PreContacto.CuentaMensajeriaContactoID != null;
            }
        },
        {
            text: '<i class="fal fa-link green"></i>&nbsp;&nbsp;Copiar link interno',
            click: function ($itemScope) {
                navigator.clipboard.writeText(window.location.origin + '/Cotizaciones/VisorInteractivas?UniqueID=' + $itemScope.item.UniqueID + '&CV=false');
                alertify.success("El link se copio en el portapapeles");
            }
        }
        //{
        //    text: '<i class="fal fa-envelope-open-text green"></i>&nbsp;&nbsp;Enviar por email',
        //    click: function ($itemScope) {
        //        $scope.AbrirModalMailCotizacion($itemScope.item);
        //    }
        //}
    ];

    $scope.AbrirNuevaOrdenServicio = function (item) {
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseSTRG + "CotizacionesBodegaje/CotizacionBodegajeDetalladoConsultar/",
            { CotizacionBodegajeID: item.CotizacionBodegajeID, Token: $scope.Usuario.Token },
            function (response) {
                $scope.OrdenServicio = angular.extend({}, angular.copy($scope.PreContacto), response.data);                
                $scope.OrdenServicio.DirIP = $scope.Usuario.Ip;
                $scope.OrdenServicio.Usuario = $scope.Usuario.UsuarioID;
                $scope.OrdenServicio.Token = $scope.Usuario.Token;
                if ($scope.OrdenServicio.ClienteTipoPersonaID != null)
                    $scope.ChangeTipoPersona($scope.OrdenServicio);
                else
                    $scope.OrdenServicio.ShowTipoPersona = true;                       
                if ($scope.OrdenServicio.PreContactoObservaciones != null)
                    $scope.OrdenServicio.PreContactoObservaciones = $scope.HtmlToText($scope.OrdenServicio.PreContactoObservaciones);
                $scope.cargarDireciones($scope.OrdenServicio.Direccion);
                $scope.OrdenServicio.CotizacionConsecutivo = $scope.OrdenServicio.Consecutivo;
                $scope.OrdenServicio.CotizacionObservaciones = $scope.OrdenServicio.Observaciones;
                $scope.OrdenServicio.Observaciones = null;
                $scope.OrdenServicio.PlantillaDocumentoID = null;
                $scope.OrdenServicio.OrdenServicioID = null;
                $scope.OrdenServicio.EstadoOrdenServicioID = 1;
                $scope.OrdenServicio.OrdenServicioBodegajeID = null;
                $scope.OrdenServicio.SoporteConvenioRuta = null;
                $scope.OrdenServicio.OrdenesServiciosBodegajeDirecciones = $scope.OrdenServicio.CotizacionesBodegajeDirecciones;
                $scope.ArrayFalse($scope.OrdenServicio.OrdenesServiciosBodegajeDirecciones);
                $scope.OrdenServicio.OrdenesServiciosBodegajeFechas = [];
                $scope.OrdenServicio.OrdenesServiciosProductos = $scope.OrdenServicio.CotizacionesProductos;
                $scope.ArrayFalse($scope.OrdenServicio.OrdenesServiciosProductos);
                $scope.OrdenServicio.OrdenesServiciosBodegajeBodegas = $scope.OrdenServicio.CotizacionesBodegajeBodegas;
                $scope.ArrayFalse($scope.OrdenServicio.OrdenesServiciosBodegajeBodegas);
                $scope.OrdenServicio.OrdenesServiciosBodegajeArchivos = $scope.OrdenServicio.CotizacionesBodegajeArchivos;                
                $scope.ArrayFalse($scope.OrdenServicio.OrdenesServiciosBodegajeArchivos);
                $scope.OrdenServicio.OrdenesServiciosBodegajeMateriales = $scope.OrdenServicio.CotizacionesBodegajeMateriales;
                $scope.ArrayFalse($scope.OrdenServicio.OrdenesServiciosBodegajeMateriales);
                if ($scope.OrdenServicio.RequiereAprobacionDescuento == true) {
                    angular.forEach($scope.OrdenServicio.OrdenesServiciosProductos, function (elem) {
                        elem.ValorUnitario = elem.ValorUnitarioDescuento;
                    });
                }
                $scope.ServicioBodega == undefined;
                $scope.InitObjectOrdenServicio();
                $scope.OrdenServicio.PagoAnticipado = null;
                let _array = $filter('filter')($scope.OrdenServicio.OrdenesServiciosProductos, function (elem) { return elem.TipoProductoBodegaje == true }, true);
                if (_array.length > 0)
                    $scope.ServicioBodega = _array[0];                
                $scope.ChangeSerieOrdenServicioBodegajeInput();
                $scope.CalcularTotalesOrdenServicio();
                if ($scope.OrdenServicio.TieneFormatoVinculacion == true) {
                    $scope.OrdenServicio.ClienteTipoDocumentoID = $scope.OrdenServicio.FormatoVinculacion.TipoDocumentoID;
                    $scope.OrdenServicio.ClienteDocumento = $scope.OrdenServicio.FormatoVinculacion.Documento;
                    let array_ = [];
                    if ($scope.OrdenServicio.FormatoVinculacion.Juridica == true) 
                        array_ = $filter("filter")($scope.TiposPersonas, function (elem) { return elem.Empresa == true }, true);                    
                    else 
                        array_ = $filter("filter")($scope.TiposPersonas, function (elem) { return elem.DefaultPersonas == true }, true);                    
                    if (array_.length > 0)
                        $scope.OrdenServicio.ClienteTipoPersonaID = array_[0].TipoPersonaID;
                    else
                        $scope.OrdenServicio.ClienteTipoPersonaID = null;
                    if ($scope.OrdenServicio.ClienteTipoPersonaID != null)
                        $scope.ChangeTipoPersona($scope.OrdenServicio);
                    else
                        $scope.OrdenServicio.ShowTipoPersona = true;
                    $scope.OrdenServicio.ClienteNombres = $scope.OrdenServicio.FormatoVinculacion.Nombres;
                    $scope.OrdenServicio.ClienteNombres2 = $scope.OrdenServicio.FormatoVinculacion.Nombres2;
                    $scope.OrdenServicio.ClienteApellidos = $scope.OrdenServicio.FormatoVinculacion.Apellidos;
                    $scope.OrdenServicio.ClienteApellidos2 = $scope.OrdenServicio.FormatoVinculacion.Apellidos2;
                    $scope.OrdenServicio.ClienteDireccion = $scope.OrdenServicio.FormatoVinculacion.Direccion;
                    $scope.OrdenServicio.ClienteTelefono = $scope.OrdenServicio.FormatoVinculacion.Telefono;
                    if ($scope.OrdenServicio.FormatoVinculacion.Juridica == true)
                        $scope.OrdenServicio.ClienteCelular = $scope.OrdenServicio.FormatoVinculacion.RepresentanteCelular;
                    else
                        $scope.OrdenServicio.ClienteCelular = $scope.OrdenServicio.FormatoVinculacion.Celular;
                    $scope.OrdenServicio.ClienteEmail = $scope.OrdenServicio.FormatoVinculacion.Email;
                    if ($scope.OrdenServicio.FormatoVinculacion.Juridica == true)
                        $scope.OrdenServicio.ClienteEmailFacturacionElectronica = $scope.OrdenServicio.FormatoVinculacion.EmailFacturacionElectronica;
                    else
                        $scope.OrdenServicio.ClienteEmailFacturacionElectronica = $scope.OrdenServicio.FormatoVinculacion.Email;
                    $scope.OrdenServicio.ClientePaisID = $scope.OrdenServicio.FormatoVinculacion.PaisID;
                    $scope.OrdenServicio.ClienteCiudadID = $scope.OrdenServicio.FormatoVinculacion.CiudadID;
                    angular.forEach($scope.OrdenServicio.FormatoVinculacion.FormatosVinculacionDocumentos, function (elem) {
                        let _extension = elem.NombreArchivo.split('.').pop().toLowerCase();
                        let _tipologias = $filter('filter')($scope.Tipologias, function (elem) { return elem.Extension == _extension }, true);
                        let _item = {
                            NombreArchivo: elem.NombreArchivo,
                            TipologiaID: _tipologias.length == 0 ? null : _tipologias[0].TipologiaID,
                            SerieID: null,
                            DescripcionSerie: null,
                            Ruta: elem.Ruta,
                            MimeType: null,
                            Eliminar: false
                        };
                        if ($filter("filter")($scope.OrdenServicio.OrdenesServiciosBodegajeArchivos, function (elem2) { return elem2.NombreArchivo == _item.NombreArchivo }, true).length == 0)
                            $scope.OrdenServicio.OrdenesServiciosBodegajeArchivos.push(_item);
                    });
                    if ($scope.OrdenServicio.FormatoVinculacion.RutaPDF != null) {                        
                        let _tipologias = $filter('filter')($scope.Tipologias, function (elem) { return elem.Extension == "pdf" }, true);
                        let _item = {
                            NombreArchivo: "FormatoVinculacion_N°_" + $scope.OrdenServicio.FormatoVinculacion.Consecutivo + ".pdf",
                            TipologiaID: _tipologias.length == 0 ? null : _tipologias[0].TipologiaID,
                            SerieID: null,
                            DescripcionSerie: null,
                            Ruta: $scope.OrdenServicio.FormatoVinculacion.RutaPDF,
                            MimeType: null,
                            Eliminar: false
                        };
                        if ($filter("filter")($scope.OrdenServicio.OrdenesServiciosBodegajeArchivos, function (elem2) { return elem2.NombreArchivo == _item.NombreArchivo }, true).length == 0)
                            $scope.OrdenServicio.OrdenesServiciosBodegajeArchivos.push(_item);
                    }
                    if ($scope.OrdenServicio.FormatoSeguro.Ruta != null) {
                        let _tipologias = $filter('filter')($scope.Tipologias, function (elem) { return elem.Extension == "pdf" }, true);
                        let _item = {
                            NombreArchivo: "FormatoSeguro_N°_" + $scope.OrdenServicio.FormatoSeguro.Consecutivo + ".pdf",
                            TipologiaID: _tipologias.length == 0 ? null : _tipologias[0].TipologiaID,
                            SerieID: null,
                            DescripcionSerie: null,
                            Ruta: $scope.OrdenServicio.FormatoSeguro.Ruta,
                            MimeType: null,
                            Eliminar: false
                        };
                        if ($filter("filter")($scope.OrdenServicio.OrdenesServiciosBodegajeArchivos, function (elem2) { return elem2.NombreArchivo == _item.NombreArchivo }, true).length == 0)
                            $scope.OrdenServicio.OrdenesServiciosBodegajeArchivos.push(_item);
                    }
                }
                $scope.Titulo = "NUEVA ORDEN DE SERVICIO";                
                $scope.MostrarHeaderPrincipal(false);
                $scope.ModoView = 3;
                $scope.MostrarProgress(false);
            }
        );
    };

    $scope.AbrirEditarOrdenServicio = function (item) {
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseSTRG + "OrdenesServiciosBodegaje/OrdenServicioBodegajeDetalladoConsultar/",
            { OrdenServicioBodegajeID: item.OrdenServicioBodegajeID, Token: $scope.Usuario.Token },
            function (response) {
                $scope.OrdenServicio = angular.extend({}, angular.copy($scope.PreContacto), response.data);
                $scope.OrdenServicio.DirIP = $scope.Usuario.Ip;
                $scope.OrdenServicio.Usuario = $scope.Usuario.UsuarioID;
                $scope.OrdenServicio.Token = $scope.Usuario.Token;
                if ($scope.OrdenServicio.ClienteTipoPersonaID != null)
                    $scope.ChangeTipoPersona($scope.OrdenServicio);
                else
                    $scope.OrdenServicio.ShowTipoPersona = true;                
                if ($scope.OrdenServicio.PreContactoObservaciones != null)
                    $scope.OrdenServicio.PreContactoObservaciones = $scope.HtmlToText($scope.OrdenServicio.PreContactoObservaciones);
                $scope.ArrayFalse($scope.OrdenServicio.OrdenesServiciosBodegajeDirecciones);                
                $scope.ArrayFalse($scope.OrdenServicio.OrdenesServiciosBodegajeFechas);
                $scope.ArrayFalse($scope.OrdenServicio.OrdenesServiciosProductos);
                $scope.ArrayFalse($scope.OrdenServicio.OrdenesServiciosBodegajeBodegas);
                $scope.ArrayFalse($scope.OrdenServicio.OrdenesServiciosBodegajeArchivos);
                $scope.ArrayFalse($scope.OrdenServicio.OrdenesServiciosBodegajeMateriales);
                $scope.InitObjectOrdenServicio();
                $scope.ServicioBodega == undefined;
                let _array = $filter('filter')($scope.OrdenServicio.OrdenesServiciosProductos, function (elem) { return elem.TipoProductoBodegaje == true }, true);
                if (_array.length > 0)
                    $scope.ServicioBodega = _array[0];
                $scope.ChangeSerieOrdenServicioBodegajeInput();
                $scope.CalcularTotalesOrdenServicio();
                $scope.Titulo = "ORDEN DE SERVICIO N° " + $scope.OrdenServicio.Consecutivo;
                $scope.MostrarHeaderPrincipal(false);
                $scope.ModoView = 3;
                $scope.MostrarProgress(false);                
            }
        );
    };

    $scope.InitObjectOrdenServicio = function () {
        $scope.Origen = {
            OrdenServicioDireccionID: null,
            Origen: true,
            Eliminar: false
        };
        $scope.CopyOrigen = angular.copy($scope.Origen);
        $scope.Destino = {
            OrdenServicioDireccionID: null,
            Origen: false,
            Eliminar: false
        };
        $scope.CopyDestino = angular.copy($scope.Destino);
        $scope.Empaque = {
            OrdenServicioBodegajeFechaID: null,
            Fecha: null,
            Empaque: true,
            Eliminar: false
        };
        $scope.CopyEmpaque = angular.copy($scope.Empaque);
        $scope.Transporte = {
            OrdenServicioBodegajeFechaTransporteID: null,
            Fecha: null,
            Empaque: false,
            Eliminar: false
        };
        $scope.CopyTransporte = angular.copy($scope.Transporte);
        $scope.Servicio = {
            OrdenServicioProductoID: null,
            ProductoID: null,
            Descripcion: null,
            Cantidad: 1,
            PrecioDiario: 0,
            ValorTotal: 0,
            Eliminar: false
        };
        $scope.CopyServicio = angular.copy($scope.Servicio);
        $scope.Archivo = {
            ArchivoID: null,
            SerieID: null,
            Eliminar: false
        };
        $scope.CopyArchivo = angular.copy($scope.Archivo);
        $scope.Material = {
            OrdenServicioBodegajeMaterialID: null,
            ProductoID: null,
            Cantidad: null,
            Eliminar: false
        };
        $scope.CopyMaterial = angular.copy($scope.Material);
    };

    $scope.searchCiudades = function (term, modelID) {
        let deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseSIS + "Ciudades/CiudadesComboConsultar/",
            { Page: 1, Rows: 30, Nombre: term, CiudadID: modelID, Token: $scope.Usuario.Token },
            function (response) {
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.searchPaises = function (term, modelID) {
        let deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseSIS + "Paises/PaisesConsultar/",
            { Page: 1, Rows: 30, Nombre: term, PaisID: modelID, Token: $scope.Usuario.Token },
            function (response) {
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.ddlSearchPaisesCliente = {
        onSelect: function (item) {
            $scope.OrdenServicio.ClientePaisCodigoISO = (item.CodigoISO == null ? "" : item.CodigoISO).toLowerCase();
            if ($scope.OrdenServicio.ClientePaisCodigoISO != 'co')
                $scope.OrdenServicio.ClienteCiudadID = null;
        }
    };

    $scope.ddlMediosTransporteOrdenServicio = {
        onSelect: function (item) {            
            $scope.OrdenServicio.RequiereDirecciones = item.RequiereDirecciones;
        }
    };

    $scope.AgregarDireccionOrdenServicio = function (origen) {
        let _Direccion;
        if (origen)
            _Direccion = angular.copy($scope.Origen);
        else
            _Direccion = angular.copy($scope.Destino);
        if (_Direccion.Direccion == undefined || _Direccion.Direccion == null) {
            alertify.error("Error ingrese una dirección de origen");
            return false;
        } else {
            $scope.OrdenServicio.OrdenesServiciosBodegajeDirecciones.push(_Direccion);
            if (origen)
                $scope.Origen = angular.copy($scope.CopyOrigen);
            else
                $scope.Destino = angular.copy($scope.CopyDestino);
        }
    };

    $scope.EliminarDireccionOrdenServicio = function (item, index) {
        if (item.OrdenServicioDireccionID == null)
            $scope.OrdenServicio.OrdenesServiciosBodegajeDirecciones.splice(index, 1);
        else
            item.Eliminar = true;
    };

    $scope.AgregarFechaEmpaque = function () {
        if ($scope.Empaque.Fecha == null || $scope.Empaque.Fecha == undefined || $scope.Empaque.Fecha == "") {
            alertify.error("La fecha de empaque es requerida");
            return;
        } else if ($filter('filter')($scope.OrdenServicio.OrdenesServiciosBodegajeFechas, function (elem) { return elem.Eliminar == false && elem.Fecha == $scope.Empaque.Fecha && elem.Empaque == true; }, true).length > 0) {
            alertify.error("La fecha ya esta ingresada");
            return false;
        } else {
            $scope.OrdenServicio.OrdenesServiciosBodegajeFechas.push(angular.copy($scope.Empaque));
            $scope.Empaque = angular.copy($scope.CopyEmpaque);
        }
    };

    $scope.EliminarFechaEmpaque = function (item, index) {
        if (item.OrdenServicioBodegajeFechaID == null)
            $scope.OrdenServicio.OrdenesServiciosBodegajeFechas.splice(index, 1);
        else
            item.Eliminar = true;
    };

    $scope.AgregarFechaTransporte = function () {
        if ($scope.Transporte.Fecha == null || $scope.Transporte.Fecha == undefined || $scope.Transporte.Fecha == "") {
            alertify.error("La fecha de transporte es requerida");
            return;
        } else if ($filter('filter')($scope.OrdenServicio.OrdenesServiciosBodegajeFechas, function (elem) { return elem.Eliminar == false && elem.Fecha == $scope.Empaque.Fecha && elem.Empaque == false }, true).length > 0) {
            alertify.error("La fecha ya esta ingresada");
            return false;
        } else {
            $scope.OrdenServicio.OrdenesServiciosBodegajeFechas.push(angular.copy($scope.Transporte));
            $scope.Transporte = angular.copy($scope.CopyTransporte);
        }
    };

    $scope.EliminarFechaTransporte = function (item, index) {
        if (item.OrdenServicioBodegajeFechaID == null)
            $scope.OrdenServicio.OrdenesServiciosBodegajeFechas.splice(index, 1);
        else
            item.Eliminar = true;
    };

    $scope.ddlSearchProductosOrdenServicio = {
        onSelect: function (item) {
            if ($scope.OrdenServicio.Diario == true) {
                item.ValorUnitario = item.PrecioDiario;
                $scope.Servicio = angular.extend({}, $scope.Servicio, item);
                $scope.Servicio.Cantidad = 1;
                if (item.TipoProductoBodegaje == true) 
                    $scope.Servicio.ValorTotal = $scope.Servicio.ValorUnitario * $scope.Servicio.Cantidad * $scope.OrdenServicio.Duracion;
                 else 
                    $scope.Servicio.ValorTotal = $scope.Servicio.ValorUnitario * $scope.Servicio.Cantidad;                
                $scope.Servicio.Descripcion = $scope.Servicio.Nombre;
            } else {
                item.ValorUnitario = item.PrecioBase;
                $scope.Servicio = angular.extend({}, $scope.Servicio, item);
                $scope.Servicio.Cantidad = 1;
                $scope.Servicio.Duracion = 1;
                $scope.Servicio.Descripcion = $scope.Servicio.Nombre;
                $scope.Servicio.ValorTotal = $scope.Servicio.ValorUnitario * $scope.Servicio.Cantidad;
            }
        }
    };

    $scope.AgregarServicioOS = function () {
        if ($scope.Servicio.ProductoID == undefined || $scope.Servicio.ProductoID == null) {
            alertify.error("Error seleccione un servicio");
            return false;
        } else if ($scope.Servicio.Cantidad == undefined || $scope.ServicioCantidad == 0) {
            alertify.error("Error ingrese una cantidad valida");
            return false;
        } else if ($scope.Servicio.ValorUnitario == undefined || $scope.Servicio.ValorUnitario == 0) {
            alertify.error("Error ingrese un valor");
            return false;
        } else if ($filter('filter')($scope.OrdenServicio.OrdenesServiciosProductos, function (elem) { return elem.Eliminar == false && elem.ProductoID == $scope.Servicio.ProductoID }, true).length > 0) {
            alertify.error("Error el producto ya se ingreso");
            return false;
        } else {              
            $scope.Servicio.ValorTotal = ($scope.Servicio.ValorUnitario * ($scope.OrdenServicio.Diario == true ? $scope.OrdenServicio.Duracion : 1)) * $scope.Servicio.Cantidad;
            $scope.OrdenServicio.OrdenesServiciosProductos.push(angular.copy($scope.Servicio));
            $scope.Servicio = angular.copy($scope.CopyServicio);
            if ($scope.ServicioBodega == undefined) {
                let _array = $filter('filter')($scope.OrdenServicio.OrdenesServiciosProductos, function (elem) { return elem.Eliminar == false && elem.TipoProductoBodegaje == true }, true);
                if (_array.length > 0)
                    $scope.ServicioBodega = _array[0];
            }
            $scope.CalcularTotalesOrdenServicio();
        }
    };

    $scope.CalcularTotalesOrdenServicio = function () {
        $scope.OrdenServicio.SubTotalServicio = 0;
        $scope.OrdenServicio.SubTotalNoServicio = 0;
        $scope.OrdenServicio.TotalServicio = 0;
        angular.forEach($scope.OrdenServicio.OrdenesServiciosProductos, function (elem) {
            if (elem.Eliminar == false) {
                if (elem.ProductoID == null)
                    $scope.OrdenServicio.SubTotalNoServicio += elem.ValorTotal;
                else
                    $scope.OrdenServicio.SubTotalServicio += elem.ValorTotal;
            }
        });
        $scope.OrdenServicio.TotalServicio = $scope.OrdenServicio.SubTotalServicio + $scope.OrdenServicio.SubTotalNoServicio;
    };

    $scope.ChangeServicioOS = function (item, IsDias) {
        if (item) {
            if (item.Cantidad != "") {
                if (item.TipoProductoBodegaje) {
                    let _arrayBodegas = $filter('filter')($scope.OrdenServicio.OrdenesServiciosBodegajeBodegas, function (elem) { return elem.Eliminar == false && elem.ProductoID == item.ProductoID }, true);
                    if (_arrayBodegas.length > item.Cantidad) {
                        alertify.error("No se puede asignar una menor cantidad por las bodegas reservadas. Si desea bajar la cantidad elimine las reservas");
                        item.Cantidad = _arrayBodegas.length;
                        return false;
                    } else {
                        if ($scope.OrdenServicio.Diario == true)
                            item.ValorTotal = item.Cantidad * item.ValorUnitario * $scope.OrdenServicio.Duracion;                        
                        else
                            item.ValorTotal = item.Cantidad * item.ValorUnitario;
                    }
                } else {                    
                    item.ValorTotal = item.Cantidad * item.ValorUnitario;                    
                }
            } else {
                if (item.TipoProductoBodegaje) {
                    item.Cantidad = $filter('filter')($scope.OrdenServicio.OrdenesServiciosBodegajeBodegas, function (elem) { return elem.Eliminar == false && elem.ProductoID == item.ProductoID }, true).length;
                } else {
                    item.Cantidad = 0;
                }
            }
        } else if (IsDias == undefined) {
            if ($scope.OrdenServicio.Diario == true) {
                if ($scope.OrdenServicio.TipoProductoBodegaje == true && $scope.OrdenServicio.Diario == true) 
                    $scope.Servicio.ValorTotal = $scope.Servicio.Cantidad * ($scope.Servicio.PrecioDiario == 0 || $scope.Servicio.PrecioDiario == null ? $scope.Servicio.ValorUnitario : $scope.Servicio.PrecioDiario) * $scope.OrdenServicio.Duracion;
                 else 
                    $scope.Servicio.ValorTotal = $scope.Servicio.Cantidad * ($scope.Servicio.PrecioDiario == 0 || $scope.Servicio.PrecioDiario == null ? $scope.Servicio.ValorUnitario : $scope.Servicio.PrecioDiario);                
            } else {
                $scope.Servicio.ValorTotal = $scope.Servicio.Cantidad * ($scope.Servicio.ValorBase == undefined ? $scope.Servicio.ValorUnitario : $scope.Servicio.ValorBase);
            }
        }
        angular.forEach($scope.OrdenServicio.OrdenesServiciosProductos, function (elem) {
            if (elem.TipoProductoBodegaje == true && $scope.OrdenServicio.Diario == true) {
                elem.ValorUnitario = elem.PrecioDiario;
                elem.ValorTotal = elem.Cantidad * (elem.PrecioDiario == 0 || elem.PrecioDiario == null ? elem.ValorUnitario : elem.PrecioDiario) * $scope.OrdenServicio.Duracion;
            } else {
                if (elem.ValorUnitario == undefined || elem.ValorUnitario == 0)
                    elem.ValorUnitario = elem.PrecioBase;
                elem.ValorTotal = elem.Cantidad * elem.ValorUnitario;
            }
        });        
        $scope.CalcularTotalesOrdenServicio();
    };

    $scope.EliminarServicioOS = function (item, index) {
        if ($filter('filter')($scope.OrdenServicio.OrdenesServiciosBodegajeBodegas, function (elem) { return elem.Eliminar == false && elem.ProductoID == item.ProductoID && elem.BodegaEstadoID != undefined }, true).length > 0) {
            alertify.error("No se puede eliminar el servicio por que tiene reservas asociadas");
            return false;
        } else {
            if (item.OrdenServicioProductoID == null) 
                $scope.OrdenServicio.OrdenesServiciosProductos.splice(index, 1);
             else 
                item.Eliminar = true;
            $scope.CalcularTotalesOrdenServicio();
        }
    };

    $scope.AbrirModalBodegasOS = function () {
        if ($scope.ServicioBodega == undefined || $scope.ServicioBodega == null) {
            alertify.error("Seleccione un servicio primero");
            return false;
        } else if ($filter('filter')($scope.OrdenServicio.OrdenesServiciosBodegajeBodegas, function (elem) { return elem.Eliminar == false && elem.ProductoID == $scope.ServicioBodega.ProductoID }, true).length >= $scope.ServicioBodega.Cantidad) {
            alertify.error("Ya alcanzo la cantidad de reservas permitidas");
            return false;
        } else {
            $scope.MostrarProgress(true);
            $scope.Controller_ModalReservacion = angular.element($(".Controller_ModalReservacion")[0]).scope();
            $scope.Controller_ModalReservacion.InitModalReservacion($scope.ServicioBodega, function (BodegaSeleccionada) {
                if ($filter('filter')($scope.OrdenServicio.OrdenesServiciosBodegajeBodegas, function (elem) { return elem.Eliminar == false && elem.ProductoID == $scope.ServicioBodega.ProductoID }, true).length >= $scope.ServicioBodega.Cantidad) {
                    alertify.error("Ya alcanzo la cantidad de reservas permitidas");
                    return false;
                } else if ($filter('filter')($scope.OrdenServicio.OrdenesServiciosBodegajeBodegas, function (elem) { return elem.Eliminar == false && elem.BodegaID == BodegaSeleccionada.BodegaID }, true).length > 0) {
                    alertify.error("La bodega N°-" + BodegaSeleccionada.Codigo + " ya la tiene reservada.");
                    return false;
                } else {
                    angular.forEach(BodegaSeleccionada.Atributos, function (elem) {
                        $scope.ServicioBodega[elem.Nombre] = elem.Valor;
                    });
                    BodegaSeleccionada.OrdenServicioBodegajeBodegaID = null;
                    BodegaSeleccionada.Eliminar = false;
                    BodegaSeleccionada.CodigoBodega = BodegaSeleccionada.Codigo;
                    let _ServicioBodega = angular.extend({}, $scope.ServicioBodega, BodegaSeleccionada);
                    $scope.OrdenServicio.OrdenesServiciosBodegajeBodegas.push(angular.copy(_ServicioBodega));
                }
            });
            $scope.MostrarProgress(false);
        }
    };

    $scope.RemoveBodegaOS = function (item, index) {
        alertify.confirm("¿Desea quitar la reserva de la bodega N°" + item.Codigo + "?", function () {
            if (item.OrdenServicioBodegajeBodegaID == null)
                $scope.OrdenServicio.OrdenesServiciosBodegajeBodegas.splice(index, 1);
            else {
                Services.Async(
                    $scope.serviceBaseSTRG + "OrdenesServiciosBodegaje/EliminarBodegasReservadas/",
                    {
                        DirIP: $scope.Usuario.Ip,
                        Usuario: $scope.Usuario.UsuarioID,
                        OrdenServicioBodegajeBodegaID: item.OrdenServicioBodegajeBodegaID,
                        Token: $scope.Usuario.Token
                    },
                    function (response) {
                        $scope.OrdenServicio.OrdenesServiciosBodegajeBodegas.splice(index, 1);
                    }
                );
            }
        });
    };

    $scope.EliminarNoServicioOS = function (item, index) {
        if (item.OrdenServicioProductoID == null)
            $scope.OrdenServicio.OrdenesServiciosProductos.splice(index, 1);
        else
            item.Eliminar = true;
        $scope.CalcularTotalesOrdenServicio();
    };

    $scope.ChangeNoServicioOS = function (item) {
        if (item.Cantidad == 0 || item.Cantidad == "") {
            item.Cantidad = 1;
            item.ValorTotal = item.Cantidad * item.ValorUnitario;
            alertify.error("La cantidad minima es de 1");
            return;
        }
        if (item.ValorUnitario == 0 || item.ValorUnitario == "") {
            item.ValorUnitario = 1;
            item.ValorTotal = item.Cantidad * item.ValorUnitario;
            alertify.error("El valor minimo es de 1");
            return;
        }
        item.ValorTotal = item.Cantidad * item.ValorUnitario;
        $scope.CalcularTotalesOrdenServicio();        
    };

    $scope.ConfigInputOrdenServicio = {
        IsDisabled: false,
        CDNEndPoint: $scope.Usuario.CDNEndPoint,
        CDNLlavePublica: $scope.Usuario.CDNLlavePublica,
        CDNLlavePrivada: $scope.Usuario.CDNLlavePrivada,
        Token: $scope.Usuario.Token,
        PreUploadFileCDN: function (_file, _config) {
            let extension = _file.name.split('.').pop().toLowerCase();
            if ($scope.Archivo.SerieID == undefined || $scope.Archivo.SerieID == null) {
                alertify.error("Seleccione un tipo de documento.");
                return false;
            }
            let _tipologias = $filter('filter')($scope.Tipologias, function (elem) { return elem.Extension == extension }, true);
            if (_tipologias.length == 0) {
                alertify.error("La tipologia ." + extension + " de este archivo no esta registrada.");
                return false;
            }
            return true;
        },
        UploadFileCDN: function (response, _file) {
            let extension = _file.name.split('.').pop().toLowerCase();
            let _tipologias = $filter('filter')($scope.Tipologias, function (elem) { return elem.Extension == extension }, true);
            let item = {
                NombreArchivo: _file.name,
                TipologiaID: _tipologias[0].TipologiaID,
                DescripcionSerie: $filter('filter')($scope.SeriesOrdenesServiciosBodegaje, function (elem) { return elem.SerieID == $scope.Archivo.SerieID }, true)[0].DescripcionSerie,
                Ruta: "cdn://" + response.CodigoUnico,
                MimeType: _file.type,
                Eliminar: false
            };
            $scope.Archivo = angular.extend({}, $scope.Archivo, item);
            $scope.OrdenServicio.OrdenesServiciosBodegajeArchivos.push(angular.copy($scope.Archivo));
            $scope.Archivo = angular.copy($scope.CopyArchivo);
            $scope.ChangeSerieOrdenServicioBodegajeInput();
        }
    };

    $scope.EliminarArchivoOS = function (item, index) {
        alertify.confirm("¿Desea eliminar el archivo (Se eliminara de todo lado)?", function () {
            if (item.ArchivoID == null && $scope.OrdenServicio.OrdenServicioID != null) {
                $scope.EliminarArchivoCDN([{ CodigoUnico: item.Ruta.replaceAll("cdn://", "") }], function (response) {
                    $scope.OrdenServicio.OrdenesServiciosBodegajeArchivos.splice(index, 1);
                });
            } else
                item.Eliminar = true;
        });
    };

    $scope.ChangeSerieOrdenServicioBodegajeInput = function () {
        if ($scope.Archivo.SerieID == null)
            $scope.ConfigInputOrdenServicio.SetFieldBaseArchivo("IsDisabled", true);
        else
            $scope.ConfigInputOrdenServicio.SetFieldBaseArchivo("IsDisabled", false);
    };

    $scope.ddlSearchProductosMateriales = {
        onSelect: function (item) {
            $scope.Material.Nombre = item.Nombre;
        }
    };

    $scope.AgregarMateriales = function () {
        if ($scope.Material.ProductoID == undefined || $scope.Material.ProductoID == null) {
            alertify.error("Seleccione un material");
            return;
        } else if ($filter('filter')($scope.OrdenServicio.OrdenesServiciosBodegajeMateriales, function (elem) { return elem.Eliminar == false && elem.ProductoID == $scope.Material.ProductoID }, true).length > 0) {
            alertify.error("El material ya esta ingresado");
            return;
        } else if ($scope.Material.Cantidad == undefined || $scope.Material.Cantidad == null || $scope.Material.Cantidad < 0 || $scope.Material.Cantidad == "") {
            alertify.error("Ingrese una cantidad valida");
            return;
        } else {
            $scope.OrdenServicio.OrdenesServiciosBodegajeMateriales.push(angular.copy($scope.Material));
            $scope.Material = angular.copy($scope.CopyMaterial);
        }
    };

    $scope.EliminarMateriales = function (item, index) {
        if (item.OrdenServicioBodegajeMaterialID == null)
            $scope.OrdenServicio.OrdenesServiciosBodegajeMateriales.splice(index, 1);
        else
            item.Eliminar = true;
    };

    $scope.ValidarOrdenServicio = function () {        
        if ($scope.OrdenServicio.Nombres == undefined || $scope.OrdenServicio.Nombres == null || $scope.OrdenServicio.Nombres == "") {
            alertify.error("El nombre es obligatorio.");
            return false;
        }        
        if ($scope.OrdenServicio.Apellidos == undefined || $scope.OrdenServicio.Apellidos == null || $scope.OrdenServicio.Apellidos == "") {
            alertify.error("El apellido es obligatorio.");
            return false;
        }        
        if ($scope.OrdenServicio.Celular == undefined || $scope.OrdenServicio.Celular == null || $scope.OrdenServicio.Celular == "") {
            alertify.error("Debe ingresar el celular es obligatorio");
            return false;
        }
        if ($scope.OrdenServicio.Email == undefined || $scope.OrdenServicio.Email == null || $scope.OrdenServicio.Email == "") {
            alertify.error("Debe ingresar el email es obligatorio");
            return false;
        }   
        if ($scope.OrdenServicio.ClienteTipoDocumentoID == undefined || $scope.OrdenServicio.ClienteTipoDocumentoID == null) {
            alertify.error("Debe seleccionar un tipo de identificación es obligatorio");
            return false;
        }
        if ($scope.OrdenServicio.ClienteDocumento == undefined || $scope.OrdenServicio.ClienteDocumento == null || $scope.OrdenServicio.ClienteDocumento == "") {
            alertify.error("Debe ingresar un numero de identificación del cliente");
            return false;
        }
        if ($scope.OrdenServicio.ClienteTipoPersonaID == undefined || $scope.OrdenServicio.ClienteTipoPersonaID == null) {
            alertify.error("El tipo de persona es obligatorio.");
            return false;
        }
        if ($scope.OrdenServicio.ClienteNombres == undefined || $scope.OrdenServicio.ClienteNombres == null || $scope.OrdenServicio.ClienteNombres == "") {
            alertify.error("El nombre del cliente es obligatorio.");
            return false;
        }
        let _empresa = $filter('filter')($scope.TiposPersonas, function (elem) { return elem.TipoPersonaID == $scope.OrdenServicio.ClienteTipoPersonaID }, true)[0].Empresa;
        if (_empresa == false) {
            if ($scope.OrdenServicio.ClienteApellidos == undefined || $scope.OrdenServicio.ClienteApellidos == null || $scope.OrdenServicio.ClienteApellidos == "") {
                alertify.error("El apellido del cliente es obligatorio.");
                return false;
            }
        }
        if ($scope.OrdenServicio.ClienteDireccion == undefined || $scope.OrdenServicio.ClienteDireccion == null || $scope.OrdenServicio.ClienteDireccion == "") {
            alertify.error("Debe ingresar la dirección del cliente es obligatorio");
            return false;
        }
        if ($scope.OrdenServicio.ClienteEmailFacturacionElectronica == undefined || $scope.OrdenServicio.ClienteEmailFacturacionElectronica == null || $scope.OrdenServicio.ClienteEmailFacturacionElectronica == "") {
            alertify.error("Debe ingresar el email de facturación del cliente es obligatorio");
            return false;
        }
        if ($scope.OrdenServicio.ClientePaisID == undefined || $scope.OrdenServicio.ClientePaisID == null) {
            alertify.error("El pais del cliente es obligatoria.");
            return false;
        }
        if ($scope.OrdenServicio.ClientePaisCodigoISO == 'co') {
            if ($scope.OrdenServicio.ClienteCiudadID == undefined || $scope.OrdenServicio.ClienteCiudadID == null) {
                alertify.error("La ciudad del cliente es obligatoria.");
                return false;
            }
        } else {
            $scope.OrdenServicio.ClienteCiudadID = null;
        }   
        if ($scope.OrdenServicio.MedioTransporteID == undefined || $scope.OrdenServicio.MedioTransporteID == null) {
            alertify.error("Debe seleccionar un medio de transporte.");
            return false;
        }
        if ($scope.OrdenServicio.RequiereDirecciones == true) {
            if ($filter("filter")($scope.OrdenServicio.OrdenesServiciosBodegajeDirecciones, function (elem) { return elem.Eliminar == false && elem.Origen == true }).length == 0) {
                alertify.error("Debe ingresar al menos una dirección de origen.");
                return false;
            }
            if ($filter("filter")($scope.OrdenServicio.OrdenesServiciosBodegajeDirecciones, function (elem) { return elem.Eliminar == false && elem.Origen == false }).length == 0) {
                alertify.error("Debe ingresar al menos una dirección de destino.");
                return false;
            }
            let _FechasTransporte = $filter("filter")($scope.OrdenServicio.OrdenesServiciosBodegajeFechas, function (elem) { return elem.Eliminar == false && elem.Empaque == false });
            let _FechasEmpaque = $filter("filter")($scope.OrdenServicio.OrdenesServiciosBodegajeFechas, function (elem) { return elem.Eliminar == false && elem.Empaque == true });
            if (_FechasTransporte.length == 0) {
                alertify.error("Debe ingresar al menos una fecha de transporte para la orden de servicio");
                return false;
            }
            for (let i = 0; i < _FechasTransporte.length; i++) {
                let _fechaT = moment(_FechasTransporte[i].Fecha, "DD-MM-YYYY HH:mm").format("DD-MM-YYYY");
                for (let j = 0; j < _FechasEmpaque.length; j++) {
                    let _fechaE = moment(_FechasEmpaque[j].Fecha, "DD-MM-YYYY HH:mm").format("DD-MM-YYYY");
                    if (_fechaT == _fechaE) {
                        alertify.error("No se puede programar el mismo dia el empaque y el transporte");
                        return false;
                    }
                }
            }
        } else {
            angular.forEach($scope.OrdenServicio.OrdenesServiciosBodegajeDirecciones, function (elem) {
                elem.Eliminar = true;
            });
            angular.forEach($scope.OrdenServicio.OrdenesServiciosBodegajeFechas, function (elem) {
                elem.Eliminar = true;
            });
        }
        if ($filter("filter")($scope.OrdenServicio.OrdenesServiciosProductos, function (elem) { return elem.Eliminar == false }).length == 0) {
            alertify.error("Debe haber un servicio por lo menos");
            return false;
        }
        for (let i = 0; i < $scope.OrdenServicio.OrdenesServiciosBodegajeArchivos.length; i++) {
            let _elem = $scope.OrdenServicio.OrdenesServiciosBodegajeArchivos[i];
            if ((_elem.SerieID == undefined || _elem.SerieID == null) && _elem.Eliminar == false) {
                alertify.error("El tipo de archivo es requerido");
                return false;
            }
        }
        if ($scope.OrdenServicio.PagoAnticipado == true) {
            if ($scope.OrdenServicio.AnticipoFechaInicio == undefined || $scope.OrdenServicio.AnticipoFechaInicio == null || $scope.OrdenServicio.AnticipoFechaInicio == "") {
                alertify.error("Debe ingresar la fecha de inicio del anticipo");
                return false;
            }
            if ($scope.OrdenServicio.AnticipoMeses == undefined || $scope.OrdenServicio.AnticipoMeses == null || $scope.OrdenServicio.AnticipoMeses == 0) {
                alertify.error("Debe ingresar la duración del anticipo");
                return false;
            }
        } else {
            $scope.OrdenServicio.AnticipoFechaInicio = null;
            $scope.OrdenServicio.AnticipoMeses = null;
        }
        return true;
    };

    $scope.EliminarArchivoSoporteConvenio = function () {
        alertify.confirm("¿Desea eliminar el soporte del convenio?", function () {
            if ($scope.OrdenServicio.SoporteConvenioRuta != null) {
                $scope.EliminarArchivoCDN([{ CodigoUnico: $scope.OrdenServicio.SoporteConvenioRuta }], function (response) {
                    if ($scope.OrdenServicio.OrdenServicioBodegajeID == null)
                        $scope.OrdenServicio.SoporteConvenioRuta = null;
                    else {
                        let _item = {
                            DirIp: $scope.Usuario.Ip,
                            Usuario: $scope.Usuario.UsuarioID,
                            OrdenServicioBodegajeID: $scope.OrdenServicio.OrdenServicioBodegajeID,
                            Ruta: null,
                            Token: $scope.Usuario.Token
                        };
                        Services.Async(
                            $scope.serviceBaseSTRG + "OrdenesServiciosBodegaje/OrdenesServiciosBodegajeConvenio",
                            _item,
                            function (response) {
                                $scope.OrdenServicio.SoporteConvenioRuta = null;
                                alertify.success(response.rows[0].Descripcion);
                            }
                        );
                    }
                });
            }
        });
    };

    $scope.ConfigInputSoporteConvenio = {
        IsDisabled: false,
        CDNEndPoint: $scope.Usuario.CDNEndPoint,
        CDNLlavePublica: $scope.Usuario.CDNLlavePublica,
        CDNLlavePrivada: $scope.Usuario.CDNLlavePrivada,
        Token: $scope.Usuario.Token,
        PreUploadFileCDN: function (_file, _config) {
            let _extension = _file.name.split(".").pop().toLowerCase();
            if (_extension != "pdf" && _extension != "tif") {
                alertify.error("Solo se pueden agregar archivos PDF o TIF.");
                return false;
            }
            return true;
        },
        UploadFileCDN: function (responseFile, _file) {
            if ($scope.OrdenServicio.OrdenServicioBodegajeID == null)
                $scope.OrdenServicio.SoporteConvenioRuta = "cdn://" + responseFile.CodigoUnico;
            else {
                let _item = {
                    DirIp: $scope.Usuario.Ip,
                    Usuario: $scope.Usuario.UsuarioID,
                    OrdenServicioBodegajeID: $scope.OrdenServicio.OrdenServicioBodegajeID,
                    Ruta: "cdn://" + responseFile.CodigoUnico,
                    Token: $scope.Usuario.Token
                };
                Services.Async(
                    $scope.serviceBaseSTRG + "OrdenesServiciosBodegaje/OrdenesServiciosBodegajeConvenio",
                    _item,
                    function (response) {
                        $scope.OrdenServicio.SoporteConvenioRuta = "cdn://" + responseFile.CodigoUnico;
                        alertify.success(response.rows[0].Descripcion);
                        $scope.CommitCDN([$scope.OrdenServicio.SoporteConvenioRuta.replaceAll("cdn://", "")]);
                    }
                );
            }
        }
    };

    $scope.GuardarOrdenServicio = function () {
        if ($scope.ValidarOrdenServicio()) {
            alertify.confirm("¿Desea crear la orden de servicio?", function () {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseSTRG + "OrdenesServiciosBodegaje/OrdenesServiciosBodegajeInsertar/",
                    $scope.OrdenServicio,
                    function (response) {
                        let _arrayFiles = [], _arrayDeleteFiles = [];
                        angular.forEach($scope.OrdenServicio.OrdenesServiciosBodegajeArchivos, function (elem) {
                            if (elem.Ruta.indexOf("cdn://") != -1) {
                                if (elem.Eliminar == false)
                                    _arrayFiles.push(elem.Ruta.replaceAll("cdn://", ""));
                                else
                                    _arrayDeleteFiles.push({ CodigoUnico: elem.Ruta.replaceAll("cdn://", "") });
                            }
                        });
                        if ($scope.OrdenServicio.SoporteConvenioRuta != null) {
                            _arrayFiles.push($scope.OrdenServicio.SoporteConvenioRuta.replaceAll("cdn://", ""));
                        }
                        $scope.CommitCDN(_arrayFiles);
                        $scope.EliminarArchivoCDN(_arrayDeleteFiles);
                        alertify.success(response.rows[0].Descripcion);
                        $scope.Sincronizar(function () {
                            $scope.AtrasModoView();
                            $scope.PreContacto.ShowOrdenesServicios = true;
                            $scope.MostrarProgress(false);
                        });
                    },
                    function (response) {
                        $scope.Sincronizar(function () {
                            $scope.MostrarProgress(false);
                        });
                        alertify.error(response.data.Message);
                    }
                );
            });
        }
    };

    $scope.ActualizarOrdenServicio = function () {
        if ($scope.ValidarOrdenServicio()) {
            alertify.confirm("¿Desea guardar los cambios de la orden de servicio?", function () {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseSTRG + "OrdenesServiciosBodegaje/OrdenesServiciosBodegajeActualizar/",
                    $scope.OrdenServicio,
                    function (response) {
                        let _arrayFiles = [], _arrayDeleteFiles = [];
                        angular.forEach($scope.OrdenServicio.OrdenesServiciosBodegajeArchivos, function (elem) {
                            if (elem.Ruta.indexOf("cdn://") != -1) {
                                if (elem.Eliminar == false)
                                    _arrayFiles.push(elem.Ruta.replaceAll("cdn://", ""));
                                else
                                    _arrayDeleteFiles.push({ CodigoUnico: elem.Ruta.replaceAll("cdn://", "") });
                            }
                        });
                        $scope.CommitCDN(_arrayFiles);
                        $scope.EliminarArchivoCDN(_arrayDeleteFiles);
                        alertify.success(response.rows[0].Descripcion);
                        $scope.Sincronizar(function () {
                            $scope.AtrasModoView();
                            $scope.PreContacto.ShowOrdenesServicios = true;
                            $scope.MostrarProgress(false);
                        });
                    },
                    function (response) {
                        $scope.Sincronizar(function () {
                            $scope.MostrarProgress(false);
                        });
                        alertify.error(response.data.Message);
                    }
                );
            });
        }
    };

    $scope.AbrirModalCambioBodega = function () {
        $scope.CambioBodega = {
            TipoDocumentoID: null,
            Documento: null,
            ContratosBodegas: []
        };
        $scope.ContratosBodegasSeleccionadas = [];
        angular.element("#modalCambioBodega").modal("show");
    };

    $scope.InitCambioBodega = function (elem) {
        elem.Seleccionar = $filter("filter")($scope.ContratosBodegasSeleccionadas, function (item) { return item.ContratoBodegaID == elem.ContratoBodegaID }, true).length > 0;
    };

    $scope.ChangeCambioBodega = function (elem) {
        if (elem.Seleccionar == true) {
            if ($scope.ContratosBodegasSeleccionadas.length == 0) {
                $scope.ContratosBodegasSeleccionadas.push(angular.copy(elem));
                return;
            }
            let _array = $filter("filter")($scope.ContratosBodegasSeleccionadas, function (item) { return item.ContratoID == elem.ContratoID }, true);
            if (_array.length == 0) {
                $scope.ContratosBodegasSeleccionadas = [];
                for (let i = 0; i < $scope.CambioBodega.ContratosBodegas.length; i++) {
                    for (let j = 0; j < $scope.CambioBodega.ContratosBodegas[i].Bodegas.length; j++) {
                        if ($scope.CambioBodega.ContratosBodegas[i].Bodegas[j].ContratoID != elem.ContratoID) {
                            $scope.CambioBodega.ContratosBodegas[i].Bodegas[j].Seleccionar = false;
                        }
                    }
                }
            }
            let _array2 = $filter("filter")($scope.ContratosBodegasSeleccionadas, function (item) { return item.ContratoBodegaID == elem.ContratoBodegaID }, true);
            if (_array2.length == 0)
                $scope.ContratosBodegasSeleccionadas.push(angular.copy(elem));
        } else {
            for (let i = 0; i < $scope.ContratosBodegasSeleccionadas.length; i++) {
                if ($scope.ContratosBodegasSeleccionadas[i].ContratoBodegaID == elem.ContratoBodegaID) {
                    $scope.ContratosBodegasSeleccionadas.splice(i, 1);
                    break;
                }
            }
        }
    };

    $scope.BuscarBodegasCambio = function () {
        if ($scope.CambioBodega.TipoDocumentoID == null || $scope.CambioBodega.TipoDocumentoID == undefined) {
            alertify.error("El tipo de documento es requerido");
            return;
        }
        if ($scope.CambioBodega.Documento == null || $scope.CambioBodega.Documento == undefined || $scope.CambioBodega.Documento == "") {
            alertify.error("El documento es requerido");
            return;
        }
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseSTRG + "Contratos/ContratosBodegasPorDocumento",
            $scope.CambioBodega,
            function (response) {
                $scope.CambioBodega.ContratosBodegas = response.data;
                if ($scope.CambioBodega.ContratosBodegas.length == 0) {
                    alertify.error("No se encontraron contratos");
                }
                $scope.MostrarProgress(false);
            }
        );
    };

    $scope.GenerarFEBCambioDeBodega = function () {
        if ($scope.ContratosBodegasSeleccionadas.length == 0) {
            alertify.error("Debe seleccionar al menos 1 bodega");
            return;
        }
        alertify.confirm("¿Desea generar el FEB de las bodegas seleccionadas?", function () {
            $scope.MostrarProgress(true);            
            Services.Async(
                $scope.serviceBaseSTRG + "Contratos/GenerarFEBCambioBodega/",
                { Bodegas: $scope.ContratosBodegasSeleccionadas },
                function (response) {
                    $scope.MostrarProgress(false);
                    alertify.success(response.rows[0].Descripcion);
                    $scope.BuscarBodegasCambio();
                }
            );
        });
    };

    $scope.MenuOrdenesServicios = [
        {
            text: '<i class="fal fa-file-invoice-dollar blue"></i>&nbsp;&nbsp;Documento PDF',
            click: function ($itemScope) {
                $scope.viewer.Open("API_STRG/api/PDFs/DocumentoD?TipoDocumentoID=3&DocumentoID=" + $itemScope.item.OrdenServicioID);
            }
        },       
        {
            text: '<i class="fal fa-edit blue"></i>&nbsp;&nbsp;Editar',
            click: function ($itemScope) {
                $scope.AbrirEditarOrdenServicio($itemScope.item);
            }
        },
        {
            text: '<i class="fab fa-whatsapp"></i>&nbsp;&nbsp;Enviar orden de servicio por el centro de contacto',
            click: function ($itemScope) {
                alertify.confirm("¿Desea enviar la orden de servicio al centro de contacto?", function () {
                    $scope.MostrarProgress(true);
                    let _mensaje = {
                        CuentaMensajeriaContactoID: $scope.PreContacto.CuentaMensajeriaContactoID,
                        Mensaje: "Estimado cliente envio el link de la orden de servicio N." + $itemScope.item.Consecutivo,
                        Files: [
                            {
                                FileName: "Orden de servicio N°." + $itemScope.item.Consecutivo,
                                FileMime: "application/pdf",
                                TipoMensaje: "document",
                                FileURL: window.location.origin + "/API_STRG/api/PDFs/DocumentoD?TipoDocumentoID=3&DocumentoID=" + $itemScope.item.OrdenServicioID + "&Attachment=true&Token=" + $scope.Usuario.Token
                            }
                        ]
                    };
                    Services.Async(
                        $scope.serviceBaseCOM + "CuentasMensajeriaMensajes/CuentasMensajeriaMensajesEnviar",
                        _mensaje,
                        function (response) {
                            alertify.success(response.rows[0].Descripcion);
                            $scope.MostrarProgress(false);
                        }
                    );
                });
            },
            enabled: function ($itemScope) {
                return $scope.PreContacto.CuentaMensajeriaContactoID != null;
            }
        },
        {
            text: '<i class="fal fa-check-circle orange"></i>&nbsp;&nbsp;Aprobar',
            click: function ($itemScope) {
                alertify.confirm("¿Desea aprobar la orden de servicio N°" + $itemScope.item.Consecutivo + "?", function () {
                    $scope.MostrarProgress(true);                    
                    $itemScope.item.DirIp = $scope.Usuario.Ip;
                    $itemScope.item.Usuario = $scope.Usuario.UsuarioID;
                    $itemScope.item.SucursalID = $scope.Usuario.SucursalID;
                    $itemScope.item.Token = $scope.Usuario.Token;
                    Services.Async(
                        $scope.serviceBaseSTRG + "OrdenesServiciosBodegaje/OrdenesServiciosBodegajeAprobarAvanzado/",
                        $itemScope.item,
                        function (response) {
                            alertify.success(response.rows[0].Descripcion);
                            $scope.Sincronizar(function () {
                                $scope.MostrarProgress(false);
                            });
                        },
                        function (response) {
                            $scope.Sincronizar(function () {
                                $scope.MostrarProgress(false);
                            });
                            alertify.error(response.data.Message);
                        }
                    );
                });
            },
            displayed: function ($itemScope) {
                return $itemScope.item.EstadoOrdenServicioID == 1;
            }
        },
        {
            text: '<i class="fal fa-envelope-open-text green"></i>&nbsp;&nbsp;Enviar por email',
            click: function ($itemScope) {
                $scope.AbrirModalMailOrdenServicio($itemScope.item);
            }
        }
    ];

    $scope.AbrirModalMailOrdenServicio = function (elem) {        
        $scope.MailModel.Asunto = "Orden de servicio N°." + elem.Consecutivo;
        $scope.MailModel.Destinatarios = $scope.PreContacto.Email;
        $scope.MailModel.Adjuntos = [{
            Ruta: $scope.serviceBaseSTRG + "PDFs/DocumentoB?TipoDocumentoID=3&UniqueID=" + elem.UniqueID + "&Attachment=true",
            Nombre: "OrdenServicio_N°_" + elem.Consecutivo + ".pdf",
            NombreArchivo: "OrdenServicio_N°_" + elem.Consecutivo + ".pdf",
            Tipo: 2,
            Token: $scope.Usuario.Token
        }];
        $scope.MailModel.Open();
    };

    $scope.AbrirModalMailPreFactura = function (elem) {
        $scope.MailModel.Asunto = "Código de barras N°." + elem.Consecutivo;
        $scope.MailModel.Adjuntos = [{
            Ruta: $scope.serviceBaseFAC + "PDFs/DocumentoB?TipoDocumentoID=4&UniqueID=" + elem.UniqueID + "&Attachment=true",
            Nombre: "CodigoBarra_N°_" + elem.Consecutivo + ".pdf",
            NombreArchivo: "CodigoBarra_N°_" + elem.Consecutivo + ".pdf",
            Tipo: 2,
            Token: $scope.Usuario.Token
        }];
        $scope.MailModel.Open();
    };

    $scope.AbrirModalMailFactura = function (elem) {
        $scope.MailModel.Asunto = "Factura N°." + elem.Consecutivo;
        $scope.MailModel.Adjuntos = [{
            Ruta: $scope.serviceBaseFAC + "PDFs/DocumentoB?TipoDocumentoID=1&UniqueID=" + elem.UniqueID + "&Attachment=true",
            Nombre: "Factura_N°_" + elem.Consecutivo + ".pdf",
            NombreArchivo: "Factura_N°_" + elem.Consecutivo + ".pdf",
            Tipo: 2,
            Token: $scope.Usuario.Token
        }];
        $scope.MailModel.Open();
    };

    $scope.AbrirModalVisor = function (item) {
        $scope.viewer.Open('API_CRM/api/PDFs/DocumentoC?TipoDocumentoID=1&DocumentoID=' + item.CotizacionID);
    };

    $scope.visualizarCotizacion = function (item) {
        $scope.viewer.Open(window.location.origin + '/Cotizaciones/VisorInteractivas?UniqueID=' + item.UniqueID + '&CV=false', false);
    };

    $scope.AbrirEnlace = function () {
        window.open(window.location.origin + '/CRM/FormularioVinculacion/RegistroSTRG?UniqueID=' + $scope.PreContacto.UniqueID);
    };

    $scope.CopiarEnlace = function () {
        var $temp_input = $("<input>");
        $("body").append($temp_input);
        $temp_input.val(window.location.origin + '/CRM/FormularioVinculacion/RegistroSTRG?UniqueID=' + $scope.PreContacto.UniqueID).select();
        document.execCommand("copy");
        $temp_input.remove();
        alertify.success("Enlace copiado");
    };

    $scope.CompartirWhatsApp = function () {
        if ($scope.PreContacto.Celular)
            window.open('https://api.whatsapp.com/send?phone=57' + $scope.PreContacto.Celular + '&text=A+continuación+encontraras+en+el+siguiente+link+de+nuestro+formulario+de+vinculación++Link+-->+\n+' + window.location.origin + '/CRM/FormularioVinculacion/RegistroSTRG?UniqueID=' + $scope.PreContacto.UniqueID);
    };

    $scope.VerFormatoVinculacion = function () {        
        $scope.viewer.Open($scope.PreContacto.FormatoVinculacion.RutaPDF == null ? "API_STRG/api/PDFs/DocumentoD?TipoDocumentoID=7&DocumentoID=" + $scope.PreContacto.FormatoVinculacion.FormatoVinculacionID : $scope.PreContacto.FormatoVinculacion.RutaPDF);
    };

    $scope.AbrirEnlaceFormatoSeguro = function () {
        window.open(window.location.origin + '/CRM/FormularioVinculacion/FormatoSeguroSTRG?UniqueID=' + $scope.PreContacto.UniqueID);
    };

    $scope.CopiarEnlaceFormatoSeguro = function () {
        var $temp_input = $("<input>");
        $("body").append($temp_input);
        $temp_input.val(window.location.origin + '/CRM/FormularioVinculacion/FormatoSeguroSTRG?UniqueID=' + $scope.PreContacto.UniqueID).select();
        document.execCommand("copy");
        $temp_input.remove();
        alertify.success("Enlace copiado");
    };

    $scope.CompartirWhatsAppFormatoSeguro = function () {
        if ($scope.PreContacto.Celular)
            window.open('https://api.whatsapp.com/send?phone=57' + $scope.PreContacto.Celular + '&text=A+continuación+encontraras+en+el+siguiente+link+de+nuestro+formato+de+toma+de+seguro+Link+-->+\n+' + window.location.origin + '/CRM/FormularioVinculacion/FormatoSeguroSTRG?UniqueID=' + $scope.PreContacto.UniqueID);
    };

    $scope.VerFormatoSeguro = function () {
        $scope.viewer.Open($scope.PreContacto.FormatoSeguro.Ruta == null ? "API_STRG/api/PDFs/DocumentoD?TipoDocumentoID=" + ($scope.PreContacto.FormatoSeguro.TipoFormatoSeguroID == 1 ? "8" : "9") + "&DocumentoID=" + $scope.PreContacto.FormatoSeguro.FormatoSeguroID : $scope.PreContacto.FormatoSeguro.Ruta);
    };
    
    $scope.AbrirHistoricoFirmas = function (_origen, _codigoOrigen) {
        $scope.MostrarProgress(true);
        $scope.Origen = {
            OrigenTransaccionSignioID: _origen,
            CodigoOrigen: _codigoOrigen
        };
        $scope.Transaccion = null;
        $scope.Sobre = null;
        $scope.TransaccionesSignioConsultar(function () {
            angular.element("#modalHistoricoFirmas").modal("show");
            $scope.MostrarProgress(false);
        });
    };

    $scope.TransaccionesSignioConsultar = function (OnSuccess) {
        Services.Async(
            $scope.serviceBaseSIS + "Signio/TransaccionesSignioConsultar",
            $scope.Origen,
            function (response) {
                $scope.TransaccionesSignio = response.rows;
                if (OnSuccess)
                    OnSuccess();
            }
        );
    };

    $scope.EliminarTransaccionSignio = function (item) {
        alertify.confirm("¿Esta seguro que desea eliminar la solicitud N°." + item.TransaccionID + "?", function () {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseSIS + "Signio/EliminarDocumentoSignio",
                { OrigenTransaccionSignioID: $scope.Origen.OrigenTransaccionSignioID, CodigoOrigen: $scope.Origen.CodigoOrigen, TransaccionID: item.TransaccionID, DevolverSobre: true },
                function (response) {
                    alertify.success(response);
                    $timeout(function () {
                        $scope.TransaccionesSignioConsultar(function () {
                            $scope.MostrarProgress(false);                            
                        });
                    }, 3000);
                }
            );
        });
    };

    $scope.VerTransaccionSignio = function (item) {
        $scope.Sobre = item;
        $scope.Sobre.MostrarProgress = true;
        Services.Async(
            $scope.serviceBaseSIS + "Signio/ObtenerDocumentoSignio",
            { OrigenTransaccionSignioID: $scope.Origen.OrigenTransaccionSignioID, CodigoOrigen: $scope.Origen.CodigoOrigen, TransaccionID: item.TransaccionID },
            function (response) {
                $scope.Transaccion = response.transaccion;
                angular.forEach($scope.Transaccion.contactos, function (elem) {
                    let _array = $filter("filter")($scope.Transaccion.firmas, function (item) { return item.id_firmante == elem.id_firmante && item.fecha_firma != null; }, true);
                    if (_array.length == 0) {
                        elem.FechaFirma = null;
                        elem.Firmado = false;
                        elem.Aprobador = false;
                    } else {
                        elem.FechaFirma = _array[0].fecha_firma;
                        elem.Firmado = true;
                        elem.Aprobador = _array[0].aprobador;
                    }
                });
                $scope.Sobre.MostrarProgress = false;
            }, function (response) {
                $scope.Transaccion = null;
                $scope.Sobre.MostrarProgress = false;
            }
        );
    };

    $scope.SetField = function (field, obj) {
        $scope[field] = obj;
    };
}]);