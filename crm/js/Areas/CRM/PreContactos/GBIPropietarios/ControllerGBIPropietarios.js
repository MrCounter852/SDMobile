ERP.controller("ControllerGBIPropietarios", ['$scope', '$timeout', '$q', 'Services', '$filter', 'alertify', function ($scope, $timeout, $q, Services, $filter, alertify) {
    $scope.MailModel = {};
    $scope.ModoView = 1;

    $scope.MailOptions = {        
        Title: "Enviar documento por correo electronico",
        RefScope: $scope,
        CargarFirma: true,
        TipoFirmaID: 7,
    };

    $scope.viewer = {
        CDNEndPoint: $scope.Usuario.CDNEndPoint,
        CDNLlavePublica: $scope.Usuario.CDNLlavePublica,
        Token: $scope.Usuario.Token
    };

    $scope.AtrasModoView = function () {
        $scope.ModoView = 1;
        $scope.MostrarHeaderPrincipal(true);
    };

    $scope.Init = function () {
        $scope.CargarConfiguraciones();
        $scope.ConsultarCombos();
    };

    $scope.ConsultarCombos = function () {
        Services.Async(
            $scope.serviceBaseSIS + "Estratos/EstratosConsultar",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ EstratoID: null, Nombre: "-- Seleccione --" });
                $scope.Estratos = response.rows;
            }
        );
        Services.Async(
            $scope.serviceBaseGBI + "UsosInmuebles/UsosInmueblesConsultar",
            { Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ UsoInmuebleID: null, Nombre: "-- Seleccione --" });
                $scope.UsosInmuebles = response.rows;
            }
        );
        Services.Async(
            $scope.serviceBaseGBI + "CondicionesInmuebles/CondicionesInmueblesConsultar/",
            { Token: $scope.Usuario.Token },
            function (response) {
                $scope.CondicionesInmuebles = response.rows;
                $scope.CondicionesInmuebles.unshift({ CondicionInmuebleID: null, Nombre: " -- Seleccione -- " });
            }
        );
        Services.Async(
            $scope.serviceBaseGBI + "TarifasComisiones/TarifasComisionesConsultar/",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ TarifaComisionID: null, Nombre: "-- Seleccione --" });
                $scope.TarifasComisiones = $filter("filter")(response.rows, function (elem) { return elem.TipoTarifaComisionID == 1 || elem.TipoTarifaComisionID == null || elem.TipoTarifaComisionID == undefined }, true);
                $scope.TarifasComisionesVenta = $filter("filter")(response.rows, function (elem) { return elem.TipoTarifaComisionID == 4 || elem.TipoTarifaComisionID == null || elem.TipoTarifaComisionID == undefined }, true);
            }
        );
        Services.Async(
            $scope.serviceBaseSIS + "Impuestos/ComboImpuestosConsultar/",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                $scope.Impuestos = response.rows;
            }
        );
        Services.Async(
            $scope.serviceBaseCRM + "PlantillasDocumentos/PlantillasDocumentosConsultar/",
            { Rows: 0, Page: 0, TipoDocumentoID: 1, SucursalID: $scope.Usuario.SucursalID },
            function (response) {
                response.rows.unshift({ PlantillaDocumentoID: null, Nombre: " -- Seleccione -- " });
                $scope.PlantillasDocumentosCotizaciones = response.rows;
            }
        );
        Services.Async(
            $scope.serviceBaseGBI + "TiposOfertas/TiposOfertasConsultar",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ TipoOfertaID: null, Nombre: "Todos" });
                $scope.TiposOfertas = response.rows;
            }
        );
        Services.Async(
            $scope.serviceBaseGBI + "ConfiguracionesDocumentosInmuebles/ConfiguracionesDocumentosInmueblesConsultar/",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                $scope.ConfiguracionesDocumentosInmuebles = response.rows;
            }
        );
        Services.Async(
            $scope.serviceBaseGBI + "ResponsablesPagoAdministracion/ResponsablesPagoAdministracionConsultar/",
            { Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ ResponsablePagoAdministracionID: null, Nombre: "Seleccione" });
                $scope.ResponsablesPagoAdministracion = response.rows;
            }
        );
        Services.Async(
            $scope.serviceBaseGBI + "ConfiguracionesInventarios/ConfiguracionesInventariosConsultar/",
            { Page: 0, Rows: 0, Activo: true, Token: $scope.Usuario.Token },
            function (response) {
                $scope.ConfiguracionesInventarios = response.rows;
                $scope.ConfiguracionesInventarios.unshift({ ConfiguracionInventarioID: null, TipoInmuebleNombre: " -- Seleccione -- " });
            }
        );
    };

    $scope.AbrirNuevaCotizacion = function () {
        $scope.Cotizacion = angular.extend({}, angular.copy($scope.PreContacto));
        $scope.Cotizacion.DirIP = $scope.Usuario.Ip;
        $scope.Cotizacion.Usuario = $scope.Usuario.UsuarioID;
        $scope.Cotizacion.CotizacionID = null;
        $scope.Cotizacion.Aprobado = false;        
        $scope.Cotizacion.SucursalID = $scope.Usuario.SucursalID;
        $scope.Cotizacion.ValorNeto = 0;
        $scope.Cotizacion.ValorTotal = 0;
        $scope.Cotizacion.FechaElaboracion = moment().format("YYYY-MM-DD") + "T00:00:00";
        $scope.Cotizacion.CotizacionesProductos = [];
        $scope.Cotizacion.PreContactoObservaciones = $scope.Cotizacion.Observaciones;
        $scope.Cotizacion.Observaciones = null;
        $scope.Cotizacion.PlantillaDocumentoID = null;
        $scope.Cotizacion.Token = $scope.Usuario.Token;
        $scope.Producto = {
            CotizacionProductoID: null,
            ProductoID: null,
            Cantidad: 1,
            ValorUnitarioDescuento: 0,
            ModoTexto: false,
            Impuestos: [],
            Eliminar: false
        };
        $scope.CopyProducto = angular.copy($scope.Producto);
        $scope.Titulo = "NUEVA PROPUESTA COMERCIAL";        
        $scope.MostrarHeaderPrincipal(false);
        $scope.ModoView = 2;
    };

    $scope.CambiarModoProducto = function () {
        if ($scope.Producto.ModoTexto == true)
            $scope.Producto.ModoTexto = false;
        else
            $scope.Producto.ModoTexto = true;
    };

    $scope.searchProductos = function (term) {
        let deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseSIS + "Productos/ProductosConsultar",
            { Page: 1, Rows: 20, Token: $scope.Usuario.Token, FullSearch: term },
            function (response) {
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.ddlProductoOptions = {
        displayText: 'Buscar producto',
        onSelect: function (item) {
            $scope.Producto = angular.extend({}, $scope.Producto, item);
            $scope.Producto.Descripcion = item.Nombre;
            $scope.Producto.ValorUnitario = $scope.Producto.ValorDiario != null ? $scope.Producto.ValorDiario : (item.PrecioBase == undefined || item.PrecioBase == null ? item.ValorUnitario : item.PrecioBase);
            $scope.Producto.Cantidad = $scope.Producto.Cantidad == null ? 1 : $scope.Producto.Cantidad;
            $scope.Producto.ValorUnitarioDescuento = $scope.Producto.ValorUnitarioDescuento == null ? 0 : $scope.Producto.ValorUnitarioDescuento;
            $scope.CalcularProductoCotizacion();
        }
    };

    $scope.AgregarProducto = function () {
        if ($scope.Producto.Cantidad == undefined || $scope.Producto.Cantidad == "" || $scope.Producto.Cantidad == null || $scope.Producto.Cantidad <= 0) {
            alertify.error("Ingrese una cantidad valida.");
            return false;
        } else if ($scope.Producto.Descripcion == null || $scope.Producto.Descripcion == "") {
            alertify.error("Seleccione un producto.");
            return false;
        } else if ($scope.Producto.ValorUnitario == undefined || $scope.Producto.ValorUnitario == "" || $scope.Producto.ValorUnitario == null || $scope.Producto.ValorUnitario <= 0) {
            alertify.error("Ingrese el precio unitario.");
            return false;
        } else {
            $scope.Cotizacion.CotizacionesProductos.push(angular.copy($scope.Producto));
            $scope.Producto = angular.copy($scope.CopyProducto);
            new async(
                $scope.serviceBaseSIS + "Impuestos/CalcularImpuestosProductosCotizaciones",
                {
                    CotizacionesProductos: $scope.Cotizacion.CotizacionesProductos,
                    PreContactoID: $scope.Cotizacion.PreContactoID,
                    Token: $scope.Usuario.Token
                },
                function (response) {
                    $scope.Cotizacion.CotizacionesProductos = response;
                    $scope.CalcularImpuestosCotizacion();
                }, undefined, false
            );
        }
    };

    $scope.CalcularProductoCotizacion = function (_item) {
        if (_item != undefined) {
            if ($scope.TimeOutImpuesto)
                $timeout.cancel($scope.TimeOutImpuesto);
            $scope.TimeOutImpuesto = $timeout(function () {
                let cantidad = _item.Cantidad == null ? 0 : _item.Cantidad;
                let valorUnitario = _item.ValorUnitario == null ? 0 : _item.ValorUnitario;
                let ValorUnitarioDescuento = _item.ValorUnitarioDescuento == null ? 0 : _item.ValorUnitarioDescuento;
                _item.ValorTotal = (cantidad * valorUnitario) - ValorUnitarioDescuento;
                new async(
                    $scope.serviceBaseSIS + "Impuestos/CalcularImpuestosProductosCotizaciones",
                    {
                        CotizacionesProductos: $scope.Cotizacion.CotizacionesProductos,
                        PreContactoID: $scope.Cotizacion.PreContactoID,
                        Token: $scope.Usuario.Token
                    },
                    function (response) {
                        $scope.Cotizacion.CotizacionesProductos = response;
                        $scope.CalcularImpuestosCotizacion();
                    }, undefined, false
                );
            }, 1000);
        } else if ($scope.Producto != undefined) {
            let cantidad = $scope.Producto.Cantidad == null ? 0 : $scope.Producto.Cantidad;
            let valorUnitario = $scope.Producto.ValorUnitario == null ? 0 : $scope.Producto.ValorUnitario;
            let ValorUnitarioDescuento = $scope.Producto.ValorUnitarioDescuento == null ? 0 : $scope.Producto.ValorUnitarioDescuento;
            $scope.Producto.ValorTotal = (cantidad * valorUnitario) - ValorUnitarioDescuento;
        }
    };

    $scope.CalcularImpuestosCotizacion = function () {
        $scope.Cotizacion.ValorNeto = 0;
        $scope.Cotizacion.ValorTotal = 0;
        $scope.Cotizacion.Impuestos = [];
        $scope.Cotizacion.ValorImpuestos = 0;
        angular.forEach($scope.Cotizacion.CotizacionesProductos, function (producto) {
            if (producto.Eliminar == false) {
                $scope.Cotizacion.ValorNeto += producto.ValorTotal;
                angular.forEach(producto.Impuestos, function (impuesto) {
                    if (impuesto.Eliminar == false) {
                        $scope.Cotizacion.ValorImpuestos += impuesto.ValorImpuesto;
                        if ($filter('filter')($scope.Cotizacion.Impuestos, function (value) { return value.ImpuestoID == impuesto.ImpuestoID }, true).length > 0) {
                            angular.forEach($scope.Cotizacion.Impuestos, function (value, key) {
                                if (value.ImpuestoID == impuesto.ImpuestoID)
                                    value.ValorImpuesto += impuesto.ValorImpuesto;
                            });
                        } else
                            $scope.Cotizacion.Impuestos.push(angular.copy(impuesto));
                    }
                });
            }
        });
        $scope.Cotizacion.ValorTotal = $scope.Cotizacion.ValorNeto + $scope.Cotizacion.ValorImpuestos
    };

    $scope.EliminarProducto = function (index, producto) {
        alertify.confirm("¿Desea eliminar el producto " + producto.Descripcion + "?", function () {
            if ($scope.Cotizacion.CotizacionID == null)
                $scope.Cotizacion.CotizacionesProductos.splice(index, 1);
            else {
                producto.Eliminar = true;
                for (let i = 0; i < producto.Impuestos.length; i++)
                    producto.Impuestos[i].Eliminar = true;
            }
            if ($scope.Cotizacion.CotizacionesProductos.length > 0) {
                new async(
                    $scope.serviceBaseSIS + "Impuestos/CalcularImpuestosProductosCotizaciones",
                    {
                        CotizacionesProductos: $scope.Cotizacion.CotizacionesProductos,
                        PreContactoID: $scope.Cotizacion.PreContactoID,
                        Token: $scope.Usuario.Token
                    },
                    function (response) {
                        $scope.Cotizacion.CotizacionesProductos = response;
                        $scope.CalcularImpuestosCotizacion();
                    }, undefined, false
                );
            } else {
                $scope.CalcularImpuestosCotizacion();
            }
        });
    };

    $scope.AbrirModalImpuestos = function (idx, producto) {
        $scope.ProductoEdicion = producto;
        $scope.ImpuestosSinEditar = angular.copy(producto.Impuestos);
        $scope.Impuesto = {
            CotizacionProductoImpuestoID: null,
            CotizacionProductoID: null,
            ImpuestoID: $scope.Impuestos[0].ImpuestoID,
            ValorImpuesto: 0,
            Eliminar: false
        };
        $scope.CopyImpuesto = angular.copy($scope.Impuesto);
        $scope.ChangeImpuestos();
        $("#modalImpuestos").modal("show");
    };

    $scope.ChangeImpuestos = function () {
        $scope.Impuesto = angular.extend({}, $scope.Impuesto, $filter('filter')($scope.Impuestos, function (value) { return value.ImpuestoID == $scope.Impuesto.ImpuestoID; }, true)[0]);
        $scope.Impuesto.ValorImpuesto = $scope.ProductoEdicion.ValorTotal * ($scope.Impuesto.Porcentaje / 100);
    };

    $scope.DescartarCambiosImpuestos = function () {
        $scope.ProductoEdicion.Impuestos = $scope.ImpuestosSinEditar;
        $scope.CalcularImpuestosCotizacion();
        $("#modalImpuestos").modal("hide");
    };

    $scope.AplicarCambiosImpuestos = function () {
        $scope.CalcularImpuestosCotizacion();
        $("#modalImpuestos").modal("hide");
    };

    $scope.AgregarImpuesto = function () {
        if ($scope.Impuesto.ValorImpuesto == undefined || $scope.Impuesto.ValorImpuesto == "" || $scope.Impuesto.ValorImpuesto == null) {
            alertify.error("Ingrese un valor valido.");
            return false;
        } else if ($filter('filter')($scope.ProductoEdicion.Impuestos, function (value) { return value.Eliminar == false && value.ImpuestoID == $scope.Impuesto.ImpuestoID; }, true).length > 0) {
            alertify.error("No puede agregar dos veces el mismo impuesto.");
            return false;
        } else {
            $scope.Impuesto.ImpuestoNombre = $scope.Impuesto.Nombre;
            $scope.ProductoEdicion.Impuestos.push(angular.copy($scope.Impuesto));
            $scope.Impuesto = angular.copy($scope.CopyImpuesto);
        }
    };

    $scope.EliminarImpuesto = function (index, impuesto) {
        alertify.confirm("¿Desea eliminar el impuesto " + impuesto.ImpuestoNombre + "?", function () {
            if ($scope.Cotizacion.CotizacionID == null)
                $scope.ProductoEdicion.Impuestos.splice(index, 1);
            else
                impuesto.Eliminar = true;
        });
    };

    $scope.AbrirEditarCotizacion = function (item) {
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseSIS + "Cotizaciones/CotizacionDetalladoConsultar/",
            { CotizacionID: item.CotizacionID, Token: $scope.Usuario.Token },
            function (response) {
                $scope.Cotizacion = angular.extend({}, response.data);
                $scope.Cotizacion.DirIP = $scope.Usuario.Ip;                
                $scope.Cotizacion.Usuario = $scope.Usuario.UsuarioID;                
                $scope.Cotizacion.Token = $scope.Usuario.Token;
                $scope.Producto = {
                    CotizacionProductoID: null,
                    ProductoID: null,
                    ValorUnitarioDescuento: 0,
                    ModoTexto: false,
                    Impuestos: [],
                    Eliminar: false
                };
                $scope.CopyProducto = angular.copy($scope.Producto);
                angular.forEach($scope.Cotizacion.CotizacionesProductos, function (elem) {
                    elem.Eliminar = false;
                    angular.forEach(elem.Impuestos, function (value) {
                        value.Eliminar = false;
                    });
                });
                $scope.CalcularImpuestosCotizacion();
                $scope.Titulo = "PROPUESTA COMERCIAL N° " + $scope.Cotizacion.Consecutivo;                
                $scope.MostrarHeaderPrincipal(false);
                $scope.ModoView = 2;
                $scope.MostrarProgress(false);
            }
        );
    };

    $scope.AbrirModalMailCotizacion = function (elem) {
        $scope.MailModel.Asunto = "Cotización N°." + elem.Consecutivo + " " + elem.NombreCompleto;
        $scope.MailModel.Destinatarios = $scope.PreContacto.Email;
        $scope.MailModel.Adjuntos = [{
            Ruta: $scope.serviceBaseCRM + "PDFs/DocumentoB?TipoDocumentoID=1&UniqueID=" + elem.UniqueID + "&Attachment=true",
            Nombre: "Cotizacion_N°_" + elem.Consecutivo + ".pdf",
            NombreArchivo: "Cotizacion_N°_" + elem.Consecutivo + ".pdf",
            Tipo: 2,
            Token: $scope.Usuario.Token
        }];
        $scope.MailModel.Open();
    };

    $scope.GuardarCotizacion = function () {
        if ($scope.ValidarCotizacion()) {
            alertify.confirm("¿Desea crear la propuesta comercial?", function () {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseSIS + "Cotizaciones/CotizacionesInsertar/",
                    $scope.Cotizacion,
                    function (response) {
                        alertify.success(response.rows[0].Descripcion);
                        $scope.Sincronizar(function () {
                            $scope.AtrasModoView();
                            $scope.PreContacto.ShowCotizaciones = true;
                            $scope.MostrarProgress(false);
                        });
                    }
                );
            });
        }
    };

    $scope.ActualizarCotizacion = function () {
        if ($scope.ValidarCotizacion()) {
            alertify.confirm("¿Desea guardar los cambios de la propuesta comercial?", function () {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseSIS + "Cotizaciones/CotizacionesActualizar/",
                    $scope.Cotizacion,
                    function (response) {
                        alertify.success(response.rows[0].Descripcion);
                        $scope.Sincronizar(function () {
                            $scope.AtrasModoView();
                            $scope.PreContacto.ShowCotizaciones = true;
                            $scope.MostrarProgress(false);
                        });
                    }
                );
            });
        }
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
        if ($scope.Cotizacion.FechaElaboracion == undefined || $scope.Cotizacion.FechaElaboracion == null || $scope.Cotizacion.FechaElaboracion == "") {
            alertify.error("La fecha es obligatoria.");
            return false;
        }      
        if ($filter("filter")($scope.Cotizacion.CotizacionesProductos, function (elem) { return elem.Eliminar == false }, true).length == 0) {
            alertify.error("La cotizacion de tener por lo menos un detalle");
            return false;
        }
        return true;
    };

    $scope.visualizarCotizacion = function (item) {
        $scope.viewer.Open(window.location.origin + '/Cotizaciones/VisorInteractivas?UniqueID=' + item.UniqueID + '&CV=false', false);
    };

    $scope.MenuCotizaciones = [
        {
            text: '<i class="fal fa-file-invoice-dollar blue"></i>&nbsp;&nbsp;Documento PDF',
            click: function ($itemScope) {
                $scope.viewer.Open("API_CRM/api/PDFs/DocumentoD?TipoDocumentoID=1&DocumentoID=" + $itemScope.item.CotizacionID);
            }
        },
        {
            text: '<i class="fal fa-copy green"></i>&nbsp;&nbsp;Duplicar cotización',
            click: function ($itemScope) {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseSIS + "Cotizaciones/CotizacionDetalladoConsultar/",
                    { CotizacionID: $itemScope.item.CotizacionID, Token: $scope.Usuario.Token },
                    function (response) {
                        $scope.Cotizacion = angular.extend({}, $itemScope.item, response.data);
                        $scope.Cotizacion.CotizacionID = null;
                        $scope.Cotizacion.DirIP = $scope.Usuario.Ip;
                        $scope.Cotizacion.Usuario = $scope.Usuario.UsuarioID;
                        $scope.Cotizacion.Token = $scope.Usuario.Token;
                        $scope.Producto = {
                            CotizacionProductoID: null,
                            ProductoID: null,
                            ValorUnitarioDescuento: 0,
                            ModoTexto: false,
                            Impuestos: [],
                            Eliminar: false
                        };
                        $scope.CopyProducto = angular.copy($scope.Producto);
                        angular.forEach($scope.Cotizacion.CotizacionesProductos, function (elem) {
                            elem.Eliminar = false;
                            angular.forEach(elem.Impuestos, function (value) {
                                value.Eliminar = false;
                            });
                        });
                        $scope.CalcularImpuestosCotizacion();
                        $scope.Titulo = "NUEVA PROPUESTA COMERCIAL";
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
                        $scope.serviceBaseCRM + "Cotizaciones/CotizacionesAprobar",
                        $itemScope.item,
                        function (response) {
                            alertify.success(response.rows[0].Descripcion);
                            $scope.Sincronizar(function () {
                                $scope.MostrarProgress(false);
                            });
                        },
                        function () {
                            $scope.Sincronizar(function () {
                                $scope.MostrarProgress(false);
                            });
                        }
                    );
                });
            },
            displayed: function ($itemScope) {
                return $itemScope.item.Aprobada == false || $itemScope.item.Aprobada == null;
            }
        },
        {
            text: '<i class="fal fa-envelope-open-dollar orange"></i>&nbsp;&nbsp;Generar cupon de pago',
            click: function ($itemScope) {
                $scope.AbrirModalCupoPago($itemScope.item);
            },
            displayed: function ($itemScope) {
                return $itemScope.item.Aprobado == true;
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
    ];

    $scope.AbrirModalCupoPago = function (item) {
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseSIS + "Cotizaciones/CotizacionDetalladoConsultar/",
            { CotizacionID: item.CotizacionID, Token: $scope.Usuario.Token },
            function (response) {
                $scope.CupoPago = angular.extend({}, item, response.data);                
                $scope.CupoPago.DirIP = $scope.Usuario.Ip;
                $scope.CupoPago.ProcesoID = $scope.PreContacto.ProcesoID;
                $scope.CupoPago.Usuario = $scope.Usuario.UsuarioID;
                $scope.CupoPago.Token = $scope.Usuario.Token;
                $scope.CupoPago.PSE = true;
                $scope.CupoPago.EnviarCuponPago = true;                
                $scope.CupoPago.FechaCreacion = moment().format("DD/MM/YYYY");
                $scope.CupoPago.FechaVencimiento = moment().format("DD/MM/YYYY");
                $scope.Titulo = "GENERAR CUPON DE PAGO";
                $scope.MostrarHeaderPrincipal(false);
                $scope.ModoView = 3;
                $scope.MostrarProgress(false);
            }
        );
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
            $scope.CupoPago.ClientePaisCodigoISO = (item.CodigoISO == null ? "" : item.CodigoISO).toLowerCase();
            if ($scope.CupoPago.ClientePaisCodigoISO != 'co')
                $scope.CupoPago.ClienteCiudadID = null;
        }
    };

    $scope.ValidarCupoPago = function () {
        if ($scope.CupoPago.Nombres == undefined || $scope.CupoPago.Nombres == null || $scope.CupoPago.Nombres == "") {
            alertify.error("El nombre es obligatorio.");
            return false;
        }
        if ($scope.CupoPago.Apellidos == undefined || $scope.CupoPago.Apellidos == null || $scope.CupoPago.Apellidos == "") {
            alertify.error("El apellido es obligatorio.");
            return false;
        }
        if ($scope.CupoPago.Celular == undefined || $scope.CupoPago.Celular == null || $scope.CupoPago.Celular == "") {
            alertify.error("Debe ingresar el celular del cliente es obligatorio");
            return false;
        }                
        if ($scope.CupoPago.ClienteTipoDocumentoID == undefined || $scope.CupoPago.ClienteTipoDocumentoID == null) {
            alertify.error("Debe seleccionar un tipo de identificación es obligatorio");
            return false;
        }
        if ($scope.CupoPago.ClienteDocumento == undefined || $scope.CupoPago.ClienteDocumento == null || $scope.CupoPago.ClienteDocumento == "") {
            alertify.error("Debe ingresar un numero de identificación del cliente");
            return false;
        }
        if ($scope.CupoPago.ClienteTipoPersonaID == undefined || $scope.CupoPago.ClienteTipoPersonaID == null) {
            alertify.error("El tipo de persona es obligatorio.");
            return false;
        }
        if ($scope.CupoPago.ClienteNombres == undefined || $scope.CupoPago.ClienteNombres == null || $scope.CupoPago.ClienteNombres == "") {
            alertify.error("El nombre del cliente es obligatorio.");
            return false;
        }
        let _empresa = $filter('filter')($scope.TiposPersonas, function (elem) { return elem.TipoPersonaID == $scope.CupoPago.ClienteTipoPersonaID }, true)[0].Empresa;
        if (_empresa == false) {
            if ($scope.CupoPago.ClienteApellidos == undefined || $scope.CupoPago.ClienteApellidos == null || $scope.CupoPago.ClienteApellidos == "") {
                alertify.error("El apellido del cliente es obligatorio.");
                return false;
            }
        }       
        if ($scope.CupoPago.ClienteCelular == undefined || $scope.CupoPago.ClienteCelular == null || $scope.CupoPago.ClienteCelular == "") {
            alertify.error("Debe ingresar el celular del cliente es obligatorio");
            return false;
        }
        if ($scope.CupoPago.ClienteEmailFacturacionElectronica == undefined || $scope.CupoPago.ClienteEmailFacturacionElectronica == null || $scope.CupoPago.ClienteEmailFacturacionElectronica == "") {
            alertify.error("Debe ingresar el email de facturación del cliente es obligatorio");
            return false;
        }
        if ($scope.CupoPago.ClientePaisID == undefined || $scope.CupoPago.ClientePaisID == null) {
            alertify.error("El pais del cliente es obligatoria.");
            return false;
        }
        if ($scope.CupoPago.ClientePaisCodigoISO.toLowerCase() == 'co') {
            if ($scope.CupoPago.ClienteCiudadID == undefined || $scope.CupoPago.ClienteCiudadID == null) {
                alertify.error("La ciudad del cliente es obligatoria.");
                return false;
            }
        } else {
            $scope.CupoPago.ClienteCiudadID = null;
        }
        if ($scope.CupoPago.FechaCreacion == undefined || $scope.CupoPago.FechaCreacion == null || $scope.CupoPago.FechaCreacion == null) {
            alertify.error("La fecha de creación del cupon de pago es obligatoria.");
            return false;
        }
        if ($scope.CupoPago.FechaVencimiento == undefined || $scope.CupoPago.FechaVencimiento == null || $scope.CupoPago.FechaVencimiento == null) {
            alertify.error("La fecha de vencimiento del cupon de pago es obligatoria.");
            return false;
        }        
        return true;
    };

    $scope.GenerarCuponPago = function () {
        if ($scope.ValidarCupoPago()) {
            alertify.confirm("¿Desea generar el cupon de pago?", function () {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseFAC + "FacturasInmuebles/GenerarCuponPagoInmuebles/",
                    $scope.CupoPago,
                    function (response) {
                        alertify.success(response.rows[0].Descripcion);
                        $scope.Sincronizar(function () {
                            $scope.AtrasModoView();
                            $scope.PreContacto.ShowPreFacturas = true;
                            $scope.MostrarProgress(false);
                        });
                    }
                );
            });
        }
    };

    $scope.AbrirModalMailCuponPago = function (elem) {
        $scope.MailModel.Asunto = "Cupon pago N°." + elem.Consecutivo + " " + elem.NombreCompleto;
        $scope.MailModel.Destinatarios = $scope.PreContacto.Email;
        $scope.MailModel.Adjuntos = [{
            Ruta: $scope.serviceBaseFAC + "PDFs/DocumentoB?TipoDocumentoID=4&UniqueID=" + elem.UniqueID + "&Attachment=true",
            Nombre: "CuponPago_N°_" + elem.Consecutivo + ".pdf",
            NombreArchivo: "CuponPago_N°_" + elem.Consecutivo + ".pdf",
            Tipo: 2,
            Token: $scope.Usuario.Token
        }];
        $scope.MailModel.Open();
    };

    $scope.AbrirModalMailFactura = function (elem) {
        $scope.MailModel.Asunto = "Factura N°." + elem.Prefijo + elem.Consecutivo + " " + elem.NombreCompleto;
        $scope.MailModel.Destinatarios = $scope.PreContacto.Email;
        $scope.MailModel.Adjuntos = [{
            Ruta: $scope.serviceBaseFAC + "PDFs/DocumentoB?TipoDocumentoID=1&UniqueID=" + elem.UniqueID + "&Attachment=true",
            Nombre: "Factura_N°_" + elem.Prefijo + elem.Consecutivo + ".pdf",
            NombreArchivo: "Factura_N°_" + elem.Prefijo + elem.Consecutivo + ".pdf",
            Tipo: 2,
            Token: $scope.Usuario.Token
        }];
        $scope.MailModel.Open();
    };

    $scope.AbrirNuevoInmueble = function () {
        window.open(window.location.origin + "/GBI/InmueblesGBI/Gestion?IsOpener=true&ProcesoID=" + $scope.PreContacto.ProcesoID);
    };

    $scope.OnCloseVentanaInmueble = function (IsEdicion) {
        $scope.MostrarProgress(true);
        $scope.Sincronizar(function () {
            $scope.PreContacto.ShowInmueble = true;
            $scope.MostrarProgress(false);            
        });
    };

    $scope.MenuInmuebles = [
        {
            text: '<i class="fal fa-edit orange"></i>&nbsp;&nbsp;Editar inmueble',
            click: function ($itemScope) {
                $scope.EditarInmueble($itemScope.item);
            },
            enabled: function (elem) {
                return $scope.Usuario.PermiteEdicionInmueble;
            }
        },
        {
            text: '<i class="fal fa-home-alt blue"></i>&nbsp;&nbsp;Ficha inmueble',
            click: function ($itemScope) {                
                $scope.VerFichaInmueble($itemScope.item);
            }
        },
        {
            text: '<i class="fal fa-file-pdf red"></i>&nbsp;&nbsp;PDF del inmueble',
            click: function ($itemScope) {
                $scope.viewer.Open('API_GBI/api/PDFs/DocumentoD?TipoDocumentoID=13&DocumentoID=' + $itemScope.item.InmuebleID);
            }
        },
        {
            text: '<i class="fal fa-upload blue"></i>&nbsp;&nbsp;Publicaciones',
            click: function ($itemScope) {
                $scope.PublicarInmueble($itemScope.item);
            },
            enabled: function ($itemScope) {
                return $scope.Usuario.PermitePublicacionPortales;
            }
        },
        {
            text: '<i class="fal fa-mail-bulk blue"></i>&nbsp;&nbsp;Enviar correo a propietarios',
            click: function ($itemScope) {
                alertify.confirm("¿Desea enviar el correo de bienvenida a los propietarios?", function () {
                    $scope.MostrarProgress(true);
                    let _elem = angular.copy($itemScope.item);
                    Services.Async(
                        $scope.serviceBaseGBI + "Inmuebles/NotificarInmuebleCorreo/",
                        _elem,
                        function (response) {
                            $scope.MostrarProgress(false);
                            alertify.success(response.rows[0].Descripcion);
                        }
                    );
                });
            },
        },
        {
            text: '<i class="fal fa-chart-line font-20 green"></i>&nbsp;&nbsp;Informe comercial para propietarios',
            click: function ($itemScope) {
                window.open(window.location.origin + "/GBI/InmueblesGBI/InformeComercial?UniqueID=" + $itemScope.item.UniqueID);
            }
        },
        {
            text: '<i class="fal fa-clone green"></i>&nbsp;&nbsp;Duplicar inmueble<br><b style="margin-left: 35px">(Solo si es el mismo inmueble)</b>',
            click: function ($itemScope) {
                $scope.AbrirModalDuplicacion($itemScope.item);
            },
            //displayed: function ($itemScope) {
            //    return $scope.PreContacto.Inmuebles.length < 2;
            //}
        },
        {
            text: '<i class="fal fa-trash-alt red"></i>&nbsp;&nbsp;Eliminar inmueble</b>',
            click: function ($itemScope) {
                alertify.confirm("¿Desea eliminar el inmueble N°." + $itemScope.item.Consecutivo + "?", function () {
                    $scope.MostrarProgress(true);
                    let _elem = angular.copy($itemScope.item);
                    _elem.DirIP = $scope.Usuario.Ip;
                    _elem.Usuario = $scope.Usuario.UsuarioID;
                    _elem.Token = $scope.Usuario.Token;
                    Services.Async(
                        $scope.serviceBaseGBI + "Inmuebles/InmueblesEliminar/",
                        _elem,
                        function (response) {                            
                            $scope.Sincronizar(function () {
                                $scope.PreContacto.ShowInmueble = true;
                                $scope.MostrarProgress(false);
                            });
                        }
                    );
                });
            },
            displayed: function ($itemScope) {
                return $scope.Usuario.EliminacionInmuebles;
            }
        },
        null,
        {
            text: '<i class="fal fa-times-circle red"></i>&nbsp;&nbsp;Retirar inmueble',
            click: function ($itemScope) {
                $scope.AbrirModalRetirarInmueble($itemScope.item);
            },
            displayed: function ($itemScope) {
                return $itemScope.item.EstadoProcesoInmuebleID == 1 || $itemScope.item.EstadoProcesoInmuebleID == 4 || $itemScope.item.EstadoProcesoInmuebleID == 5;
            }
        },        
        {
            text: '<i class="fal fa-file-contract orange"></i>&nbsp;&nbsp;Solicitud contrato mandato',
            click: function ($itemScope) {
                $scope.AbrirSolicitudContrato($itemScope.item);
            },
            displayed: function ($itemScope) {
                return $itemScope.item.TipoOfertaID == 1;
            }
        },
        {
            text: '<i class="fal fa-file-contract orange"></i>&nbsp;&nbsp;Solicitud contrato corretaje',
            click: function ($itemScope) {
                $scope.AbrirSolicitudContratoCorretaje($itemScope.item);
            },
            displayed: function ($itemScope) {
                return $itemScope.item.TipoOfertaID == 2;
            }
        },
        {
            text: '<i class="fal fa-paper-plane"></i>&nbsp;&nbsp;Enviar a operaciones',
            click: function ($itemScope) {                
                alertify.confirm("¿Desea solicitar el contrato de " + ($itemScope.item.TipoOfertaID == 1 ? 'mandato' : 'corretaje') +" a operaciones?", function () {
                    $scope.MostrarProgress(true);
                    let _inmueble = angular.copy($itemScope.item);
                    _inmueble.DirIP = $scope.Usuario.Ip;
                    _inmueble.Usuario = $scope.Usuario.UsuarioID;
                    _inmueble.Token = $scope.Usuario.Token;                    
                    Services.Async(
                        $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesEnviarOperacionesMandato/",
                        _inmueble,
                        function (response) {
                            alertify.success(response.rows[0].Descripcion);
                            $scope.Sincronizar(function () {
                                $scope.PreContacto.ShowInmueble = true;
                                $scope.MostrarProgress(false);
                            });
                        }
                    );
                });                
            },
           enabled: function ($itemScope) {
                return $itemScope.item.EnTramiteMandato == false;
            },
            displayed: function ($itemScope) {
                return $itemScope.item.ContratoMandatoAprobado == false && $itemScope.item.EnTramiteMandato != null;
            }
        }
    ];

    $scope.AbrirModalRetirarInmueble = function (item) {
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseCRM + "Inmuebles/InmueblesRetiroConsultar",
            { InmuebleID: item.InmuebleID },
            function (response) {
                $scope.Proceso = angular.copy(item);
                $scope.Proceso.Inmuebles = [{ InmuebleID: item.InmuebleID }];                
                $scope.Proceso.InviabilizarProcesoComercial = false;
                $("#modalRetiroInmueble").modal("show");
                $scope.MostrarProgress(false);
            }
        );
    };

    $scope.InviabilizarRetirarInmueble = function () {
        if ($scope.Proceso.CausalInviabilidadID == undefined || $scope.Proceso.CausalInviabilidadID == null) {
            alertify.error("Debe seleccionar una causa.");
            return false;
        } else if ($scope.Proceso.ObservacionesInviabilidad == undefined || $scope.Proceso.ObservacionesInviabilidad == null || $scope.Proceso.ObservacionesInviabilidad == "") {
            alertify.error("Debe ingresar alguna observacion.");
            return false;
        }        
        alertify.confirm("¿Desea retirar el inmueble?", function () {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesAnular/",
                $scope.Proceso,
                function (response) {
                    $scope.MostrarProgress(false);
                    alertify.success(response.rows[0].Descripcion);
                    $scope.Sincronizar(function () {
                        $scope.PreContacto.ShowInmueble = true;
                        $("#modalRetiroInmueble").modal("hide");
                        $scope.MostrarProgress(false);
                    });
                }
            );
        });
    };

    $scope.ConfigInput = {
        IsMultiple: false,
        IsRemoveFiles: false,
        CDNEndPoint: $scope.Usuario.CDNEndPoint,
        CDNLlavePublica: $scope.Usuario.CDNLlavePublica,
        CDNLlavePrivada: $scope.Usuario.CDNLlavePrivada,
        Token: $scope.Usuario.Token,
        ClickCaption: function (elem) {
            if (elem.Ruta != undefined && elem.Ruta != "")
                $scope.viewer.Open(elem.Ruta);
        },
        PreUploadFileCDN: function (_file, _config) {
            //if (_file.size > 2000000) {
            //    alertify.error("El archivo no puede superar los 2MB.");
            //    return false;
            //}
            return true;
        },
        UploadFileCDN: function (response, _file, _data, _model) {
            _model.File = _file.File;
            _model.MimeType = _file.type;
            _model.RutaVieja = _model.Ruta;
            _model.Ruta = "cdn://" + response.CodigoUnico;
            _model.NombreArchivo = _file.name;
        }
    };

    $scope.AbrirSolicitudContrato = function (item) {
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesProcesosContratoMandatoConsultar/",
            { InmuebleID: item.InmuebleID, Token: $scope.Usuario.Token },
            function (response) {
                $scope.Inmueble = angular.extend({}, response.data);
                $scope.Inmueble.DirIP = $scope.Usuario.Ip;
                $scope.Inmueble.Usuario = $scope.Usuario.UsuarioID;
                $scope.Inmueble.Token = $scope.Usuario.Token;
                angular.forEach($scope.Inmueble.InmueblesDocumentos, function (elem) {
                    elem.Eliminar = false;
                });                
                angular.forEach($scope.Inmueble.InmueblesPropietarios, function (elem) {
                    elem.ValidacionDocumento = true;
                    $scope.ChangeTipoPersona(elem, "TipoPersonaID");
                    elem.Eliminar = false;                    
                    angular.forEach(elem.InmueblesDocumentos, function (elem2) {
                        elem2.Eliminar = false;
                    });
                });
                $scope.Titulo = "Solicitud de contrato mandato";
                $scope.MostrarHeaderPrincipal(false);
                $scope.ModoView = 4;
                $scope.MostrarProgress(false);
            }
        );
    };

    $scope.AbrirSolicitudContratoCorretaje = function (item) {
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesProcesosContratoMandatoConsultar/",
            { InmuebleID: item.InmuebleID, Token: $scope.Usuario.Token },
            function (response) {
                $scope.Inmueble = angular.extend({}, response.data);
                $scope.Inmueble.DirIP = $scope.Usuario.Ip;
                $scope.Inmueble.Usuario = $scope.Usuario.UsuarioID;
                $scope.Inmueble.Token = $scope.Usuario.Token;
                angular.forEach($scope.Inmueble.InmueblesDocumentos, function (elem) {
                    elem.Eliminar = false;
                });
                angular.forEach($scope.Inmueble.InmueblesPropietarios, function (elem) {
                    elem.ValidacionDocumento = true;
                    $scope.ChangeTipoPersona(elem, "TipoPersonaID");
                    elem.Eliminar = false;
                    angular.forEach(elem.InmueblesDocumentos, function (elem2) {
                        elem2.Eliminar = false;
                    });
                });
                $scope.Titulo = "Solicitud de contrato corretaje en venta";
                $scope.MostrarHeaderPrincipal(false);
                $scope.ModoView = 5;
                $scope.MostrarProgress(false);
            }
        );
    };

    $scope.ChangeDocumentosPropietario = function (propietario) {
        let _documentosBase = $filter('filter')($scope.ConfiguracionesDocumentosInmuebles, function (elem) { return elem.GrupoPersonaID == 4 && (elem.TipoPersonaID == propietario.TipoPersonaID || elem.TipoPersonaID == null) && elem.TipoOfertaID == $scope.Inmueble.TipoOfertaID; }, true);
        angular.forEach(propietario.InmueblesDocumentos, function (value) {
            if (value.Eliminar == false) {
                if ($filter('filter')(_documentosBase, function (elem) { return elem.ConfiguracionDocumentoInmuebleID == value.ConfiguracionDocumentoInmuebleID }, true).length == 0)
                    value.Eliminar = true;
            }
        });
        angular.forEach(_documentosBase, function (value) {
            if ($filter('filter')(propietario.InmueblesDocumentos, function (elem) { return elem.Eliminar == false && elem.ConfiguracionDocumentoInmuebleID == value.ConfiguracionDocumentoInmuebleID }, true).length == 0) {
                let _documento = angular.copy(value);
                _documento.Eliminar = false;
                _documento.CodigoOrigen = propietario.TerceroID;
                propietario.InmueblesDocumentos.push(_documento);
            }
        });
    };

    $scope.IsNull = function (val) {
        if (val == null)
            return "";
        else
            return val + " ";
    };

    $scope.addressBasic = {
        Token: $scope.Usuario.Token,
        OnSelectAddress: function (_DireccionBase, _Direccion, _Latitud, _Longitud, _LocalidadNombre) {
            $scope.Propietario.DireccionBase = $scope.addressBasic.getDireccionBaseStringify();
            $scope.Propietario.Direccion = _Direccion;
            $scope.Propietario.Latitud = _Latitud;
            $scope.Propietario.Longitud = _Longitud;
            $scope.Propietario.LocalidadNombre = _LocalidadNombre;
        }
    };

    $scope.AbrirModalUbicarPropietario = function (propietario) {
        $scope.Propietario = propietario;
        $scope.addressBasic.Title = "Dirección del propietario";
        $scope.addressBasic.SetDireccionBase(propietario.DireccionBase);
    };

    $scope.ArreglarDireccionBase = function (_baseDireccion) {
        if (typeof _baseDireccion === "string") {
            _baseDireccion = JSON.parse(_baseDireccion);
            return $scope.ArreglarDireccionBase(_baseDireccion);
        } else
            return _baseDireccion;
    };

    $scope.GetDireccionPropietario = function (propietario) {
        let _direccion = ""
        if (propietario) {
            if (propietario.DireccionBase) {                
                let _objDireccion = $scope.ArreglarDireccionBase(propietario.DireccionBase);
                if (_objDireccion.DireccionManual == null) {
                    _direccion = $scope.IsNull(_objDireccion.ViaPrincipal) + $scope.IsNull(_objDireccion.NumeroPrincipal) + $scope.IsNull(_objDireccion.LetraPrincipal) + (_objDireccion.BisPrincipal == true ? 'Bis ' : '') +
                        $scope.IsNull(_objDireccion.LetraBisPrincipal) + $scope.IsNull(_objDireccion.OrientacionPrincipal) + (_objDireccion.NumeroSecundaria == null ? "" : "#" + _objDireccion.NumeroSecundaria + " ") + $scope.IsNull(_objDireccion.LetraSecundaria) +
                        (_objDireccion.NumeroComplemento == null ? '' : "- " + _objDireccion.NumeroComplemento + " ") + $scope.IsNull(_objDireccion.OrientacionComplemento) + " " + $scope.IsNull(_objDireccion.Detalle);
                } else {
                    _direccion = $scope.IsNull(_objDireccion.DireccionManual);
                }
            } else if (propietario.Direccion)
                _direccion = propietario.Direccion;
        }
        return _direccion;
    };

    $scope.AgregarPropietario = function () {
        alertify.confirm("¿Desea agregar un nuevo propietario?", function () {
            let _tipoPersona = $filter('filter')($scope.TiposPersonas, function (elem) { return elem.DefaultPersonas == true }, true)[0];
            $scope.Propietario = {
                InmueblePropietarioID: null,
                TerceroID: null,
                Nombres: null,
                Nombres2: null,
                Apellidos: null,
                Apellidos2: null,
                TipoDocumentoID: $scope.TiposDocumentos[0].TipoDocumentoID,
                Documento: null,
                Direccion: null,
                Telefono: null,
                CelularCodigoArea: 57,
                Celular: null,
                Email: null,
                TipoPersonaID: _tipoPersona.TipoPersonaID,
                PaisID: null,
                PaisCodigoISO: null,
                CiudadID: null,
                ExpedicionDocumentoCiudadID: null,
                InmueblesDocumentos: [],
                ValidacionDocumento: false,
                Activo: true
            };
            $scope.ChangeTipoPersona($scope.Propietario, "TipoPersonaID");
            $scope.Inmueble.InmueblesPropietarios.push(angular.copy($scope.Propietario));
        });
    };

    $scope.QuitarPropietario = function (item, index) {
        alertify.confirm("¿Desea quitar el propietario " + (item.Nombres == null ? (index + 1) : item.Nombres) + (item.Apellidos == null ? "" : " " + item.Apellidos) + "?", function () {
            if (item.InmueblePropietarioID == null)
                $scope.Inmueble.InmueblesPropietarios.splice(index, 1);
            else
                item.Eliminar = true;
        });
    };

    $scope.SetField = function (field, obj) {
        $scope[field] = obj;        
    };

    $scope.ValidarPropietarios = function () {
        for (let i = 0; i < $scope.Inmueble.InmueblesDocumentos.length; i++) {
            let _elem = $scope.Inmueble.InmueblesDocumentos[i];
            if (_elem.GrupoPersonaID == 1) {
                if ((_elem.Ruta == undefined || _elem.Ruta == null || _elem.Ruta == "") && _elem.Requerido == true) {
                    alertify.error("El archivo " + _elem.Nombre + " es requerido.");
                    return false;
                }
            }
        }
        if ($scope.Inmueble.EstratoID == undefined || $scope.Inmueble.EstratoID == null) {
            alertify.error("El estrato del inmueble es obligatorio");
            return false;
        }
        if ($scope.Inmueble.CondicionInmuebleID == undefined || $scope.Inmueble.CondicionInmuebleID == null) {
            alertify.error("La condición del inmueble es obligatoria");
            return false;
        }
        if ($scope.Inmueble.UsoInmuebleID == undefined || $scope.Inmueble.UsoInmuebleID == null) {
            alertify.error("El uso del inmueble es obligatorio");
            return false;
        }
        if ($scope.Inmueble.TipoOfertaID == 2) {
            if ($scope.Inmueble.VentaTarifaComisionID == undefined || $scope.Inmueble.VentaTarifaComisionID == null) {
                alertify.error("La tarfifa de comisión es obligatoria");
                return false;
            }
        }
        /*if ($scope.Inmueble.CanonTarifaComisionID == undefined || $scope.Inmueble.CanonTarifaComisionID == null) {
            alertify.error("La tarifa de comision es obligatoria");
            return false;
        }*/
        if ($scope.Inmueble.TipoOfertaID != 2) {
            if ($scope.Inmueble.SeguroAmparoIntegral == true) {
                if ($scope.Inmueble.ValorSeguroAmparoIntegral == undefined || $scope.Inmueble.ValorSeguroAmparoIntegral == null) {
                    alertify.error("Debe ingresar el valor del seguro de amparo integral");
                    return false;
                }
            }
            if ($scope.Inmueble.LinderoGeneralNorte == undefined || $scope.Inmueble.LinderoGeneralNorte == null || $scope.Inmueble.LinderoGeneralNorte == "") {
                alertify.error("Debe ingresar el lindero general norte");
                return false;
            }
            if ($scope.Inmueble.LinderoGeneralSur == undefined || $scope.Inmueble.LinderoGeneralSur == null || $scope.Inmueble.LinderoGeneralSur == "") {
                alertify.error("Debe ingresar el lindero general sur");
                return false;
            }
            if ($scope.Inmueble.LinderoGeneralOriente == undefined || $scope.Inmueble.LinderoGeneralOriente == null || $scope.Inmueble.LinderoGeneralOriente == "") {
                alertify.error("Debe ingresar el lindero general oriente");
                return false;
            }
            if ($scope.Inmueble.LinderoGeneralOccidente == undefined || $scope.Inmueble.LinderoGeneralOccidente == null || $scope.Inmueble.LinderoGeneralOccidente == "") {
                alertify.error("Debe ingresar el lindero general occidente");
                return false;
            }
            if ($scope.Inmueble.LinderoEspecificoNorte == undefined || $scope.Inmueble.LinderoEspecificoNorte == null || $scope.Inmueble.LinderoEspecificoNorte == "") {
                alertify.error("Debe ingresar el lindero especifico norte");
                return false;
            }
            if ($scope.Inmueble.LinderoEspecificoSur == undefined || $scope.Inmueble.LinderoEspecificoSur == null || $scope.Inmueble.LinderoEspecificoSur == "") {
                alertify.error("Debe ingresar el lindero especifico sur");
                return false;
            }
            if ($scope.Inmueble.LinderoEspecificoOriente == undefined || $scope.Inmueble.LinderoEspecificoOriente == null || $scope.Inmueble.LinderoEspecificoOriente == "") {
                alertify.error("Debe ingresar el lindero especifico oriente");
                return false;
            }
            if ($scope.Inmueble.LinderoEspecificoOccidente == undefined || $scope.Inmueble.LinderoEspecificoOccidente == null || $scope.Inmueble.LinderoEspecificoOccidente == "") {
                alertify.error("Debe ingresar el lindero especifico occidente");
                return false;
            }
            if ($scope.Inmueble.LinderoInferior == undefined || $scope.Inmueble.LinderoInferior == null || $scope.Inmueble.LinderoInferior == "") {
                alertify.error("Debe ingresar el lindero inferior");
                return false;
            }
            if ($scope.Inmueble.LinderoSuperior == undefined || $scope.Inmueble.LinderoSuperior == null || $scope.Inmueble.LinderoSuperior == "") {
                alertify.error("Debe ingresar el lindero superior");
                return false;
            }
            if ($scope.Inmueble.TieneAdministracion) {
                if ($scope.Inmueble.ResponsablePagoAdministracionID == undefined || $scope.Inmueble.ResponsablePagoAdministracionID == null) {
                    alertify.error("Debe ingresar el responsable del pago de administración");
                    return false;
                }
            }
        }
        for (let i = 0; i < $scope.Inmueble.InmueblesPropietarios.length; i++) {
            let _propietario = $scope.Inmueble.InmueblesPropietarios[i];
            if (_propietario.TipoDocumentoID == undefined || _propietario.TipoDocumentoID == null) {
                alertify.error("Debe seleccionar un tipo de documento del PROPIETARIO");
                return false;
            }
            if (_propietario.Documento == undefined || _propietario.Documento == null || _propietario.Documento == "") {
                alertify.error("Debe ingresar un numero de documentos del PROPIETARIO " + (i + 1));
                return false;
            }
            if (_propietario.TipoPersonaID == undefined || _propietario.TipoPersonaID == null) {
                alertify.error("El tipo de persona del PROPIETARIO " + (i + 1) + " es obligatorio.");
                return false;
            }
            if (_propietario.PorcentajeParticipacion == undefined || _propietario.PorcentajeParticipacion == null) {
                alertify.error("El porcentaje de participación del PROPIETARIO " + (i + 1) + " es obligatorio.");
                return false;
            }
            if (_propietario.Nombres == undefined || _propietario.Nombres == null || _propietario.Nombres == "") {
                alertify.error("El nombre del PROPIETARIO " + (i + 1) + " es obligatorio.");
                return false;
            }
            let _empresa = $filter('filter')($scope.TiposPersonas, function (elem) { return elem.TipoPersonaID == _propietario.TipoPersonaID }, true)[0].Empresa;
            if (_empresa == false) {
                if (_propietario.Apellidos == undefined || _propietario.Apellidos == null || _propietario.Apellidos == "") {
                    alertify.error("El apellido del PROPIETARIO " + (i + 1) + " es obligatorio.");
                    return false;
                }
            }
            if (_propietario.Email == undefined || _propietario.Email == null || _propietario.Email == "") {
                alertify.error("Debe ingresar el email del PROPIETARIO " + (i + 1) + " es obligatorio");
                return false;
            }
            if (_propietario.Celular == undefined || _propietario.Celular == null || _propietario.Celular == "") {
                alertify.error("Debe ingresar el celular del PROPIETARIO " + (i + 1) + " es obligatorio");
                return false;
            }
            if (_propietario.Direccion == undefined || _propietario.Direccion == null || _propietario.Direccion == "") {
                alertify.error("Debe ingresar la dirección del PROPIETARIO " + (i + 1) + " es obligatorio");
                return false;
            }
            if (_propietario.PaisID == undefined || _propietario.PaisID == null) {
                alertify.error("Debe seleccionar el pais del PROPIETARIO " + (i + 1) + " es obligatorio");
                return false;
            }
            if (_propietario.PaisCodigoISO = 'co') {
                if (_propietario.CiudadID == undefined || _propietario.CiudadID == null) {
                    alertify.error("Debe seleccionar la ciudad del PROPIETARIO " + (i + 1) + " es obligatorio");
                    return false;
                }
            }
            if (_propietario.NacionalidadPaisID == undefined || _propietario.NacionalidadPaisID == null) {
                alertify.error("Debe seleccionar la nacionalidad del PROPIETARIO " + (i + 1) + " es obligatorio");
                return false;
            }
            for (let j = 0; j < _propietario.InmueblesDocumentos.length; j++) {
                let _elem = _propietario.InmueblesDocumentos[j];
                if (_elem.GrupoPersonaID == 4) {
                    if ((_elem.Ruta == undefined || _elem.Ruta == null || _elem.Ruta == "") && _elem.Requerido == true) {
                        alertify.error("El archivo " + _elem.Nombre + " del PROPIETARIO " + (i + 1) + " es requerido.");
                        return false;
                    }
                }
            }
        }
        return true;
    };

    $scope.GuardarPropietarios = function () {
        if ($scope.ValidarPropietarios()) {
            alertify.confirm("¿Desea guardar los cambios de los propietarios?", function () {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesProcesosSolicitarContratoMandato/",
                    $scope.Inmueble,
                    function (response) {
                        alertify.success(response.rows[0].Descripcion);
                        let _arrayFiles = [], _arrayDeleteFiles = [];
                        angular.forEach($scope.Inmueble.InmueblesDocumentos, function (elem) {
                            if (elem.Eliminar == false && elem.Ruta != null)
                                _arrayFiles.push((elem.Ruta == null ? "" : elem.Ruta).replaceAll("cdn://", ""));
                            if (elem.RutaVieja != null && elem.Eliminar == false)
                                _arrayDeleteFiles.push({ CodigoUnico: (elem.RutaVieja == null ? "" : elem.RutaVieja).replaceAll("cdn://", "") });
                            if (elem.Eliminar == true && elem.Ruta != null)
                                _arrayDeleteFiles.push({ CodigoUnico: (elem.Ruta == null ? "" : elem.Ruta).replaceAll("cdn://", "") });
                        });
                        angular.forEach($scope.Inmueble.InmueblesPropietarios, function (propietario) {
                            angular.forEach(propietario.InmueblesDocumentos, function (elem) {
                                if (elem.Eliminar == false && elem.Ruta != null)
                                    _arrayFiles.push((elem.Ruta == null ? "" : elem.Ruta).replaceAll("cdn://", ""));
                                if (elem.RutaVieja != null && elem.Eliminar == false)
                                    _arrayDeleteFiles.push({ CodigoUnico: (elem.RutaVieja == null ? "" : elem.RutaVieja).replaceAll("cdn://", "") });
                                if (elem.Eliminar == true && elem.Ruta != null)
                                    _arrayDeleteFiles.push({ CodigoUnico: (elem.Ruta == null ? "" : elem.Ruta).replaceAll("cdn://", "") });
                            });
                        });
                        $scope.CommitCDN(_arrayFiles);
                        $scope.EliminarArchivoCDN(_arrayDeleteFiles);                        
                        $scope.Sincronizar(function () {
                            $scope.PreContacto.ShowContratos = true;
                            $scope.AtrasModoView();
                            $scope.MostrarProgress(false);
                        });
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

    $scope.ddlSearchPaisesPropietario = {
        onSelect: function (item, _model) {
            _model.PaisCodigoISO = (item.CodigoISO == null ? "" : item.CodigoISO).toLowerCase();
            if (_model.PaisCodigoISO != 'co')
                _model.CiudadID = null;
        }
    };

    $scope.searchPaisesTelephone = function (term) {
        let found = [];
        for (let i = 0; i < allCountries.length; i++) {
            if (term) {
                term = term.toLowerCase();
                if (allCountries[i].name.toLowerCase().indexOf(term) != -1 || (allCountries[i].dialCode + "").toLowerCase().indexOf(term) != -1)
                    found.push(allCountries[i]);
            } else
                found.push(allCountries[i]);
        }
        return found;
    };

    $scope.PaisesTelephone = {
        setDisplayText: function (elem) {
            return "<div class=\"iti__selected-flag\"><div class=\"iti__flag iti__" + elem.iso2 + "\"></div></div>";
        },
        displayText: "<div class=\"iti__selected-flag\"><div class=\"iti__flag\"></div></div>",
        templeate: '<div class="iti__country iti__preferred">' +
            '<div class="iti__flag-box">' +
            '<div class="iti__flag" ng-class="\'iti__\' + item.iso2"></div>' +
            '</div>' +
            '<span class="iti__country-name">{{ item.name }}</span>' +
            '<span class="iti__dial-code">+{{ item.dialCode }}</span>' +
            '</div>'
    };

    $scope.AbrirModalDuplicacion = function (item) {
        $scope.Inmueble = item;
        $scope.InmuebleCopy = {
            DirIP: $scope.Usuario.Ip,
            Usuario: $scope.Usuario.UsuarioID,
            InmuebleID: item.InmuebleID,
            TipoOfertaID: $scope.Inmueble.TipoOfertaID,
            IncluirFotos: true,
            IncluirCaracteristicas: true,
            IncluirPropietarios: true,
            Token: $scope.Usuario.Token
        };
        angular.element("#modalDuplicarInmueble").modal("show");
    };

    $scope.DuplicarInmueble = function () {
        alertify.confirm("¿Desea duplicar el inmueble N." + $scope.Inmueble.Consecutivo + "?", function () {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseGBI + "Inmuebles/InmueblesDuplicar/",
                $scope.InmuebleCopy,
                function (response) {
                    alertify.success(response.rows[0].Descripcion);
                    $scope.Sincronizar(function () {                        
                        $scope.PreContacto.ShowInmueble = true;
                        $scope.MostrarProgress(false);
                        angular.element("#modalDuplicarInmueble").modal("hide");
                    });
                }
            );
        });
    };

    $scope.AbrirGenerarInventario = function () {
        $scope.Inventario = {
            DirIP: $scope.Usuario.Ip,
            Usuario: $scope.Usuario.UsuarioID,
            InmuebleID: null,
            InmuebleInventarioID: null,
            ConfiguracionInventarioID: null,
            UsuarioID: $scope.Usuario.UsuarioID,
            Video: null,
            Observaciones: null,
            Ruta: null,
            InmueblesInventariosFotos: [],
            InmueblesInventariosItems: [],
            Token: $scope.Usuario.Token
        };
        if ($scope.PreContacto.Inmuebles.length > 0)
            $scope.Inventario.InmuebleID = $scope.PreContacto.Inmuebles[0].InmuebleID;
        $scope.Titulo = "Generar inventario de captación";
        $scope.MostrarHeaderPrincipal(false);
        $scope.ModoView = 6;
    };

     $scope.ValidarInventario = function () {
         if ($scope.Inventario.InmuebleID == undefined || $scope.Inventario.InmuebleID == null) {
            alertify.error("Debe seleccionar un inmueble");
            return false;
        }
        if ($scope.Inventario.ConfiguracionInventarioID == undefined || $scope.Inventario.ConfiguracionInventarioID == null) {
            alertify.error("Debe seleccionar un tipo de inventario");
            return false;
        }
        return true;
    };

    $scope.GuardarCambiosInventario = function () {
        if ($scope.ValidarInventario()) {
            alertify.confirm("¿Desea guardar los cambios del inventario?", function () {                
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseGBI + "InmueblesInventarios/" + ($scope.Inventario.InmuebleInventarioID == null ? "InmueblesInventariosInsertar" : "InmueblesInventariosActualizar"),
                    $scope.Inventario,
                    function (response) {                        
                        alertify.success(response.rows[0].Descripcion);
                        let _arrayFiles = [], _arrayDeleteFiles = [];
                        angular.forEach($scope.Inventario.InmueblesInventariosFotos, function (elem) {
                            if (elem.Eliminar == false && elem.Ruta != null)
                                _arrayFiles.push((elem.Ruta == null ? "" : elem.Ruta).replaceAll("cdn://", ""));
                            if (elem.RutaVieja != null && elem.Eliminar == false)
                                _arrayDeleteFiles.push({ CodigoUnico: (elem.RutaVieja == null ? "" : elem.RutaVieja).replaceAll("cdn://", "") });
                            if (elem.Eliminar == true && elem.Ruta != null)
                                _arrayDeleteFiles.push({ CodigoUnico: (elem.Ruta == null ? "" : elem.Ruta).replaceAll("cdn://", "") });
                        });                        
                        $scope.CommitCDN(_arrayFiles);
                        $scope.EliminarArchivoCDN(_arrayDeleteFiles);
                        $scope.Sincronizar(function () {
                            $scope.AtrasModoView();
                            $scope.PreContacto.ShowInmueble = true;
                            $scope.MostrarProgress(false);
                        });
                    }
                );
            });
        }
    };

    $scope.ModificarInventario = function (elem) {
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseGBI + "InmueblesInventarios/InmueblesInventariosDetalladoConsultar/",
            { InmuebleInventarioID: elem.InmuebleInventarioID},
            function (response) {
                $scope.Inventario = response.data;
                angular.forEach($scope.Inventario.InmueblesInventariosFotos, function (elem) {
                    elem.Eliminar = false;                    
                });
                angular.forEach($scope.Inventario.InmueblesInventariosItems, function (elem) {
                    elem.Eliminar = false;
                    angular.forEach(elem.__children__, function (elem2) {
                        elem2.ID = $scope.Guid();
                        elem2.Eliminar = false;
                    });
                });
                $scope.Titulo = "Inventario de captación";
                $scope.MostrarHeaderPrincipal(false);
                $scope.ModoView = 6;        
                $scope.MostrarProgress(false);
            }
        );        
    };    

    $scope.ConfigInputArchivosInventario = {
        IsMultiple: false,
        IsRemoveFiles: false,
        CDNEndPoint: $scope.Usuario.CDNEndPoint,
        CDNLlavePublica: $scope.Usuario.CDNLlavePublica,
        CDNLlavePrivada: $scope.Usuario.CDNLlavePrivada,
        Token: $scope.Usuario.Token,
        PreUploadFileCDN: function (_file, _config) {
            let extencion = _file.name.split(".").pop().toLowerCase();
            if (extencion != "pdf") {
                alertify.error("Solo se puede cargar archivos (.pdf)");
                return false;
            }
            return true;
        },
        UploadFileCDN: function (response, _file, _data, _model) {
            $scope.Inmueble.File = _file.File;
            $scope.Inmueble.MimeType = _file.type;
            $scope.Inmueble.NombreArchivo = _file.name;
            $scope.Inmueble.RutaInventario = "cdn://" + response.CodigoUnico;
        }
    };

    $scope.CargarInventarioRuta = function (item) {
        $scope.Inmueble = angular.copy(item);
        //$scope.Inmueble.TipoDocumento = 5;
        $scope.Titulo = "Cargue de inventario de captación";
        $scope.MostrarHeaderPrincipal(false);
        $scope.ModoView = 7;
    };

    $scope.GuardarInventarioRuta = function () {
        if ($scope.Inmueble.RutaInventario == null || $scope.Inmueble.RutaInventario == undefined) {
            alertify.error("El archivo del inventario es requerido");
            return;
        }
        alertify.confirm("¿Desea guardar el documento del inventario?", function () {
            $scope.MostrarProgress(true);
            $scope.Inmueble.Ruta = $scope.Inmueble.RutaInventario
            Services.Async(
                $scope.serviceBaseGBI + "InmueblesInventarios/CargarInmuebleInventarioPDF",
                { Ruta: $scope.Inmueble.RutaInventario, InmuebleInventarioID: $scope.Inmueble.InmuebleInventarioID},
                function (response) {
                    alertify.success(response.rows[0].Descripcion);
                    let _arrayFiles = [];
                    _arrayFiles.push($scope.Inmueble.RutaInventario.replaceAll("cdn://", ""));
                    $scope.CommitCDN(_arrayFiles);
                    $scope.Inmueble.Ruta = null
                    $scope.Sincronizar(function () {
                        $scope.AtrasModoView();
                        $scope.PreContacto.ShowInmueble = true;
                        $scope.MostrarProgress(false);
                    });
                }
            );
        });
    };

    $scope.QuitarInventarioRuta = function (item) {
        if (item.RutaInventario == null || item.RutaInventario == undefined) {
            alertify.error("El archivo del inventario es requerido");
            return;
        }
        alertify.confirm("¿Desea eliminar el PDF cargado?", function () {
            $scope.MostrarProgress(true);
            $scope.EliminarArchivoCDN([{ CodigoUnico: item.RutaInventario.replaceAll("cdn://", "") }], function (response) {
                item.Ruta = null;
                Services.Async(
                    $scope.serviceBaseGBI + "InmueblesInventarios/CargarInmuebleInventarioPDF",
                    item,
                    function (response) {
                        alertify.success(response.rows[0].Descripcion);
                        $scope.Sincronizar(function () {
                            $scope.AtrasModoView();
                            $scope.PreContacto.ShowInmueble = true;
                            $scope.MostrarProgress(false);
                        });
                    }
                );
            });
        });
    };

    $scope.ChangeConfiguracionesInventarios = function () {
        if ($scope.Inventario.ConfiguracionInventarioID != null) {
            $scope.MostrarProgress(true);
            angular.forEach($scope.Inventario.InmueblesInventariosItems, function (elem) {
                elem.Eliminar = true;
                angular.forEach(elem.__children__, function (elem2) {
                    elem2.Eliminar = true;
                });
            });
            Services.Async(
                $scope.serviceBaseGBI + "ConfiguracionesInventarios/ConfiguracionesInventariosDetalladoConsultar/",
                $scope.Inventario,
                function (response) {
                    angular.forEach(response.data.ConfiguracionesInventariosItems, function (elem) {
                        elem.Eliminar = false;
                        angular.forEach(elem.__children__, function (elem2) {
                            elem2.Eliminar = false;
                            elem2.ReciboEstado = null;
                            elem2.ID = $scope.Guid();
                        });
                        $scope.Inventario.InmueblesInventariosItems.push(elem);
                    });
                    $scope.MostrarProgress(false);
                }
            );
        } else {
            angular.forEach($scope.Inventario.InmueblesInventariosItems, function (elem) {
                elem.Eliminar = true;
                angular.forEach(elem.__children__, function (elem2) {
                    elem2.Eliminar = true;
                });
            });
        }
    };

    $scope.DuplicarSinDatos = function (elem, index) {
        let _elem = angular.copy(elem);
        _elem.InmuebleInventarioItemID = null;
        _elem.Nombre = _elem.Nombre + " (Duplicado)";
        _elem.DependeID = null;
        _elem.Eliminar = false;
        angular.forEach(_elem.__children__, function (item) {
            item.InmuebleInventarioItemID = null;
            item.Cantidad = null;
            item.TipoMaterial = null;
            item.DependeID = null;
            item.ReciboEstado = null;
            item.ID = $scope.Guid();
            item.ReciboObservaciones = null;
            item.Eliminar = false;
        });
        $scope.Inventario.InmueblesInventariosItems.splice(index + 1, 0, _elem);
    };

    $scope.DuplicarConDatos = function (elem, index) {
        let _elem = angular.copy(elem);
        _elem.InmuebleInventarioItemID = null;
        _elem.Nombre = _elem.Nombre + " (Duplicado)";
        _elem.DependeID = null;
        _elem.Eliminar = false;
        angular.forEach(_elem.__children__, function (item) {
            item.InmuebleInventarioItemID = null;
            item.DependeID = null;
            item.ID = $scope.Guid();
            item.Eliminar = false;
        });
        $scope.Inventario.InmueblesInventariosItems.splice(index + 1, 0, _elem);
    };

    $scope.QuitarConcepto = function (elem, index) {
        if (elem.InmuebleInventarioItemID == null)
            $scope.Inventario.InmueblesInventariosItems.splice(index, 1);
        else {
            elem.Eliminar = true;
            angular.forEach(elem.__children__, function (elem2) {
                elem2.Eliminar = true;
            });
        }
    };

    $scope.EliminarAtributo = function (elem, index, item) {
        if (elem.InmuebleInventarioItemID == null)
            item.__children__.splice(index, 1);
        else
            elem.Eliminar = true;
        if ($filter("filter")(item.__children__, function (obj) { return obj.Eliminar == false }, true).length == 0)
            item.Eliminar = true;
    };

    $scope.AgregarNuevoAtributo = function (elem, index) {
        let _elem = {
            InmuebleInventarioItemID: null,
            Cantidad: null,
            Nombre: "Nuevo atributo",
            TipoMaterial: null,
            ReciboEstado: null,
            ID: $scope.Guid(),
            ReciboObservaciones: null,
            DependeID: null,
            Eliminar: false,
            __children__: [],
        };
        elem.__children__.push(_elem);
    };

    $scope.FinishRenderPhotos = function () {
        baguetteBox.run('.tz-gallery');
    };

    $scope.DuplicarSinDatosAtributo = function (atri, index, elem) {
        let _elem = angular.copy(atri);
        _elem.InmuebleInventarioItemID = null;
        _elem.Cantidad = null;
        _elem.Nombre = _elem.Nombre + " duplicado";
        _elem.TipoMaterial = null;
        _elem.ReciboEstado = null;
        _elem.ID = $scope.Guid();
        _elem.ReciboObservaciones = null;
        _elem.DependeID = null;
        _elem.Eliminar = false;
        _elem.__children__ = [];
        elem.__children__.splice(index + 1, 0, _elem);
    };

    $scope.DuplicarConDatosAtributo = function (atri, index, elem) {
        let _elem = angular.copy(atri);
        _elem.InmuebleInventarioItemID = null;
        _elem.Nombre = _elem.Nombre + " duplicado";
        _elem.ID = $scope.Guid();
        _elem.DependeID = null;
        _elem.Eliminar = false;
        _elem.__children__ = [];
        elem.__children__.splice(index + 1, 0, _elem);
    };

    $scope.ConfigInputPhotos = {
        IsMultiple: true,
        IsImages: true,
        Width: 700,
        Height: null,
        Quality: 50,
        CDNEndPoint: $scope.Usuario.CDNEndPoint,
        CDNLlavePublica: $scope.Usuario.CDNLlavePublica,
        CDNLlavePrivada: $scope.Usuario.CDNLlavePrivada,
        Token: $scope.Usuario.Token,
        PreUploadFileCDN: function (_file, _config) {
            let extencion = _file.name.split(".").pop().toLowerCase();
            if (extencion != "png" && extencion != "jpg" && extencion != "jpeg" && extencion != "gif" && extencion != "tiff") {
                alertify.error("Un archivo no se puede cargar por que no es una imagen.");
                return false;
            }
            return true;
        },
        UploadFileCDN: function (response, _file) {
            let _foto = {
                InmuebleInventarioFotoID: null,
                Nombre: _file.name,
                Orden: $scope.Inventario.InmueblesInventariosFotos.length + 1,
                Ruta: "cdn://" + response.CodigoUnico,
                Eliminar: false
            };
            $scope.Inventario.InmueblesInventariosFotos.push(angular.copy(_foto));
        }
    };

    $scope.EliminarPhoto = function (_item, _index) {
        alertify.confirm("¿Desea eliminar la foto del inventario?", function () {
            if (_item.InmuebleInventarioFotoID == null) {
                $scope.EliminarArchivoCDN([{ CodigoUnico: _item.Ruta.replaceAll("cdn://", "") }], function (response) {
                    $scope.Inventario.InmueblesInventariosFotos.splice(_index, 1);
                });
            } else
                _item.Eliminar = true;
        });
    };

    $scope.AplicarCambiosFoto = function () {
        alertify.confirm("¿Desea aplicar los cambios a la imagen?", function () {
            $scope.MostrarProgress(true);
            let result = $scope.cropper.getCroppedCanvas({ maxWidth: 4096, maxHeight: 4096 });
            let _base64 = result.toDataURL("image/png");
            _base64 = _base64.substring(_base64.indexOf(";base64,") + 8);
            Services.Async(
                $scope.Usuario.CDNEndPoint + "/api/Images/UploadImage/",
                {
                    Images: [
                        {
                            FileContent: _base64,
                            FileName: $scope.Imagen.Nombre,
                            Width: 700,
                            Height: null,
                            Quality: 75
                        }
                    ],
                    PrivateKey: $scope.Usuario.CDNLlavePrivada
                },
                function (response) {
                    $scope.FotoInmueble.Eliminar = true;
                    let _foto = {
                        InmuebleInventarioFotoID: null,
                        Nombre: $scope.Imagen.Nombre,
                        Orden: $scope.Inventario.InmueblesInventariosFotos.length + 1,
                        Ruta: "cdn://" + response.data[0].CodigoUnico,
                        Eliminar: false
                    };
                    let _array = angular.copy($scope.Inventario.InmueblesInventariosFotos);
                    _array.splice($scope.FotoInmuebleIndex, 0, angular.copy(_foto));
                    $scope.Inventario.InmueblesInventariosFotos = _array;
                    angular.element("#modalEdicionFotos").modal("hide");
                    $scope.cropper.destroy();
                    $scope.MostrarProgress(false);
                }
            );
        });
    };

    $scope.CerrarEdicionFotos = function () {
        if ($scope.cropper)
            $scope.cropper.destroy();
    };

    $scope.EditarFotoConCropper = function (_item, _index) {
        $scope.FotoInmueble = _item;
        $scope.FotoInmuebleIndex = _index;
        Services.Async(
            $scope.Usuario.CDNEndPoint + "/api/Files/FileBase64/",
            {
                UniqueID: _item.Ruta.replaceAll("cdn://", ""),
                PublicKey: $scope.Usuario.CDNLlavePublica
            },
            function (response) {
                $scope.Imagen = response.data;
                var Cropper = window.Cropper;
                var URL = window.URL || window.webkitURL;
                var image = document.getElementById("edicionImg");
                image.src = "data:" + $scope.Imagen.Tipo + ";base64," + $scope.Imagen.File;
                var options = {
                    aspectRatio: NaN,
                    minContainerWidth: 570,
                    minContainerHeight: 320,
                    autoCropArea: 0.97,
                    ready: function (e) {
                        e.type;
                    },
                    cropstart: function (e) {
                        e.type;
                        e.detail.action;
                    },
                    cropmove: function (e) {
                        e.type;
                        e.detail.action;
                    },
                    cropend: function (e) {
                        e.type;
                        e.detail.action;
                    },
                    crop: function (e) {
                        console.log(e.type);
                    },
                    zoom: function (e) {
                        e.type;
                        e.detail.ratio;
                    }
                };
                $scope.cropper = new Cropper(image, options);
                var originalImageURL = image.src;
                var uploadedImageType = 'image/png';
                // Buttons
                if (!document.createElement('canvas').getContext) {
                    $('button[data-method="getCroppedCanvas"]').prop('disabled', true);
                }
                if (typeof document.createElement('cropper').style.transition === 'undefined') {
                    $('button[data-method="rotate"]').prop('disabled', true);
                    $('button[data-method="scale"]').prop('disabled', true);
                }
                document.querySelector('.docs-buttons').onclick = function (event) {
                    var e = event || window.event;
                    var target = e.target || e.srcElement;
                    var cropped;
                    var result;
                    var input;
                    var data;

                    if (!$scope.cropper) {
                        return;
                    }

                    while (target !== this) {
                        if (target.getAttribute('data-method')) {
                            break;
                        }

                        target = target.parentNode;
                    }

                    if (target === this || target.disabled || target.className.indexOf('disabled') > -1) {
                        return;
                    }

                    data = {
                        method: target.getAttribute('data-method'),
                        target: target.getAttribute('data-target'),
                        option: target.getAttribute('data-option') || undefined,
                        secondOption: target.getAttribute('data-second-option') || undefined
                    };

                    cropped = $scope.cropper.cropped;

                    if (data.method) {
                        if (typeof data.target !== 'undefined') {
                            input = document.querySelector(data.target);

                            if (!target.hasAttribute('data-option') && data.target && input) {
                                try {
                                    data.option = JSON.parse(input.value);
                                } catch (e) {
                                    console.log(e.message);
                                }
                            }
                        }

                        switch (data.method) {
                            case 'rotate':
                                if (cropped && options.viewMode > 0) {
                                    $scope.cropper.clear();
                                }

                                break;

                            case 'getCroppedCanvas':
                                try {
                                    data.option = JSON.parse(data.option);
                                } catch (e) {
                                    console.log(e.message);
                                }

                                if (uploadedImageType === 'image/png') {
                                    if (!data.option) {
                                        data.option = {};
                                    }

                                    data.option.fillColor = '#fff';
                                }

                                break;
                        }

                        result = $scope.cropper[data.method](data.option, data.secondOption);

                        switch (data.method) {
                            case 'rotate':
                                if (cropped && options.viewMode > 0) {
                                    $scope.cropper.crop();
                                }
                                break;
                            case 'scaleX':
                            case 'scaleY':
                                target.setAttribute('data-option', -data.option);
                                break;
                            case 'destroy':
                                $scope.cropper = null;
                                if (uploadedImageURL) {
                                    URL.revokeObjectURL(uploadedImageURL);
                                    uploadedImageURL = '';
                                    image.src = originalImageURL;
                                }
                                break;
                        }

                        if (typeof result === 'object' && result !== $scope.cropper && input) {
                            try {
                                input.value = JSON.stringify(result);
                            } catch (e) {
                                console.log(e.message);
                            }
                        }
                    }
                };
                document.body.onkeydown = function (event) {
                    var e = event || window.event;
                    if (e.target !== this || !$scope.cropper || this.scrollTop > 300) {
                        return;
                    }
                    switch (e.keyCode) {
                        case 37:
                            e.preventDefault();
                            $scope.cropper.move(-1, 0);
                            break;

                        case 38:
                            e.preventDefault();
                            $scope.cropper.move(0, -1);
                            break;

                        case 39:
                            e.preventDefault();
                            $scope.cropper.move(1, 0);
                            break;

                        case 40:
                            e.preventDefault();
                            $scope.cropper.move(0, 1);
                            break;
                    }
                };
                angular.element("#modalEdicionFotos").modal("show");
            }
        );
    };

    $scope.VerFichaInmueble = function (elem) {
        window.open(window.location.origin + "/GBI/InmueblesGBI/Visualizar?UniqueID=" + elem.UniqueID)
    };

    $scope.EditarInmueble = function (item) {
        window.open(window.location.origin + "/GBI/InmueblesGBI/Gestion?InmuebleID=" + item.InmuebleID + "&IsOpener=true&ProcesoID=" + $scope.PreContacto.ProcesoID + "&IsCRM=true");
    };

    $scope.ChangeTodosPortales = function () {
        if ($scope.connectCC)
            $scope.InmueblePortales.PublicarCienCuadras = $scope.InmueblePortales.TodosPortales;
        if ($scope.connectML)
            $scope.InmueblePortales.PublicarMercadoLibre = $scope.InmueblePortales.TodosPortales;
        if ($scope.connectFR)
            $scope.InmueblePortales.PublicarFincaRaiz = $scope.InmueblePortales.TodosPortales;
        if ($scope.connectMC)
            $scope.InmueblePortales.PublicarMetroCuadrado = $scope.InmueblePortales.TodosPortales;
        if ($scope.connectWS)
            $scope.InmueblePortales.PublicarPaxzu = $scope.InmueblePortales.TodosPortales;
    };

    $scope.PublicarInmueble = function (item) {
        $scope.InmueblePortales = angular.copy(item);
        $scope.InmueblePortales.TodosPortales = true;
        if ($scope.connectML) {
            if ($scope.InmueblePortales.MercadoLibre != undefined && $scope.InmueblePortales.MercadoLibre != "") {
                $scope.InmueblePortales.PublicarMercadoLibre = false;
                $scope.InmueblePortales.TodosPortales = false;
            } else {
                $scope.InmueblePortales.PublicarMercadoLibre = true;
            }
        }
        if ($scope.connectFR) {
            if ($scope.InmueblePortales.FincaRaiz != undefined && $scope.InmueblePortales.FincaRaiz != "") {
                $scope.InmueblePortales.PublicarFincaRaiz = false;
                $scope.InmueblePortales.TodosPortales = false;
            } else {
                $scope.InmueblePortales.PublicarFincaRaiz = true;
            }
        }
        if ($scope.connectCC) {
            if ($scope.InmueblePortales.CienCuadras != undefined && $scope.InmueblePortales.CienCuadras != "") {
                $scope.InmueblePortales.PublicarCienCuadras = false;
                $scope.InmueblePortales.TodosPortales = false;
            } else {
                $scope.InmueblePortales.PublicarCienCuadras = true;
            }
        }
        if ($scope.connectMC) {
            if ($scope.InmueblePortales.MetroCuadrado != undefined && $scope.InmueblePortales.MetroCuadrado != "") {
                $scope.InmueblePortales.PublicarMetroCuadrado = false;
                $scope.InmueblePortales.TodosPortales = false;
            } else {
                $scope.InmueblePortales.PublicarMetroCuadrado = true;
            }
        }
        if ($scope.connectWS) {
            if ($scope.InmueblePortales.Paxzu != undefined && $scope.InmueblePortales.Paxzu != "") {
                $scope.InmueblePortales.PublicarPaxzu = false;
                $scope.InmueblePortales.TodosPortales = false;
            } else {
                $scope.InmueblePortales.PublicarPaxzu = true;
            }
        }

        $scope.InmueblePortales.LoadFincaRaiz = false;
        $scope.InmueblePortales.LoadMercadoLibre = false;
        $scope.InmueblePortales.LoadCienCuadras = false;
        $scope.InmueblePortales.LoadMetroCuadrado = false;
        $scope.InmueblePortales.LoadPaxzu = false;

        $scope.InmueblePortales.FincaRaizAutomatico = true;
        $scope.InmueblePortales.CienCuadrasAutomatico = true;
        $scope.InmueblePortales.MercadoLibreAutomatico = true;
        $scope.InmueblePortales.MetroCuadradoAutomatico = true;
        $scope.InmueblePortales.PaxzuAutomatico = true;

        angular.element("#modalPublicacion").modal("show");
    };

    $scope.PublicarEnPortales = function () {
        alertify.confirm("¿Desea publicar el inmueble en los portales seleccionados?", function () {
            if ($scope.InmueblePortales.PublicarFincaRaiz && $scope.InmueblePortales.FincaRaizAutomatico == true) {
                $scope.InmueblePortales.LoadFincaRaiz = true;
                $scope.InmueblePortales.ErroresFincaRaiz = null;
                Services.Async(
                    $scope.serviceBaseGBI + "FincaRaiz/PublicarInmueble/",
                    { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                    function (response) {
                        if (response.rows[0].Data.statusCode != undefined) {
                            if (response.rows[0].Data.statusCode != 200) {
                                $scope.InmueblePortales.ErroresFincaRaiz = response.rows[0].Data;
                                alertify.error("Errores FINCA RAIZ: " + response.rows[0].Data.message);
                            } else {
                                $scope.InmueblePortales.FincaRaiz = response.rows[0].Data.id;
                                $scope.Consultar();
                            }
                            $scope.InmueblePortales.LoadFincaRaiz = false;
                        } else {
                            if (response.rows[0].Data.ErrorCode < 0) {
                                $scope.InmueblePortales.ErroresFincaRaiz = response.rows[0].Data;
                                alertify.error("Errores FINCA RAIZ: " + response.rows[0].Data.Message);
                            } else {
                                $scope.InmueblePortales.FincaRaiz = response.rows[0].Data.AdvertId;
                                $scope.Consultar();
                            }
                            $scope.InmueblePortales.LoadFincaRaiz = false;
                        }
                    },
                    function (response) {
                        if (response.data.Message)
                            $scope.InmueblePortales.ErroresFincaRaiz = response.data.Message;
                        $scope.InmueblePortales.LoadFincaRaiz = false;
                    }
                );
            }
            if ($scope.InmueblePortales.PublicarCienCuadras && $scope.InmueblePortales.CienCuadrasAutomatico == true) {
                $scope.InmueblePortales.LoadCienCuadras = true;
                $scope.InmueblePortales.ErroresCienCuadras = null;
                Services.Async(
                    $scope.serviceBaseGBI + "CienCuadras/PublicarInmueble/",
                    { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                    function (response) {
                        if (response.rows[0].Data.CienCuadras != null)
                            $scope.InmueblePortales.CienCuadras = response.rows[0].Data.CienCuadras;

                        if (response.rows[0].Data.CienCuadrasPropertyID != null)
                            $scope.InmueblePortales.CienCuadrasPropertyID = response.rows[0].Data.CienCuadrasPropertyID;
                      
                        $scope.InmueblePortales.LoadCienCuadras = false;
                    },
                    function (response) {
                        if (response.data.Message)
                            $scope.InmueblePortales.ErroresCienCuadras = response.data.Message;
                        $scope.InmueblePortales.LoadCienCuadras = false;
                    }
                );
            }
            if ($scope.InmueblePortales.PublicarMercadoLibre && $scope.InmueblePortales.MercadoLibreAutomatico == true) {
                $scope.InmueblePortales.LoadMercadoLibre = true;
                $scope.InmueblePortales.ErroresMercadoLibre = null;
                Services.Async(
                    $scope.serviceBaseGBI + ($scope.InmueblePortales.MercadoLibre == null ? "MercadoLibre/PublicarInmueble/" : "MercadoLibre/SincronizarInmueble/"),
                    { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                    function (response) {
                        if (response.rows[0].Data.httpStatusCode == 200 || response.rows[0].Data.httpStatusCode == 201) {
                            $scope.InmueblePortales.MercadoLibre = response.rows[0].Data.id;                            
                            $scope.Consultar();
                        } else {
                            $scope.InmueblePortales.ErroresMercadoLibre = response.rows[0].Data.cause;
                            let _errores = "Errores MERCADO LIBRE: ";
                            for (let i = 0; i < response.rows[0].Data.cause.length; i++)
                                _errores += response.rows[0].Data.cause[i].message + "<br>";
                            alertify.error(_errores);
                        }
                        $scope.InmueblePortales.LoadMercadoLibre = false;
                    },
                    function (response) {
                        if (response.data.Error)
                            $scope.InmueblePortales.ErroresMercadoLibre = response.data.Error;
                        $scope.InmueblePortales.LoadMercadoLibre = false;
                    }
                );
            }
            if ($scope.InmueblePortales.PublicarPaxzu && $scope.InmueblePortales.PaxzuAutomatico == true) {
                $scope.InmueblePortales.LoadPaxzu = true;
                $scope.InmueblePortales.ErroresPaxzu = null;
                Services.Async(
                    $scope.serviceBaseGBI + "Paxzu/PublicarInmueble/",
                    { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                    function (response) {
                        if (response.rows[0].Data.CodeResult == 200 && (response.rows[0].Data.Response.length > 0 ? response.rows[0].Data.Response[0].status : "400") == "200") {
                            $scope.InmueblePortales.Paxzu = $scope.InmueblePortales.InmuebleID;                            
                            alertify.success(response.rows[0].Data.Response[0].msg);
                            $scope.Consultar();
                        } else {
                            let _error = { Message: "Error al publicar en webservice" }
                            if (response.rows[0].Data != undefined)
                                _error = response.rows[0].Data;
                            $scope.InmueblePortales.ErroresPaxzu = _error;
                            alertify.error("Error al publicar en webservice");
                        }
                        $scope.InmueblePortales.LoadPaxzu = false;
                    },
                    function (response) {
                        if (response.data.Message)
                            $scope.InmueblePortales.ErroresPaxzu = response.data.Message;
                        $scope.InmueblePortales.LoadPaxzu = false;
                    }
                );
            }
            if ($scope.InmueblePortales.PublicarMetroCuadrado && $scope.InmueblePortales.MetroCuadradoAutomatico == true) {
                $scope.InmueblePortales.LoadMetroCuadrado = true;
                Services.Async(
                    $scope.serviceBaseGBI + "MetroCuadrado/PublicarInmueble/",
                    { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                    function (response) {
                        if (response.rows[0].Data.MetroCuadradoTranID != null) {
                            $scope.InmueblePortales.MetroCuadrado = response.rows[0].Data.MetroCuadrado;
                            if ($scope.InmueblePortales.MetroCuadrado == null)
                                $scope.InmueblePortales.MetroCuadradoTranID = response.rows[0].Data.MetroCuadradoTranID;
                            else
                                $scope.InmueblePortales.MetroCuadradoTranID = null;
                        }

                        $scope.InmueblePortales.ErroresMetroCuadrado = null;
                        $scope.InmueblePortales.LoadMetroCuadrado = false;
                    },
                    function (response) {
                        if (response.data.Message)
                            $scope.InmueblePortales.ErroresMetroCuadrado = response.data.Message;
                        $scope.InmueblePortales.LoadMetroCuadrado = false;
                    }
                );
            }
        });
    };

    $scope.DesPublicarEnPortales = function () {
        alertify.confirm("¿Desea despublicar el inmueble en los portales seleccionados?", function () {
            if ($scope.InmueblePortales.PublicarFincaRaiz && $scope.InmueblePortales.FincaRaizAutomatico == true) {
                $scope.InmueblePortales.LoadFincaRaiz = true;
                $scope.InmueblePortales.ErroresFincaRaiz = null;
                Services.Async(
                    $scope.serviceBaseGBI + "FincaRaiz/BajarInmueble/",
                    { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                    function (response) {
                        $scope.InmueblePortales.FincaRaiz = null;
                        alertify.success(response.rows[0].Descripcion);
                        $scope.InmueblePortales.LoadFincaRaiz = false;                        
                    },
                    function (response) {
                        if (response.data.Error)
                            $scope.InmueblePortales.ErroresFincaRaiz = response.data.Error;
                        $scope.InmueblePortales.LoadFincaRaiz = false;
                    }
                );
            }
            if ($scope.InmueblePortales.PublicarCienCuadras && $scope.InmueblePortales.CienCuadrasAutomatico == true) {
                $scope.InmueblePortales.LoadCienCuadras = true;
                $scope.InmueblePortales.ErroresCienCuadras = null;
                Services.Async(
                    $scope.serviceBaseGBI + "CienCuadras/BajarInmueble/",
                    { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                    function (response) {
                        $scope.InmueblePortales.CienCuadras = null;
                        $scope.InmueblePortales.CienCuadrasPropertyID = null;
                        alertify.success(response.rows[0].Descripcion);
                        $scope.InmueblePortales.LoadCienCuadras = false;                        
                    },
                    function (response) {
                        if (response.data.Error)
                            $scope.InmueblePortales.ErroresCienCuadras = response.data.Error;
                        if (response.data.Message)
                            $scope.InmueblePortales.ErroresCienCuadras = response.data.Message;
                        $scope.InmueblePortales.LoadCienCuadras = false;
                    }
                );
            }
            if ($scope.InmueblePortales.PublicarMetroCuadrado && $scope.InmueblePortales.MetroCuadradoAutomatico == true) {
                $scope.InmueblePortales.LoadMetroCuadrado = true;
                $scope.InmueblePortales.ErroresMetroCuadrado = null;
                Services.Async(
                    $scope.serviceBaseGBI + "MetroCuadrado/BajarInmueble/",
                    { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                    function (response) {
                        $scope.InmueblePortales.MetroCuadrado = null;
                        alertify.success(response.rows[0].Descripcion);
                        $scope.InmueblePortales.LoadMetroCuadrado = false;
                    },
                    function (response) {
                        if (response.data.Error)
                            $scope.InmueblePortales.ErroresMetroCuadrado = response.data.Error;
                        $scope.InmueblePortales.LoadMetroCuadrado = false;
                    }
                );
            }
            if ($scope.InmueblePortales.PublicarMercadoLibre && $scope.InmueblePortales.MercadoLibreAutomatico == true) {
                $scope.InmueblePortales.LoadMercadoLibre = true;
                $scope.InmueblePortales.ErroresMercadoLibre = null;
                Services.Async(
                    $scope.serviceBaseGBI + "MercadoLibre/CerrarInmueble/",
                    { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                    function (response) {
                        if (response.rows[0].Data.httpStatusCode == 200 || response.rows[0].Data.httpStatusCode == 201) {
                            $scope.InmueblePortales.MercadoLibre = null;                            
                            alertify.success(response.rows[0].Descripcion);                            
                        } else {
                            $scope.InmueblePortales.ErroresMercadoLibre = response.rows[0].Data.cause;
                            let _errores = "Errores MERCADO LIBRE: ";
                            for (let i = 0; i < response.rows[0].Data.cause.length; i++)
                                _errores += response.rows[0].Data.cause[i].message + "<br>";
                            alertify.error(_errores);
                        }
                        $scope.InmueblePortales.LoadMercadoLibre = false;
                    },
                    function (response) {
                        if (response.data.Error)
                            $scope.InmueblePortales.ErroresMercadoLibre = response.data.Error;
                        $scope.InmueblePortales.LoadMercadoLibre = false;
                    }
                );
            }
            if ($scope.InmueblePortales.PublicarPaxzu && $scope.InmueblePortales.PaxzuAutomatico == true) {
                $scope.InmueblePortales.LoadPaxzu = true;
                $scope.InmueblePortales.ErroresPaxzu = null;
                Services.Async(
                    $scope.serviceBaseGBI + "Paxzu/EliminarInmueble/",
                    { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                    function (response) {
                        if (response.rows[0].Data.CodeResult == 200) {
                            $scope.InmueblePortales.Paxzu = null;
                            $scope.InmueblePortales.ErroresPaxzu = null;
                            alertify.success("Despublicación correcta");
                        } else {
                            $scope.InmueblePortales.ErroresPaxzu = response;
                            alertify.error("Error al despublicar en webservice");
                        }
                        $scope.InmueblePortales.LoadPaxzu = false;
                    },
                    function (response) {
                        if (response.data.Message)
                            $scope.InmueblePortales.ErroresPaxzu = response.data.Message;
                        $scope.InmueblePortales.LoadPaxzu = false;
                    }
                );
            }
        });
    };

    $scope.ValidarCodigoFincaRaiz = function () {
        alertify.confirm("¿Desea actualizar el código de finca raiz?", function () {
            Services.Async(
                $scope.serviceBaseGBI + "FincaRaiz/ObtenerCodigoInmueble/",
                { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                function (response) {
                    if (response.rows[0].Data.statusCode == 200) {
                        $scope.InmueblePortales.FincaRaiz = response.rows[0].Data.data.task.content[0].fr_property_id;
                        alertify.success(response.rows[0].Descripcion);
                        $scope.Consultar();
                    } else {
                        $scope.InmueblePortales.ErroresFincaRaiz = response.data.Data;
                    }
                }, function (response) {
                    alertify.error(response.data.Message);
                    if (response.data.Data)
                        $scope.InmueblePortales.ErroresFincaRaiz = response.data.Data;
                }
            );
        });
    };

    $scope.PublicarFincaRaiz = function () {
        alertify.confirm("¿Desea publicar el inmueble en Finca Raiz?", function () {
            $scope.InmueblePortales.ErroresFincaRaiz = null;
            $scope.InmueblePortales.LoadFincaRaiz = true;
            Services.Async(
                $scope.serviceBaseGBI + "FincaRaiz/PublicarInmueble/",
                { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                function (response) {
                    if (response.rows[0].Data.statusCode != undefined) {
                        if (response.rows[0].Data.statusCode != 200) {
                            $scope.InmueblePortales.ErroresFincaRaiz = response.rows[0].Data;
                            alertify.error("Errores FINCA RAIZ: " + response.rows[0].Data.message);
                        } else {
                            $scope.InmueblePortales.FincaRaiz = response.rows[0].Data.id;
                            $scope.Consultar();
                        }
                        $scope.InmueblePortales.LoadFincaRaiz = false;
                    } else {
                        if (response.rows[0].Data.ErrorCode < 0) {
                            $scope.InmueblePortales.ErroresFincaRaiz = response.rows[0].Data;
                            alertify.error("Errores FINCA RAIZ: " + response.rows[0].Data.Message);
                        } else {
                            $scope.InmueblePortales.FincaRaiz = response.rows[0].Data.AdvertId;
                            $scope.Consultar();
                        }
                        $scope.InmueblePortales.LoadFincaRaiz = false;
                    }
                },
                function (response) {
                    if (response.data.Message)
                        $scope.InmueblePortales.ErroresFincaRaiz = response.data.Message;
                    $scope.InmueblePortales.LoadFincaRaiz = false;
                }
            );
        });
    };

    $scope.DesactivarFincaRaiz = function () {
        alertify.confirm("¿Desea desactivar la publicación en Finca Raiz?", function () {
            $scope.InmueblePortales.LoadFincaRaiz = true;
            $scope.InmueblePortales.ErroresFincaRaiz = null;
            Services.Async(
                $scope.serviceBaseGBI + "FincaRaiz/BajarInmueble/",
                { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                function (response) {
                    $scope.InmueblePortales.FincaRaiz = null;
                    alertify.success(response.rows[0].Descripcion);
                    $scope.InmueblePortales.LoadFincaRaiz = false;
                },
                function (response) {
                    if (response.data.Message)
                        $scope.InmueblePortales.ErroresFincaRaiz = response.data.Message;
                    $scope.InmueblePortales.LoadFincaRaiz = false;
                }
            );
        });
    };

    $scope.ValidarCodigoCienCuadras = function () {
        alertify.confirm("¿Desea actualizar el código de ciencuadras.com?", function () {
            $scope.InmueblePortales.ErroresCienCuadras = null;
            Services.Async(
                $scope.serviceBaseGBI + "CienCuadras/ObtenerCodigoInmueble/",
                { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                function (response) {
                    if (response.rows[0].Data.HttpStatusCode == 200 || response.rows[0].Data.HttpStatusCode == 201) {
                        if (response.rows[0].Data.Propertys[0].message.statusCode == 99 || response.rows[0].Data.Propertys[0].message.statusCode == 100) {
                            $scope.InmueblePortales.CienCuadras = response.rows[0].Data.Propertys[0].propertyCode;
                            alertify.success(response.rows[0].Descripcion);
                            $scope.Consultar();
                        } else {
                            $scope.InmueblePortales.ErroresCienCuadras = response.rows[0].Data;
                        }
                    } else {
                        $scope.InmueblePortales.ErroresCienCuadras = response.rows[0].Data;
                    }
                },
                function (response) {
                    if (response.data.Message)
                        $scope.InmueblePortales.ErroresCienCuadras = response.data.Message;
                }
            );
        });
    };

    $scope.ValidarCodigoMetroCuadrado = function () {
        alertify.confirm("¿Desea actualizar el código de metrocuadrado.com?", function () {
            $scope.InmueblePortales.ErroresMetroCuadrado = null;
            Services.Async(
                $scope.serviceBaseGBI + "MetroCuadrado/ObtenerCodigoInmueble/",
                { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                function (response) {
                    if (response.rows[0].Data.HttpStatusCode == 200 || response.rows[0].Data.HttpStatusCode == 201) {
                        if (response.rows[0].Data.Transaccion.code == 200) {
                            $scope.InmueblePortales.MetroCuadrado = response.rows[0].Data.Transaccion.resourceId;
                            $scope.InmueblePortales.MetroCuadradoTranID = null;
                            alertify.success(response.rows[0].Descripcion);
                            $scope.Consultar();
                        } else {
                            $scope.InmueblePortales.ErroresMetroCuadrado = response.rows[0].Data.Transaccion;
                        }
                    } else {
                        $scope.InmueblePortales.ErroresMetroCuadrado = response.rows[0].Data.HttpErrorMessage;
                    }
                },
                function (response) {
                    if (response.data.Message)
                        $scope.InmueblePortales.ErroresMetroCuadrado = response.data.Message;
                }
            );
        });
    };

    $scope.PublicarCienCuadras = function () {
        alertify.confirm("¿Desea publicar el inmueble en ciencuadras.com?", function () {
            $scope.InmueblePortales.ErroresCienCuadras = null;
            $scope.InmueblePortales.LoadCienCuadras = true;
            Services.Async(
                $scope.serviceBaseGBI + "CienCuadras/PublicarInmueble/",
                { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                function (response) {
                    if (response.rows[0].Data.CienCuadras != null)
                        $scope.InmueblePortales.CienCuadras = response.rows[0].Data.CienCuadras;

                    if (response.rows[0].Data.CienCuadrasPropertyID != null)
                        $scope.InmueblePortales.CienCuadrasPropertyID = response.rows[0].Data.CienCuadrasPropertyID;

                    $scope.Consultar();
                    $scope.InmueblePortales.LoadCienCuadras = false;
                },
                function (response) {
                    if (response.data.Message)
                        $scope.InmueblePortales.ErroresCienCuadras = response.data.Message;
                    $scope.InmueblePortales.LoadCienCuadras = false;
                }
            );
        });
    };

    $scope.DesactivarCienCuadras = function () {
        alertify.confirm("¿Desea desactivar la publicación en ciencuadras.com?", function () {
            $scope.InmueblePortales.LoadCienCuadras = true;
            $scope.InmueblePortales.ErroresCienCuadras = null;
            Services.Async(
                $scope.serviceBaseGBI + "CienCuadras/BajarInmueble/",
                { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                function (response) {
                    $scope.InmueblePortales.CienCuadras = null;
                    $scope.InmueblePortales.CienCuadrasPropertyID = null;
                    alertify.success(response.rows[0].Descripcion);
                    $scope.InmueblePortales.LoadCienCuadras = false;
                    $scope.Consultar();
                },
                function (response) {
                    if (response.data.Message)
                        $scope.InmueblePortales.ErroresCienCuadras = response.data.Message;
                    if (response.data.Message)
                        $scope.InmueblePortales.ErroresCienCuadras = response.data.Message;
                    $scope.InmueblePortales.LoadCienCuadras = false;
                }
            );
        });
    };

    $scope.PublicarMercadoLibre = function () {
        alertify.confirm("¿Desea publicar el inmueble en Mercado Libre?", function () {
            $scope.InmueblePortales.ErroresMercadoLibre = null;
            $scope.InmueblePortales.LoadMercadoLibre = true;
            Services.Async(
                $scope.serviceBaseGBI + ($scope.InmueblePortales.MercadoLibre == null ? "MercadoLibre/PublicarInmueble/" : "MercadoLibre/SincronizarInmueble/"),
                { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                function (response) {
                    if (response.rows[0].Data.httpStatusCode == 200 || response.rows[0].Data.httpStatusCode == 201) {
                        $scope.InmueblePortales.ErroresMercadoLibre = null;
                        $scope.InmueblePortales.MercadoLibre = response.rows[0].Data.id;
                    } else {
                        $scope.InmueblePortales.ErroresMercadoLibre = response.rows[0].Data.cause;
                        let _errores = "Errores MERCADO LIBRE: ";
                        for (let i = 0; i < response.rows[0].Data.cause.length; i++)
                            _errores += response.rows[0].Data.cause[i].message + "<br>";
                        alertify.error(_errores);
                    }
                    $scope.InmueblePortales.LoadMercadoLibre = false;
                },
                function (response) {
                    if (response.data.Error)
                        $scope.InmueblePortales.ErroresMercadoLibre = response.data.Error.cause;
                    $scope.InmueblePortales.LoadMercadoLibre = false;
                }
            );
        });
    };

    $scope.DesactivarMercadoLibre = function () {
        alertify.confirm("¿Desea desactivar la publicación en Mercado Libre?", function () {
            $scope.InmueblePortales.LoadMercadoLibre = true;
            $scope.InmueblePortales.ErroresMercadoLibre = null;
            Services.Async(
                $scope.serviceBaseGBI + "MercadoLibre/CerrarInmueble/",
                { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                function (response) {
                    if (response.rows[0].Data.httpStatusCode == 200 || response.rows[0].Data.httpStatusCode == 201) {
                        $scope.InmueblePortales.MercadoLibre = null;
                        $scope.InmueblePortales.ErroresMercadoLibre = null;
                        alertify.success(response.rows[0].Descripcion);
                    } else {
                        $scope.InmueblePortales.ErroresMercadoLibre = response.rows[0].Data.cause;
                        let _errores = "Errores MERCADO LIBRE: ";
                        for (let i = 0; i < response.rows[0].Data.cause.length; i++)
                            _errores += response.rows[0].Data.cause[i].message + "<br>";
                        alertify.error(_errores);
                    }
                    $scope.InmueblePortales.LoadMercadoLibre = false;
                },
                function (response) {
                    if (response.data.Error)
                        $scope.InmueblePortales.ErroresMercadoLibre = response.data.Error.cause;
                    $scope.InmueblePortales.LoadMercadoLibre = false;
                }
            );
        });
    };

    $scope.PublicarPaxzu = function () {
        alertify.confirm("¿Desea publicar el inmueble en webservice?", function () {
            $scope.InmueblePortales.ErroresPaxzu = null;
            $scope.InmueblePortales.LoadPaxzu = true;
            Services.Async(
                $scope.serviceBaseGBI + "Paxzu/PublicarInmueble/",
                { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                function (response) {
                    if (response.rows[0].Data.CodeResult == 200 && (response.rows[0].Data.Response.length > 0 ? response.rows[0].Data.Response[0].status : "400") == "200") {
                        $scope.InmueblePortales.Paxzu = $scope.InmueblePortales.InmuebleID;
                        $scope.InmueblePortales.ErroresPaxzu = null;
                        alertify.success(response.rows[0].Data.Response[0].msg);
                    } else {
                        let _error = { Message: "Error al publicar en webservice" }
                        if (response.rows[0].Data != undefined)
                            _error = response.rows[0].Data;
                        $scope.InmueblePortales.ErroresPaxzu = _error;
                        alertify.error("Error al publicar en webservice");
                    }
                    $scope.InmueblePortales.LoadPaxzu = false;
                },
                function (response) {
                    if (response.data.Message)
                        $scope.InmueblePortales.ErroresPaxzu = response.data.Message;
                    $scope.InmueblePortales.LoadPaxzu = false;
                }
            );
        });
    };

    $scope.DesactivarPaxzu = function () {
        alertify.confirm("¿Desea desactivar la publicación en webservice?", function () {
            $scope.InmueblePortales.LoadPaxzu = true;
            $scope.InmueblePortales.ErroresPaxzu = null;
            Services.Async(
                $scope.serviceBaseGBI + "Paxzu/EliminarInmueble/",
                { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                function (response) {
                    if (response.rows[0].Data.CodeResult == 200) {
                        $scope.InmueblePortales.Paxzu = null;
                        $scope.InmueblePortales.ErroresPaxzu = null;
                        alertify.success("Despublicación correcta");
                    } else {
                        $scope.InmueblePortales.ErroresPaxzu = response;
                        alertify.error("Error al despublicar en webservice");
                    }
                    $scope.InmueblePortales.LoadPaxzu = false;
                },
                function (response) {
                    if (response.data.Message)
                        $scope.InmueblePortales.ErroresPaxzu = response.data.Message;
                    $scope.InmueblePortales.LoadPaxzu = false;
                }
            );
        });
    };

    $scope.PublicarMetroCuadrado = function () {
        alertify.confirm("¿Desea publicar el inmueble en metrocuadrado.com?", function () {
            $scope.InmueblePortales.ErroresMetroCuadrado = null;
            $scope.InmueblePortales.LoadMetroCuadrado = true;
            Services.Async(
                $scope.serviceBaseGBI + "MetroCuadrado/PublicarInmueble/",
                { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                function (response) {
                    if (response.rows[0].Data.MetroCuadradoTranID != null) {
                        $scope.InmueblePortales.MetroCuadrado = response.rows[0].Data.MetroCuadrado;
                        if ($scope.InmueblePortales.MetroCuadrado == null)
                            $scope.InmueblePortales.MetroCuadradoTranID = response.rows[0].Data.MetroCuadradoTranID;
                        else
                            $scope.InmueblePortales.MetroCuadradoTranID = null;
                    }

                    $scope.InmueblePortales.LoadMetroCuadrado = false;
                    $scope.Consultar();
                },
                function (response) {
                    if (response.data.Message)
                        $scope.InmueblePortales.ErroresMetroCuadrado = response.data.Message;
                    $scope.InmueblePortales.LoadMetroCuadrado = false;
                }
            );
        });
    };

    $scope.DesactivarMetroCuadrado = function () {
        alertify.confirm("¿Desea desactivar la publicación en metrocuadrado.com?", function () {
            $scope.InmueblePortales.LoadMetroCuadrado = true;
            $scope.InmueblePortales.ErroresMetroCuadrado = null;
            Services.Async(
                $scope.serviceBaseGBI + "MetroCuadrado/BajarInmueble/",
                { UsuarioID: $scope.Usuario.UsuarioID, InmuebleID: $scope.InmueblePortales.InmuebleID, Token: $scope.Usuario.Token },
                function (response) {
                    $scope.InmueblePortales.MetroCuadrado = null;
                    alertify.success(response.rows[0].Descripcion);
                    $scope.InmueblePortales.LoadMetroCuadrado = false;
                    $scope.Consultar();
                },
                function (response) {
                    if (response.data.Error)
                        $scope.InmueblePortales.ErroresMetroCuadrado = response.data.Error;
                    $scope.InmueblePortales.LoadMetroCuadrado = false;
                }
            );
        });
    };

    $scope.GuardarCodigoFincaRaiz = function () {        
        alertify.confirm("¿Desea guardar el código de finca raiz?", function () {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseGBI + "InmueblesPortales/FincaRaizCodigo/",
                {
                    DirIP: $scope.Usuario.Ip,
                    Usuario: $scope.Usuario.UsuarioID,
                    InmuebleID: $scope.InmueblePortales.InmuebleID,
                    FincaRaiz: $scope.InmueblePortales.FincaRaiz,
                    Token: $scope.Usuario.Token
                },
                function (response) {
                    $scope.MostrarProgress(false);
                    alertify.success(response.rows[0].Descripcion);
                    $scope.Consultar();
                }, function (response) {
                    $scope.InmueblePortales.FincaRaiz = null;
                }
            );
        });
    };

    $scope.GuardarCodigoMercadoLibre = function () {        
        alertify.confirm("¿Desea guardar el código de mercado libre?", function () {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseGBI + "InmueblesPortales/MercadoLibreCodigo/",
                {
                    DirIP: $scope.Usuario.Ip,
                    Usuario: $scope.Usuario.UsuarioID,
                    InmuebleID: $scope.InmueblePortales.InmuebleID,
                    MercadoLibre: $scope.InmueblePortales.MercadoLibre,
                    Token: $scope.Usuario.Token
                },
                function (response) {
                    $scope.MostrarProgress(false);
                    alertify.success(response.rows[0].Descripcion);
                    $scope.Consultar();
                }, function (response) {
                    $scope.InmueblePortales.MercadoLibre = null;
                }
            );
        });
    };

    $scope.GuardarCodigoPaxzu = function () {        
        alertify.confirm("¿Desea guardar el código de mercado libre?", function () {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseGBI + "InmueblesPortales/PaxzuCodigo/",
                {
                    DirIP: $scope.Usuario.Ip,
                    Usuario: $scope.Usuario.UsuarioID,
                    InmuebleID: $scope.InmueblePortales.InmuebleID,
                    Paxzu: $scope.InmueblePortales.Paxzu,
                    Token: $scope.Usuario.Token
                },
                function (response) {
                    $scope.MostrarProgress(false);
                    alertify.success(response.rows[0].Descripcion);
                    $scope.Consultar();
                }, function (response) {
                    $scope.InmueblePortales.Paxzu = null;
                }
            );
        });
    };

    $scope.GuardarCodigoMetroCuadrado = function () {        
        alertify.confirm("¿Desea guardar el código de metro cuadrado?", function () {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseGBI + "InmueblesPortales/MetroCuadradoCodigo/",
                {
                    DirIP: $scope.Usuario.Ip,
                    Usuario: $scope.Usuario.UsuarioID,
                    InmuebleID: $scope.InmueblePortales.InmuebleID,
                    MetroCuadrado: $scope.InmueblePortales.MetroCuadrado,
                    Token: $scope.Usuario.Token
                },
                function (response) {
                    $scope.MostrarProgress(false);
                    alertify.success(response.rows[0].Descripcion);
                    $scope.Consultar();
                }, function (response) {
                    $scope.InmueblePortales.MetroCuadrado = null;
                }
            );
        });
    };

    $scope.AbrirLinkMercadoLibre = function (_mercadoLibre) {
        window.open("https://inmueble.mercadolibre.com.co/" + _mercadoLibre.replaceAll("MCO", "MCO-"));
    };

    $scope.AbrirLinkMetroCuadrado = function (_metroCuadrado) {
        window.open("https://www.metrocuadrado.com/inmueble/i/" + _metroCuadrado);
    };

    $scope.AbrirLinkFincaRaiz = function (_fincaRaiz) {
        window.open("https://www.fincaraiz.com.co/inmueble/a/a/a/" + _fincaRaiz);
    };

    $scope.AbrirLinkCienCuadras = function (_cienCuadras) {
        window.open(($scope.configuracionCC.Pruebas == false ? "https://www.ciencuadras.com/inmueble/" : "https://pre.ciencuadras.com/inmueble/") + _cienCuadras);
    };

    $scope.AbrirLinkPaxzu = function (_paxzu) {
        if ($scope.configuracionWS.UrlPreview != null)
            window.open($scope.configuracionWS.UrlPreview + _paxzu);
    };


    $scope.AbrirModalLog = function (_errores) {
        $('#json-container-error').jsonPresenter('destroy').jsonPresenter({ json: _errores }).jsonPresenter('expandAll');
        $("#modalLogTecnico").modal("show");
    };

    $scope.ShowPublicar = function () {
        if ($scope.InmueblePortales) {
            if ($scope.InmueblePortales.PublicarMetroCuadrado == true && $scope.InmueblePortales.MetroCuadradoAutomatico == true)
                return false;
            if ($scope.InmueblePortales.PublicarMercadoLibre == true && $scope.InmueblePortales.MercadoLibreAutomatico == true)
                return false;
            if ($scope.InmueblePortales.PublicarFincaRaiz == true && $scope.InmueblePortales.FincaRaizAutomatico == true)
                return false;
            if ($scope.InmueblePortales.PublicarCienCuadras == true && $scope.InmueblePortales.CienCuadrasAutomatico == true)
                return false;
            if ($scope.InmueblePortales.PublicarPaxzu == true && $scope.InmueblePortales.PaxzuAutomatico == true)
                return false;
            else
                return true;
        }
        else
            return false;
    };

    $scope.CargarConfiguraciones = function () {
        Services.Async(
            $scope.serviceBaseGBI + "Configuraciones/ConfiguracionesConsultar",
            { Token: $scope.Usuario.Token },
            function (response) {
                if (response.length > 0) {
                    $scope.configuracion = angular.extend({}, $scope.configuracion, response[0]);

                    $scope.configuracionML = JSON.parse($filter('filter')($scope.configuracion.ConfiguracionesPortalesInmobiliarios, function (elem) { return elem.PortalInmobiliarioID == 1 }, true)[0].DatosAcceso);
                    $scope.connectML = false;
                    if ($scope.configuracionML != null) {
                        if ($scope.configuracionML.client_secret != null && $scope.configuracionML.client_id != null && $scope.configuracionML.access_token != null && $scope.configuracionML.status != null && $scope.configuracionML.user_id != null)
                            $scope.connectML = true;
                    }

                    $scope.configuracionFR = JSON.parse($filter('filter')($scope.configuracion.ConfiguracionesPortalesInmobiliarios, function (elem) { return elem.PortalInmobiliarioID == 3 }, true)[0].DatosAcceso);
                    $scope.connectFR = false;
                    if ($scope.configuracionFR != null) {
                        if (($scope.configuracionFR.ApiV2 == null ? false : true) == false && $scope.configuracionFR.Usuario != null && $scope.configuracionFR.Contrasena != null)
                            $scope.connectFR = true;
                        if (($scope.configuracionFR.ApiV2 == null ? false : true) == true && $scope.configuracionFR.ClientID != null)
                            $scope.connectFR = true;
                    }
                    $scope.configuracionWS = JSON.parse($filter('filter')($scope.configuracion.ConfiguracionesPortalesInmobiliarios, function (elem) { return elem.PortalInmobiliarioID == 4 }, true)[0].DatosAcceso);
                    $scope.connectWS = false;
                    if ($scope.configuracionWS != null) {
                        if ($scope.configuracionWS.UrlEnpoint != null && $scope.configuracionWS.TokenSeguridad != null && $scope.configuracionWS.UrlPreview != null)
                            $scope.connectWS = true;
                    }

                    $scope.configuracionCC = JSON.parse($filter('filter')($scope.configuracion.ConfiguracionesPortalesInmobiliarios, function (elem) { return elem.PortalInmobiliarioID == 5 }, true)[0].DatosAcceso);
                    $scope.connectCC = false;
                    if ($scope.configuracionCC != null) {
                        if ($scope.configuracionCC.Usuario != null && $scope.configuracionCC.Contrasena != null && $scope.configuracionCC.Pruebas != null)
                            $scope.connectCC = true;
                    }

                    $scope.configuracionMC = JSON.parse($filter('filter')($scope.configuracion.ConfiguracionesPortalesInmobiliarios, function (elem) { return elem.PortalInmobiliarioID == 2 }, true)[0].DatosAcceso);
                    $scope.connectMC = false;
                    if ($scope.configuracionMC != null) {
                        if ($scope.configuracionMC.Usuario != null && $scope.configuracionMC.Contrasena != null && $scope.configuracionMC.Identification != null && $scope.configuracionMC.x_api_key != null && $scope.configuracionMC.Pruebas != null)
                            $scope.connectMC = true;
                    }
                }
            }
        );
    };

    $scope.SetFincaRaiz = function () {
        if ($scope.connectFR)
            $scope.InmueblePortales.PublicarFincaRaiz = ($scope.InmueblePortales.PublicarFincaRaiz ? false : true);
    };

    $scope.SetMercadoLibre = function () {
        if ($scope.connectML)
            $scope.InmueblePortales.PublicarMercadoLibre = ($scope.InmueblePortales.PublicarMercadoLibre ? false : true);
    };

    $scope.SetWebService = function () {
        if ($scope.connectWS)
            $scope.InmueblePortales.PublicarPaxzu = ($scope.InmueblePortales.PublicarPaxzu ? false : true);
    };

    $scope.SetCienCuadras = function () {
        if ($scope.connectCC)
            $scope.InmueblePortales.PublicarCienCuadras = ($scope.InmueblePortales.PublicarCienCuadras ? false : true);
    };

    $scope.SetMetroCuadrado = function () {
        if ($scope.connectMC)
            $scope.InmueblePortales.PublicarMetroCuadrado = ($scope.InmueblePortales.PublicarMetroCuadrado ? false : true);
    };

    $scope.DescargarInventarioReciboCargado = function (item) {
        $scope.viewer.Open(item.RutaInventario);
    };

    $scope.DescargarInventarioRecibo = function (item) {
        $scope.viewer.Open($scope.serviceBaseGBI + "PDFs/DocumentoB?TipoDocumentoID=19&UniqueID=" + item.InventarioUniqueID);
    };

    window.Scope = $scope;
}]);