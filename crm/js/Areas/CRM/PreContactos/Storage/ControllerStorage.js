ERP.controller("ControllerStorage", ['$scope', '$timeout', '$q', 'Services', '$filter', 'alertify', function ($scope, $timeout, $q, Services, $filter, alertify) {
    $scope.MailModel = {};
    $scope.ModoView = 1;
    $scope.SIoNo = [{ ID: null, Nombre: " -- Seleccione -- " }, { ID: true, Nombre: "SI" }, { ID: false, Nombre: "NO" }];
    $scope.MetrosCubicos = 0;

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
            $scope.serviceBaseSTRG + "PlantillasDocumentos/PlantillasDocumentosConsultar/",
            { Rows: 0, Page: 0, TipoDocumentoID: 3, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ PlantillaDocumentoID: null, Nombre: " -- Seleccione -- " });
                $scope.OrdenServicioPlantillasDocumentos = response.rows;
            }
        );
        Services.Async(
            $scope.serviceBaseCRM + "PlantillasDocumentos/PlantillasDocumentosConsultar/",
            { Rows: 0, Page: 0, TiposDocumentosID: 1, SucursalID: $scope.Usuario.SucursalID, Activo: true },
            function (response) {
                response.rows.unshift({ PlantillaDocumentoID: null, Nombre: " -- Seleccione -- " });
                $scope.CotizacionesPlantillasDocumentos = response.rows;
            }
        );
        Services.Async(
            $scope.serviceBaseSIS + "FormasPagos/FormasPagosConsultar/",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ FormaPagoID: null, Nombre: " -- Seleccione -- " });
                $scope.FormasPagos = response.rows;
            }
        );
        Services.Async(
            $scope.serviceBaseCOM + "PlantillasEmail/PlantillasEmailConsultar/",
            { Rows: 0, Page: 0, TipoPlantillaEmailID: 1103, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ PlantillaEmailID: null, Nombre: " -- Seleccione -- " });
                $scope.PlantillasEmailCotizacion = response.rows;
            }
        );
    };

    $scope.ArrayFalse = function (array) {
        angular.forEach(array, function (elem) {
            elem.Eliminar = false;
        })
    };

    $scope.InitObjectCotizacion = function () {
        $scope.Articulo = {
            CotizacionBodegajeArticuloID: null,
            SegmentoCategoriaID: null,
            SegmentoArticuloID: null,
            Cantidad: 1,
            M3: 0,
            Eliminar: false
        };
        $scope.CopyArticulo = angular.copy($scope.Articulo);
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
        $scope.Cotizacion.Observaciones = null;
        $scope.Cotizacion.SegmentoID = null;
        $scope.Cotizacion.FormaPagoID = null;
        $scope.Cotizacion.PlantillaDocumentoID = null;
        $scope.Cotizacion.Aprobada = false;
        $scope.Cotizacion.Aprobado = false;
        $scope.Cotizacion.RequiereAprobacionDescuento = false;
        $scope.Cotizacion.Diario = false;
        $scope.Cotizacion.Duracion = null;
        $scope.Cotizacion.PagoAnticipado = false;
        $scope.Cotizacion.CampanaID = null;
        $scope.Cotizacion.PlantillaEmailID = null;        
        $scope.Cotizacion.CotizacionesBodegajeAlcances = [];
        $scope.Cotizacion.CotizacionesBodegajeDirecciones = [];
        $scope.Cotizacion.CotizacionesProductos = [];
        $scope.Cotizacion.CotizacionesBodegajeArticulos = [];
        $scope.Cotizacion.CotizacionesBodegajeArchivos = [];
        $scope.Cotizacion.CotizacionesBodegajeBodegas = [];
        $scope.Cotizacion.CotizacionesBodegajeArticulos = [];
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
                $scope.Cotizacion = angular.copy(response.data);
                $scope.Cotizacion.DirIP = $scope.Usuario.Ip;
                $scope.Cotizacion.Usuario = $scope.Usuario.UsuarioID;
                $scope.Cotizacion.Token = $scope.Usuario.Token;
                if ($scope.Cotizacion.ClienteTipoPersonaID != null)
                    $scope.ChangeTipoPersona($scope.Cotizacion);
                else
                    $scope.Cotizacion.ShowTipoPersona = true;
                $scope.InitObjectCotizacion();
                if ($scope.Cotizacion.PreContactoObservaciones != null)
                    $scope.Cotizacion.PreContactoObservaciones = $scope.HtmlToText($scope.Cotizacion.PreContactoObservaciones);
                $scope.ArrayFalse($scope.Cotizacion.CotizacionesBodegajeAlcances);
                $scope.ArrayFalse($scope.Cotizacion.CotizacionesBodegajeArticulos);
                $scope.ArrayFalse($scope.Cotizacion.CotizacionesBodegajeDirecciones);
                $scope.ArrayFalse($scope.Cotizacion.CotizacionesProductos);
                $scope.ArrayFalse($scope.Cotizacion.CotizacionesBodegajeBodegas);
                $scope.ArrayFalse($scope.Cotizacion.CotizacionesBodegajeArchivos);                
                $scope.CalcularTotalesCotizacion();
                $scope.CalcularMetrosCubicos($scope.Cotizacion);
                let _array = $filter('filter')($scope.Cotizacion.CotizacionesProductos, function (elem) { return elem.TipoProductoBodegaje == true }, true);
                if (_array.length > 0)
                    $scope.ServicioBodega = _array[0];
                $scope.ChangeSerieCotizacionBodegajeInput();
                angular.forEach($scope.Cotizacion.CotizacionesBodegajeBodegas, function (value, key) {
                    _array = $filter('filter')($scope.Cotizacion.CotizacionesProductos, function (elem) { return elem.ProductoID == value.ProductoID }, true);
                    if (_array.length > 0)
                        $scope.LlenarObjeto(angular.copy(_array), value);
                });
                $scope.CotizacionCopia = angular.copy($scope.Cotizacion);
                $scope.Titulo = "COTIZACIÓN N° " + $scope.Cotizacion.Consecutivo;                
                $scope.MostrarHeaderPrincipal(false);
                $scope.ModoView = 2;
                $scope.MostrarProgress(false);
            }
        );
    };

    $scope.searchCategorias = function (term) {
        var deferred = $q.defer();
        if ($scope.Cotizacion == undefined)
            deferred.resolve([]);
        else if ($scope.Cotizacion.SegmentoID == undefined || $scope.Cotizacion.SegmentoID == null)
            deferred.resolve([]);
        else
            Services.Async(
                $scope.serviceBaseSTRG + "SegmentosCategorias/SegmentosCategoriasPlanoConsultar/",
                { Rows: 30, Page: 1, Token: $scope.Usuario.Token, Descripcion: term, SegmentoID: $scope.Cotizacion.SegmentoID },
                function (response) {
                    deferred.resolve(response.rows);
                }
            );
        return deferred.promise;
    };

    $scope.searchArticulos = function (term) {
        var deferred = $q.defer();
        if ($scope.Cotizacion == undefined)
            deferred.resolve([]);
        else if ($scope.Cotizacion.SegmentoID == undefined || $scope.Cotizacion.SegmentoID == null)
            deferred.resolve([]);
        else if ($scope.Articulo == undefined)
            deferred.resolve([]);
        else if ($scope.Articulo.SegmentoCategoriaID == undefined)
            deferred.resolve([]);
        else
            Services.Async(
                $scope.serviceBaseSTRG + "SegmentosCategorias/SegmentosArticulosConsultar/",
                { Page: 1, Rows: 30, Token: $scope.Usuario.Token, SegmentoCategoriaID: $scope.Articulo.SegmentoCategoriaID },
                function (response) {
                    deferred.resolve(response.rows);
                }
            );
        return deferred.promise;
    };

    $scope.ddlSearchCategorias = {
        onSelect: function (elem) {
            $scope.Articulo.SegmentoCategoriaDescripcion = elem.Descripcion;
            $scope.Articulo.SegmentoArticuloID = null;
        }
    };

    $scope.ddlSearchArticulos = {
        onSelect: function (elem) {
            $scope.Articulo.SegmentoArticuloDescripcion = elem.Descripcion;
            $scope.Articulo.M3 = elem.M3;
        }
    };

    $scope.AgregarArticulo = function (_model) {
        if ($scope.Articulo.SegmentoCategoriaID == undefined || $scope.Articulo.SegmentoCategoriaID == null) {
            alertify.error("Debe ingresar una categoria.");
            return false;
        } else if ($scope.Articulo.SegmentoArticuloID == undefined || $scope.Articulo.SegmentoArticuloID == null) {
            alertify.error("Debe ingresar un articulo.");
            return false;
        } else if ($scope.Articulo.Cantidad == undefined || $scope.Articulo.Cantidad == null || $scope.Articulo.Cantidad == 0 || $scope.Articulo.Cantidad == "") {
            alertify.error("Debe ingresar una cantidad.");
            return false;
        } else if ($filter('filter')(_model.CotizacionesBodegajeArticulos, function (elem) { return elem.Eliminar == false && elem.SegmentoArticuloID == $scope.Articulo.SegmentoArticuloID }, true).length > 0) {
            alertify.error("Error el articulo ya se ingreso.");
            return false;
        } else {            
            _model.CotizacionesBodegajeArticulos.push(angular.copy($scope.Articulo));
            $scope.Articulo = angular.copy($scope.CopyArticulo);
            $scope.CalcularMetrosCubicos(_model);
        }
    };

    $scope.EliminarArticulo = function (elem, index, _model) {
        if (elem.CotizacionBodegajeArticuloID == null)
            _model.CotizacionesBodegajeArticulos.splice(index, 1);
        else
            elem.Eliminar = true;
        $scope.CalcularMetrosCubicos(_model);
    };   

    $scope.CalcularMetrosCubicos = function (_model) {
        $scope.MetrosCubicos = 0;
        angular.forEach(_model.CotizacionesBodegajeArticulos, function (elem) {
            if (elem.Eliminar == false) {
                if (elem.M3 == null)
                    elem.M3 = 0;
                $scope.MetrosCubicos += elem.M3 * elem.Cantidad;
            }
        });
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
            alertify.error("Error ingrese un valor");
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

    $scope.searchRutas = function (term, modelID) {
        var deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseSTRG + "Rutas/RutasConsultar/",
            { Rows: 30, Page: 1, RutaID: modelID, Token: $scope.Usuario.Token, Nombre: term },
            function (response) {
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
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
        if ($scope.Cotizacion.RutaID == undefined || $scope.Cotizacion.RutaID == null) {
            alertify.error("Debe seleccionar una ruta.");
            return false;
        }
        if ($scope.Cotizacion.MetrosCubicos == undefined || $scope.Cotizacion.MetrosCubicos == null || $scope.Cotizacion.MetrosCubicos == "") {
            alertify.error("Debe ingresar los metros cubicos.");
            return false;
        }
        if ($scope.Cotizacion.MetrosCuadrados == undefined || $scope.Cotizacion.MetrosCuadrados == null || $scope.Cotizacion.MetrosCuadrados == "") {
            alertify.error("Debe ingresar los metros cuadrados.");
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
        if ($filter('filter')($scope.Cotizacion.CotizacionesBodegajeDirecciones, function (elem) { return elem.Eliminar == false && elem.Origen == true; }, true).length == 0) {
            alertify.error("Debe ingresar al menos una dirección de origen.");
            return false;
        }
        if ($filter('filter')($scope.Cotizacion.CotizacionesBodegajeDirecciones, function (elem) { return elem.Eliminar == false && elem.Origen == false; }, true).length == 0) {
            alertify.error("Debe ingresar al menos una dirección de destino.");
            return false;
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
                        $scope.InitObjectCotizacion();
                        if ($scope.Cotizacion.PreContactoObservaciones != null)
                            $scope.Cotizacion.PreContactoObservaciones = $scope.HtmlToText($scope.Cotizacion.PreContactoObservaciones);
                        $scope.ArrayFalse($scope.Cotizacion.CotizacionesBodegajeAlcances);
                        $scope.ArrayFalse($scope.Cotizacion.CotizacionesBodegajeDirecciones);
                        $scope.ArrayFalse($scope.Cotizacion.CotizacionesProductos);
                        $scope.ArrayFalse($scope.Cotizacion.CotizacionesBodegajeArchivos);
                        $scope.Cotizacion.CotizacionesBodegajeBodegas = [];
                        $scope.ServicioBodega == undefined;
                        $scope.CalcularTotalesCotizacion();
                        let _array = $filter('filter')($scope.Cotizacion.CotizacionesProductos, function (elem) { return elem.TipoProductoBodegaje == true }, true);
                        if (_array.length > 0)
                            $scope.ServicioBodega = _array[0];
                        $scope.ChangeSerieCotizacionBodegajeInput();
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
                $scope.OrdenServicio = angular.copy(response.data);
                $scope.OrdenServicio.DirIP = $scope.Usuario.Ip;
                $scope.OrdenServicio.Usuario = $scope.Usuario.UsuarioID;
                $scope.OrdenServicio.Token = $scope.Usuario.Token;
                $scope.OrdenServicio.PreFacturaGenerada = false;
                $scope.OrdenServicio.FacturaGenerada = false;
                if ($scope.OrdenServicio.ClienteTipoPersonaID != null)
                    $scope.ChangeTipoPersona($scope.OrdenServicio);
                else
                    $scope.OrdenServicio.ShowTipoPersona = true;                
                if ($scope.OrdenServicio.PreContactoObservaciones != null)
                    $scope.OrdenServicio.PreContactoObservaciones = $scope.HtmlToText($scope.OrdenServicio.PreContactoObservaciones);
                $scope.OrdenServicio.CotizacionConsecutivo = $scope.OrdenServicio.Consecutivo;                
                $scope.OrdenServicio.PlantillaDocumentoID = null;
                $scope.OrdenServicio.OrdenServicioID = null;
                $scope.OrdenServicio.EstadoOrdenServicioID = 1;
                $scope.OrdenServicio.OrdenServicioBodegajeID = null;
                $scope.OrdenServicio.OrdenesServiciosBodegajeDirecciones = $scope.OrdenServicio.CotizacionesBodegajeDirecciones;
                $scope.ArrayFalse($scope.OrdenServicio.OrdenesServiciosBodegajeDirecciones);
                $scope.OrdenServicio.OrdenesServiciosBodegajeFechas = [];
                if ($scope.OrdenServicio.FechaEmpaque != null)
                    $scope.OrdenServicio.OrdenesServiciosBodegajeFechas.push({ Fecha: $scope.OrdenServicio.FechaEmpaque, Empaque: true, Eliminar: false, OrdenServicioBodegajeFechaID: null });
                if ($scope.OrdenServicio.FechaTransporte != null)
                    $scope.OrdenServicio.OrdenesServiciosBodegajeFechas.push({ Fecha: $scope.OrdenServicio.FechaTransporte, Empaque: false, Eliminar: false, OrdenServicioBodegajeFechaID: null });

                //let _PaisCliente = $filter('filter')($scope.Paises, function (elem) { return elem.PaisID == $scope.OrdenServicio.ClientePaisID }, true);
                //$scope.OrdenServicio.ClientePaisCodigoISO = (_PaisCliente.CodigoISO == null ? "" : _PaisCliente.CodigoISO).toLowerCase();
                

                $scope.OrdenServicio.OrdenesServiciosProductos = $scope.OrdenServicio.CotizacionesProductos;
                $scope.ArrayFalse($scope.OrdenServicio.OrdenesServiciosProductos);
                $scope.OrdenServicio.OrdenesServiciosBodegajeBodegas = $scope.OrdenServicio.CotizacionesBodegajeBodegas;
                $scope.ArrayFalse($scope.OrdenServicio.OrdenesServiciosBodegajeBodegas);
                $scope.OrdenServicio.OrdenesServiciosBodegajeArchivos = $scope.OrdenServicio.CotizacionesBodegajeArchivos;
                $scope.ArrayFalse($scope.OrdenServicio.OrdenesServiciosBodegajeArchivos);
                $scope.OrdenServicio.OrdenesServiciosBodegajeMateriales = [];
                $scope.ArrayFalse($scope.OrdenServicio.CotizacionesBodegajeArticulos);
                $scope.CalcularMetrosCubicos($scope.OrdenServicio);
                $scope.ServicioBodega == undefined;
                if ($scope.OrdenServicio.RequiereAprobacionDescuento == true) {
                    angular.forEach($scope.OrdenServicio.OrdenesServiciosProductos, function (elem) {
                        elem.ValorUnitario = elem.ValorUnitarioDescuento;
                    });
                }
                $scope.InitObjectOrdenServicio();
                $scope.OrdenServicio.PagoAnticipado = null;
                let _array = $filter('filter')($scope.OrdenServicio.OrdenesServiciosProductos, function (elem) { return elem.TipoProductoBodegaje == true }, true);
                if (_array.length > 0)
                    $scope.ServicioBodega = _array[0];
                $scope.ChangeSerieOrdenServicioBodegajeInput();
                $scope.CalcularTotalesOrdenServicio();
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
                $scope.OrdenServicio = angular.copy(response.data);
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
                $scope.ArrayFalse($scope.OrdenServicio.CotizacionesBodegajeArticulos);
                $scope.CalcularMetrosCubicos($scope.OrdenServicio);
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
        $scope.Articulo = {
            CotizacionBodegajeArticuloID: null,
            SegmentoCategoriaID: null,
            SegmentoArticuloID: null,
            Cantidad: 1,
            M3: 0,
            Eliminar: false
        };
        $scope.CopyArticulo = angular.copy($scope.Articulo);
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
            Asignada: false,
            Eliminar: false
        };
        $scope.CopyEmpaque = angular.copy($scope.Empaque);
        $scope.Transporte = {
            OrdenServicioBodegajeFechaID: null,
            Fecha: null,
            Empaque: false,
            Asignada: false,
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
                $scope.Paises = response.rows;
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

    $scope.searchCategoriasOrdenServicio = function (term) {
        var deferred = $q.defer();
        if ($scope.OrdenServicio == undefined)
            deferred.resolve([]);
        else if ($scope.OrdenServicio.SegmentoID == undefined || $scope.OrdenServicio.SegmentoID == null)
            deferred.resolve([]);
        else
            Services.Async(
                $scope.serviceBaseSTRG + "SegmentosCategorias/SegmentosCategoriasPlanoConsultar/",
                { Rows: 30, Page: 1, Token: $scope.Usuario.Token, Descripcion: term, SegmentoID: $scope.OrdenServicio.SegmentoID },
                function (response) {
                    deferred.resolve(response.rows);
                }
            );
        return deferred.promise;
    };

    $scope.searchArticulosOrdenServicio = function (term) {
        var deferred = $q.defer();
        if ($scope.OrdenServicio == undefined)
            deferred.resolve([]);
        else if ($scope.OrdenServicio.SegmentoID == undefined || $scope.OrdenServicio.SegmentoID == null)
            deferred.resolve([]);
        else if ($scope.Articulo == undefined)
            deferred.resolve([]);
        else if ($scope.Articulo.SegmentoCategoriaID == undefined)
            deferred.resolve([]);
        else
            Services.Async(
                $scope.serviceBaseSTRG + "SegmentosCategorias/SegmentosArticulosConsultar/",
                { Page: 1, Rows: 30, Token: $scope.Usuario.Token, SegmentoCategoriaID: $scope.Articulo.SegmentoCategoriaID },
                function (response) {
                    deferred.resolve(response.rows);
                }
            );
        return deferred.promise;
    };

    $scope.AgregarDireccionOrdenServicio = function (origen) {
        let _Direccion;
        if (origen)
            _Direccion = angular.copy($scope.Origen);
        else
            _Direccion = angular.copy($scope.Destino);
        if (_Direccion.Direccion == undefined || _Direccion.Direccion == null) {
            alertify.error("Error ingrese una dirección");
            return false;
        } else if (_Direccion.CiudadID == undefined || _Direccion.CiudadID == null) {
            alertify.error("Error ingrese una ciudad");
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
        } else if ($filter('filter')($scope.OrdenServicio.OrdenesServiciosBodegajeFechas, function (elem) { return elem.Eliminar == false && elem.Fecha == $scope.Empaque.Fecha }, true).length > 0) {
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
        } else if ($filter('filter')($scope.OrdenServicio.OrdenesServiciosBodegajeFechas, function (elem) { return elem.Eliminar == false && elem.Fecha == $scope.Empaque.Fecha }, true).length > 0) {
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
            if ($scope.Servicio.TipoProductoBodegaje == true && $scope.OrdenServicio.Diario == true)
                $scope.Servicio.ValorUnitario = $scope.Servicio.ValorUnitario * $scope.OrdenServicio.Duracion;
            $scope.Servicio.ValorTotal = $scope.Servicio.ValorUnitario * $scope.Servicio.Cantidad;
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
        } else if (IsDias == undefined){
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
                elem.ValorTotal = elem.Cantidad * (elem.PrecioDiario == 0 || elem.PrecioDiario == null ? elem.ValorUnitario : elem.PrecioDiario) * $scope.OrdenServicio.Duracion;
            } else {
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
            if ($scope.OrdenServicio.EstadoOrdenServicioID == 3 && $scope.Usuario.PermiteEditarOrdenServicio == false) {
                $scope.Archivo.CotizacionID = $scope.OrdenServicio.CotizacionID
                $scope.Archivo.OrdenServicioID = $scope.OrdenServicio.OrdenServicioID
                $scope.Archivo.PreContactoID = $scope.OrdenServicio.PreContactoID
                Services.Async(
                    $scope.serviceBaseSTRG + "OrdenesServiciosBodegaje/OrdenesServiciosBodegajeArchivosInsertar",
                    $scope.Archivo,
                    function (resp) {
                        let _arrayFiles = [];
                        _arrayFiles.push($scope.Archivo.Ruta.replaceAll("cdn://", ""));
                        $scope.CommitCDN(_arrayFiles);
                        $scope.Archivo.ArchivoID = resp.rows[0].Codigo;
                        $scope.OrdenServicio.OrdenesServiciosBodegajeArchivos.push(angular.copy($scope.Archivo));
                        $scope.Archivo = angular.copy($scope.CopyArchivo);
                    }
                );
            } else {
                $scope.OrdenServicio.OrdenesServiciosBodegajeArchivos.push(angular.copy($scope.Archivo));
                $scope.Archivo = angular.copy($scope.CopyArchivo);
            }
            $scope.ChangeSerieOrdenServicioBodegajeInput();
        }
    };

    $scope.EliminarArchivoOS = function (item, index) {
        alertify.confirm("¿Desea eliminar el archivo?", function () {
            if ($scope.OrdenServicio.EstadoOrdenServicioID != 3 && $scope.Usuario.PermiteEditarOrdenServicio == false) {
                if (item.ArchivoID == null) {
                    $scope.EliminarArchivoCDN([{ CodigoUnico: item.Ruta.replaceAll("cdn://", "") }], function (response) {
                        $scope.OrdenServicio.OrdenesServiciosBodegajeArchivos.splice(index, 1);
                    });
                } else
                    item.Eliminar = true;
            } else {
                $scope.EliminarArchivoCDN([{ CodigoUnico: item.Ruta.replaceAll("cdn://", "") }], function (response) {
                    Services.Async(
                        $scope.serviceBaseSTRG + "OrdenesServiciosBodegaje/OrdenesServiciosBodegajeArchivosEliminar/",
                        item,
                        function (response) {
                            $scope.OrdenServicio.OrdenesServiciosBodegajeArchivos.splice(index, 1);
                            $scope.MostrarProgress(false);
                        }
                    );
                });
            }
        });
    };

    $scope.ChangeSerieOrdenServicioBodegajeInput = function () {
        if ($scope.Archivo.SerieID == null)
            $scope.ConfigInputOrdenServicio.SetFieldBaseArchivo("IsDisabled", true);
        else
            $scope.ConfigInputOrdenServicio.SetFieldBaseArchivo("IsDisabled", false);
    };

    $scope.searchMateriales = function (term) {
        var deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseSIS + "Productos/ProductosConsultar/",
            { Rows: 30, Page: 1, AgrupacionProductosID: 2, Token: $scope.Usuario.Token, FullSearch: term },
            function (response) {
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
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
            alertify.error("El apellido del es obligatorio.");
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
        if ($scope.OrdenServicio.RutaID == undefined || $scope.OrdenServicio.RutaID == null) {
            alertify.error("Debe seleccionar una ruta.");
            return false;
        }
        if ($scope.OrdenServicio.MetrosCubicos == undefined || $scope.OrdenServicio.MetrosCubicos == null || $scope.OrdenServicio.MetrosCubicos == "") {
            alertify.error("Debe ingresar los metros cubicos.");
            return false;
        }
        if ($scope.OrdenServicio.MetrosCuadrados == undefined || $scope.OrdenServicio.MetrosCuadrados == null || $scope.OrdenServicio.MetrosCuadrados == "") {
            alertify.error("Debe ingresar los metros cuadrados.");
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
                let _fechaT = $scope.ValidarFecha(_FechasTransporte[i].Fecha);
                for (let j = 0; j < _FechasEmpaque.length; j++) {
                    let _fechaE = $scope.ValidarFecha(_FechasEmpaque[j].Fecha);
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
        return true;
    };

    $scope.ValidarFecha = function (Fecha) {
        if (moment(Fecha, 'DD/MM/YYYY HH:mm', true).isValid()) {
            return moment(Fecha, 'DD/MM/YYYY HH:mm').format("DD-MM-YYYY");
        } else
            return moment(Fecha).format("DD-MM-YYYY");
    }

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
            text: '<i class="fal fa-check-circle orange"></i>&nbsp;&nbsp;Aprobar',
            click: function ($itemScope) {
                alertify.confirm("¿Desea aprobar la orden de servicio N°" + $itemScope.item.Consecutivo + "?", function () {
                    $scope.MostrarProgress(true);
                    $itemScope.item.DirIp = $scope.Usuario.Ip;
                    $itemScope.item.Usuario = $scope.Usuario.UsuarioID;
                    $itemScope.item.SucursalID = $scope.Usuario.SucursalID;
                    $itemScope.item.Token = $scope.Usuario.Token;
                    Services.Async(
                        $scope.serviceBaseSTRG + "OrdenesServiciosBodegaje/OrdenesServiciosBodegajeAprobarStandar/",
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
            text: '<i class="fal fa-clone green"></i>&nbsp;&nbsp;Duplicar orden de servicio',
            click: function ($itemScope) {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseSTRG + "OrdenesServiciosBodegaje/OrdenServicioBodegajeDetalladoConsultar/",
                    { OrdenServicioBodegajeID: $itemScope.item.OrdenServicioBodegajeID, Token: $scope.Usuario.Token },
                    function (response) {
                        $scope.OrdenServicio = angular.extend({}, angular.copy($itemScope.item), response.data);
                        $scope.OrdenServicio.TerceroID = null;
                        $scope.OrdenServicio.ClienteID = null;
                        $scope.OrdenServicio.ClienteTipoPersonaID = $scope.PreContacto.ClienteTipoPersonaID;
                        $scope.OrdenServicio.ClienteTipoDocumentoID = $scope.PreContacto.ClienteTipoDocumentoID;
                        $scope.OrdenServicio.ClienteDocumento = $scope.PreContacto.ClienteDocumento;
                        $scope.OrdenServicio.ClienteResponsabilidadTributariaID = $scope.PreContacto.ClienteResponsabilidadTributariaID;
                        $scope.OrdenServicio.ClienteNombres = $scope.PreContacto.ClienteNombres;
                        $scope.OrdenServicio.ClienteNombres2 = $scope.PreContacto.ClienteNombres2;
                        $scope.OrdenServicio.ClienteApellidos = $scope.PreContacto.ClienteApellidos;
                        $scope.OrdenServicio.ClienteApellidos2 = $scope.PreContacto.ClienteApellidos2;
                        $scope.OrdenServicio.ClienteNombreCompleto = $scope.PreContacto.ClienteNombreCompleto;
                        $scope.OrdenServicio.ClienteTelefono = $scope.PreContacto.ClienteTelefono;
                        $scope.OrdenServicio.ClienteCelular = $scope.PreContacto.ClienteCelular;
                        $scope.OrdenServicio.ClienteEmail = $scope.PreContacto.ClienteEmail;
                        $scope.OrdenServicio.ClienteEmailFacturacionElectronica = $scope.PreContacto.ClienteEmailFacturacionElectronica;
                        $scope.OrdenServicio.ClienteDireccion = $scope.PreContacto.ClienteDireccion;
                        $scope.OrdenServicio.ClientePaisID = $scope.PreContacto.ClientePaisID;
                        $scope.OrdenServicio.ClienteCiudadID = $scope.PreContacto.ClienteCiudadID;
                        $scope.OrdenServicio.ClientePaisCodigoISO = $scope.PreContacto.ClientePaisCodigoISO;
                        $scope.OrdenServicio.ClientePaisNombre = $scope.PreContacto.ClientePaisNombre;
                        $scope.OrdenServicio.ClienteCiudadNombre = $scope.PreContacto.ClienteCiudadNombre;
                        $scope.OrdenServicio.OrdenServicioBodegajeID = null;
                        $scope.OrdenServicio.OrdenServicioID = null;
                        $scope.OrdenServicio.PreFacturaGenerada = false;
                        $scope.OrdenServicio.FacturaGenerada = false;
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
                        $scope.Titulo = "NUEVA ORDEN DE SERVICIO";                
                        $scope.MostrarHeaderPrincipal(false);
                        $scope.ModoView = 3;
                        $scope.MostrarProgress(false);
                    }
                );
            }
        },
        {
            text: '<i class="fal fa-file-code red"></i>&nbsp;&nbsp;Generar proforma de la orden de servicio',
            click: function ($itemScope) {
                alertify.confirm("¿Desea generar la proforma de la orden de servicio N°" + $itemScope.item.Consecutivo + "?", function () {
                    $scope.MostrarProgress(true);
                    $itemScope.item.DirIp = $scope.Usuario.Ip;
                    $itemScope.item.Usuario = $scope.Usuario.UsuarioID;                    
                    $itemScope.item.Token = $scope.Usuario.Token;
                    Services.Async(
                        $scope.serviceBaseFAC + "FacturasBodegaje/GenerarPreFacturaOrdenServicioStandar/",
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
                return $itemScope.item.EstadoOrdenServicioID == 3;
            }
        },
        {
            text: '<i class="fal fa-file-code orange"></i>&nbsp;&nbsp;Nueva proforma',
            click: function ($itemScope) {
                alertify.confirm("¿Desea crear una nueva proforma?", function () {
                    window.open(window.location.origin + "/FAC/Prefacturas/CRUD?IsNueva=true&TerceroID=" + $itemScope.item.TerceroID + "&CodigoOrigen=" + $itemScope.item.OrdenServicioBodegajeID + "&OrigenFacturaID=3");
                });
            },
            displayed: function ($itemScope) {
                return $itemScope.item.EstadoOrdenServicioID == 2 || $itemScope.item.EstadoOrdenServicioID == 3;
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

    $scope.AbrirEditarProforma = function (item) {
        window.open(window.location.origin + "/FAC/Prefacturas/CRUD?IsOpener=true&PreFacturaID=" + item.PreFacturaID);
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

    $scope.OnCloseVentanaPreFactura = function (IsEdicion) {
        $scope.MostrarProgress(true);
        $scope.Sincronizar(function () {
            $scope.PreContacto.ShowCotizaciones = false;
            $scope.PreContacto.ShowOrdenesServicios = false;
            $scope.PreContacto.ShowCodigoBarras = true;
            $scope.MostrarProgress(false);
        });
    };

    $scope.visualizarCotizacion = function (item) {
        $scope.viewer.Open(window.location.origin + '/Cotizaciones/VisorInteractivas?UniqueID=' + item.UniqueID + '&CV=false', false);
    };

    $scope.SetField = function (field, obj) {
        $scope[field] = obj;
    };
        
    window.Scope = $scope;
}]);