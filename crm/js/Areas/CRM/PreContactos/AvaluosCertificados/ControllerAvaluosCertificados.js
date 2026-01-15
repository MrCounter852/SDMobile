ERP.controller("ControllerAvaluosCertificados", ['$scope', '$timeout', '$q', 'Services', '$filter', 'alertify', function ($scope, $timeout, $q, Services, $filter, alertify) {    
    $scope.MailModel = {};
    $scope.ModoView = 1;

    let _arrayConfigs = $scope.GetConfig("CC_FACTURA,ELEC_ORDEN_COM");
    $scope.CC_FACTURA = $scope.GetConfig("CC_FACTURA", _arrayConfigs);

    $scope.MailOptions = {        
        Title: "Enviar documento por correo electronico",
        RefScope: $scope,
        CargarFirma: true,
        TipoFirmaID: 7,
    };

    $scope.viewer = {
        Token: $scope.Usuario.Token
    };

    $scope.AtrasModoView = function () {
        $scope.ModoView = 1;
        $scope.MostrarHeaderPrincipal(true);
    };

    $scope.PreFactura = {
        TipoOperacionID: 2,
        OrigenFacturaID: 13,
        CodigoOrigen: null,
        TipoPreFacturaID: null,
        TerceroID: null,
        TipoDocumentoID: null,
        TipoPersonaID: null,
        Nombres: null,
        Nombres2: null,
        Apellidos: null,
        Apellidos2: null,
        Email: null,
        Celular: null,
        ResponsabilidadTributariaID: null,
        ValidacionDocumento: false,
        FechaCreacion: moment().format("DD/MM/YYYY"),
        FechaVencimiento: moment().add(30, 'days').format("DD/MM/YYYY"),
        PlantillaDocumentoID: null,
        Observaciones: null,
        PSE: true,
        IncluirSaldoAnterior: false,
        NoFacturar: false,
        CentroCostoID: null,
        CodigoOrigen: null,
        DividirPreFactura: false,
        PorcentajePrefactura1: null,
        PorcentajePrefactura2:null,
        PreFacturasDetalles: []
    };

    $scope.copyPreFactura = angular.copy($scope.PreFactura);

    $scope.CerrarProceso = {
        AsesorID: null,
        Estado: null,
        TipoOfertaID: null,
        InmuebleDireccion: null
    };

    $scope.copyCerrarProceso = angular.copy($scope.CerrarProceso);

    $scope.Init = function () {
        $scope.ConsultarCombos();
        if ($scope.PreContacto.PreFacturasCotizaciones.length > 0) {
            $scope.MostrarCerrarProceso = true
            $scope.MostrarReversarCupones = true
        }
        angular.forEach($scope.PreContacto.PreFacturasCotizaciones, function (elem) {
            if (!elem.PagadaPSE)
                $scope.MostrarCerrarProceso = false
            if (elem.PagadaPSE)
                $scope.MostrarReversarCupones = false
        });
    };

    $scope.AbrirModalDireccion = function () {
        $scope.address.Title = "Dirección del cliente";
        $scope.address.SetDireccionBase($scope.PreFactura.DireccionBase);
        $scope.address.OnSelectAddress = function (_DireccionBase, _Direccion, _Latitud, _Longitud, _LocalidadNombre) {
            $scope.PreFactura.DireccionBase = $scope.address.getDireccionBase();
            $scope.PreFactura.Direccion = _Direccion;
        };
    };

    $scope.ConsultarCombos = function () {
        new async(
            $scope.serviceBaseFAC + "TiposPreFacturas/TiposPreFacturasConsultar",
            { Rows: 0, Page: 0, SucursalID: $scope.Usuario.SucursalID, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ TipoPreFacturaID: null, Prefijo: " -- Seleccione -- " });
                $scope.TiposPreFacturas = response.rows;
            }, undefined, false
        );        
        new async(
            $scope.serviceBaseGBI + "TiposOfertas/TiposOfertasConsultar/",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                $scope.TiposOfertas = response.rows;
                $scope.TiposOfertas.unshift({ TipoOfertaID: null, Nombre: " -- Seleccione -- " });
            }, undefined, false
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
            ValorUnitarioDescuento: 0,
            ModoTexto: false,
            Impuestos: [],
            Eliminar: false
        };
        $scope.CopyProducto = angular.copy($scope.Producto);
        $scope.Titulo = "NUEVA COTIZACIÓN";
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
        },
        autoExpand: true
    };

    $scope.searchCentroCosto = function (term, modelID) {
        var deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseFIN + "CentrosCostos/CentrosCostosPlanoConsultar/",
            { Page: 1, Rows: 30, CentroCostoID: modelID, CodigoNombre: term, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ CentroCostoID: null, CodigoNombre: "Ninguno" });
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.ddlSearchCentroCosto = {
        autoExpand: true,
        FieldBold: "Maestro",
        onSelect: function (item) {
            if (item.CentroCostoID != null) {
                if (item.Maestro) {
                    $scope.PreFactura.CentroCostoID = null;
                    alertify.error("Debe seleccionar un centro de costo no maestro");
                } else {
                    $scope.PreFactura.CentroCostoNombre = item.CodigoAcumulado + ' - ' + item.Nombre;
                }
            } else {
                $scope.PreFactura.CentroCostoNombre = null;
            }
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
    $scope.AbrirModalCerrarProceso = function () {
        $scope.CerrarProceso = angular.copy($scope.copyCerrarProceso);
        $('#modalCerrarProceso').modal("show");
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
                $scope.Titulo = "COTIZACIÓN N° " + $scope.Cotizacion.Consecutivo;
                $scope.MostrarHeaderPrincipal(false);
                $scope.ModoView = 2;
                $scope.MostrarProgress(false);
            }
        );
    };

    $scope.AbrirModalMailCotizacion = function (elem) {
        $scope.MailModel.Asunto = "Cotización N°." + elem.Consecutivo + " " + $scope.PreContacto.NombreCompleto;
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

    $scope.EliminarCotizacion = function (item) {
        alertify.confirm("¿Desea eliminar la cotizacion N°." + item.Consecutivo + "?", function () {
            $scope.MostrarProgress(true);
            item.DirIP = $scope.Usuario.Ip;
            item.Usuario = $scope.Usuario.UsuarioID;
            item.Token = $scope.Usuario.Token;
            Services.Async(
                $scope.serviceBaseSIS + "Cotizaciones/CotizacionesEliminar/",
                item,
                function (response) {
                    alertify.success(response.rows[0].Descripcion);
                    $scope.Sincronizar(function () {
                        $scope.MostrarProgress(false);
                    });
                }
            );
        });
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
        if ($scope.Cotizacion.FechaElaboracion == undefined || $scope.Cotizacion.FechaElaboracion == null || $scope.Cotizacion.FechaElaboracion == "") {
            alertify.error("La fecha es obligatoria.");
            return false;
        }
        if ($scope.Cotizacion.PlantillaDocumentoID == undefined || $scope.Cotizacion.PlantillaDocumentoID == null || $scope.Cotizacion.PlantillaDocumentoID == "") {
            alertify.error("La plantilla de la cotización es obligatoria.");
            return false;
        }
        if ($filter("filter")($scope.Cotizacion.CotizacionesProductos, function (elem) { return elem.Eliminar == false }, true).length == 0) {
            alertify.error("La cotización requiere por lo menos un detalle.");
            return false;
        }
        return true;
    };
    $scope.CambiarEstadoProceso = function (condicion) {
        if (condicion)
            $scope.CerrarProceso.Estado = true
        else {
            $scope.CerrarProceso = angular.copy($scope.copyCerrarProceso);
            $scope.CerrarProceso.Estado = false
        }
    };
    $scope.GuardarCerrarProceso = function () {
        if (($scope.CerrarProceso.AsesorID == undefined || $scope.CerrarProceso.AsesorID == "" || $scope.CerrarProceso.AsesorID == null) && $scope.CerrarProceso.Estado) {
            alertify.error("El asesor es obligatorio.");
            return false;
        } else if (($scope.CerrarProceso.TipoOfertaID == undefined || $scope.CerrarProceso.TipoOfertaID == "" || $scope.CerrarProceso.TipoOfertaID == null) && $scope.CerrarProceso.Estado) {
            alertify.error("El tipo de oferta es obligatorio.");
            return false;
        } else if (($scope.CerrarProceso.InmuebleDireccion == undefined || $scope.CerrarProceso.InmuebleDireccion == "" || $scope.CerrarProceso.InmuebleDireccion == null) && $scope.CerrarProceso.Estado) {
            alertify.error("La direccion del inmueble es obligatoria");
            return false;
        } else {
            alertify.confirm("¿Desea cerrar el proceso?", function () {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseFAC + "PreFacturas/PreFacturasEliminar/",
                    $scope.CerrarProceso,
                    function (response) {
                        alertify.success(response.rows[0].Descripcion);
                        $('#modalCerrarProceso').modal("hide");
                        $scope.Sincronizar(function () {
                            $scope.MostrarProgress(false);
                        });
                    }
                );
            });
        }
    };
    $scope.MenuCotizaciones = [
        {
            text: '<i class="fal fa-file-invoice-dollar blue"></i>&nbsp;&nbsp;Documento PDF',
            click: function ($itemScope) {
                $scope.visualizarCotizacionAvaluo($itemScope.item);
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
            },
            displayed: function ($itemScope) {
                let validador = true
                angular.forEach($scope.PreContacto.PreFacturasCotizaciones, function (elem) {
                    if (elem.CodigoOrigen == $itemScope.item.CotizacionID)
                        validador = false
                });
                return $itemScope.item.Aprobada && validador;
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
                return $itemScope.item.Aprobada == false || $itemScope.item.Aprobada == null;
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
                let validador = true
                angular.forEach($scope.PreContacto.PreFacturasCotizaciones, function (elem) {
                    if (elem.CodigoOrigen == $itemScope.item.CotizacionID)
                        validador = false
                });
                return $itemScope.item.Aprobada  && validador;
            }
        },
        {
            text: '<i class="fal fa-trash-alt red"></i>&nbsp;&nbsp;Eliminar',
            click: function ($itemScope) {
                $scope.EliminarCotizacion($itemScope.item);
            }
        },
        {
            text: '<i class="fal fa-file-invoice-dollar orange"></i>&nbsp;&nbsp;Generar cupón de pago',
            click: function ($itemScope) {
                $scope.AbrirModalPreFactura($itemScope.item);
            },
            displayed: function ($itemScope) {
                let validador = true
                angular.forEach($scope.PreContacto.PreFacturasCotizaciones, function (elem) {
                    if (elem.CodigoOrigen == $itemScope.item.CotizacionID)
                        validador = false
                });
                return $itemScope.item.Aprobado == true && validador;
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
        },
        {
            text: '<i class="fab fa-whatsapp green"></i>&nbsp;&nbsp;Enviar cotización por whatsApp',
            click: function ($itemScope) {
                window.open("https://api.whatsapp.com/send?phone=57" + $scope.PreContacto.Celular + "&text=A+continuación+encontraras+en+el+siguiente+link+la+cotización+N°.+" + $itemScope.item.Consecutivo + "+donde+ofrecemos+toda+nuestra+gama+de+productos.+L\nink+-->+" + window.location.origin + "/Cotizaciones/Visor?UniqueID=" + $itemScope.item.UniqueID);
            }
        }
    ];

    $scope.visualizarCotizacionAvaluo = function (item) {
        $scope.viewer.Open(window.location.origin + '/Cotizaciones/VisorInteractivas?UniqueID=' + item.UniqueID + '&CV=false', false);
    };

    $scope.AbrirModalPreFactura = function (item) {
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseSIS + "Cotizaciones/CotizacionDetalladoConsultar/",
            { CotizacionID: item.CotizacionID, Token: $scope.Usuario.Token },
            function (response) {
                $scope.PreFactura = angular.copy($scope.copyPreFactura)
                $scope.PreFactura.CodigoOrigen = response.data.CotizacionID
                $scope.PreFactura.TipoDocumentoID = response.data.ClienteTipoDocumentoID
                $scope.PreFactura.Documento = response.data.ClienteDocumento
                $scope.PreFactura.TipoPersonaID = response.data.ClienteTipoPersonaID
                $scope.PreFactura.ResponsabilidadTributariaID = response.data.ClienteResponsabilidadTributariaID
                $scope.PreFactura.Nombres = response.data.ClienteNombres ? response.data.ClienteNombres.toUpperCase() : null
                $scope.PreFactura.Nombres2 = response.data.ClienteNombres2 ? response.data.ClienteNombres2.toUpperCase() : null
                $scope.PreFactura.Apellidos = response.data.ClienteApellidos ? response.data.ClienteApellidos.toUpperCase() : null
                $scope.PreFactura.Apellidos2 = response.data.ClienteApellidos2 ? response.data.ClienteApellidos2.toUpperCase() : null
                $scope.PreFactura.NombreComercial = response.data.ClienteNombreComercial
                $scope.PreFactura.PaisID = response.data.ClientePaisID
                $scope.PreFactura.Direccion = response.data.ClienteDireccion 
                $scope.PreFactura.Email = response.data.ClienteEmail
                $scope.PreFactura.Celular = response.data.ClienteCelular
                $scope.PreFactura.EmailFacturacionElectronica = response.data.ClienteEmailFacturacionElectronica
                $scope.PreFactura.Telefono = response.data.ClienteTelefono
                angular.forEach(response.data.CotizacionesProductos, function (elem) {
                    elem.ProductoNombre = elem.Descripcion
                    elem.Descuento = elem.ValorUnitarioDescuento
                });
                $scope.PreFactura.PreFacturasDetalles = angular.copy(response.data.CotizacionesProductos)
                $scope.Titulo = "GENERAR CUPÓN DE PAGO";
                $scope.MostrarHeaderPrincipal(false);
                $scope.ModoView = 3;
                $scope.MostrarProgress(false);
            }
        );
    };

    $scope.BuscarTercero = function (Cotizacion) {
        let _Documento, _TipoDocumentoID;
        _Documento = Cotizacion.ClienteDocumento;
        _TipoDocumentoID = Cotizacion.ClienteTipoDocumentoID;
        if (_Documento == undefined || _Documento == null || _Documento == "") {
            alertify.error("El documento es obligatorio.");
            return;
        }
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseSIS + "Terceros/TerceroDetalladoConsultar/",
            { Token: $scope.Usuario.Token, TipoDocumentoID: _TipoDocumentoID, Documento: _Documento },
            function (response) {
                if (response.data.TerceroID != undefined) {
                    let _tercero = response.data;
                    Cotizacion.ClienteTerceroID = _tercero.TerceroID;
                    Cotizacion.ClienteTipoDocumentoID = _tercero.TipoDocumentoID;
                    Cotizacion.ClienteTipoPersonaID = _tercero.TipoPersonaID;
                    Cotizacion.ClienteNombres = _tercero.Nombres;
                    Cotizacion.ClienteNombres2 = _tercero.Nombres2;
                    Cotizacion.ClienteApellidos = _tercero.Apellidos;
                    Cotizacion.ClienteApellidos2 = _tercero.Apellidos2;
                    Cotizacion.ClienteEmail = _tercero.Email;
                    Cotizacion.ClienteCelular = _tercero.Celular;
                    Cotizacion.ClienteResponsabilidadTributariaID = _tercero.ResponsabilidadTributariaID;
                    Cotizacion.ClienteValidacionDocumento = true;
                } else {
                    $scope.PreFactura.ValidacionDocumento = true;
                }
                $scope.MostrarProgress(false);
            }
        );
    };

    $scope.BuscarTerceroPreFactura = function () {
        let _Documento, _TipoDocumentoID;
        _Documento = $scope.PreFactura.Documento;
        _TipoDocumentoID = $scope.PreFactura.TipoDocumentoID;
        if (_Documento == undefined || _Documento == null || _Documento == "") {
            alertify.error("El documento es obligatorio.");
            return;
        }
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseSIS + "Terceros/TerceroDetalladoConsultar/",
            { Token: $scope.Usuario.Token, TipoDocumentoID: _TipoDocumentoID, Documento: _Documento },
            function (response) {
                if (response.data.TerceroID != undefined) {
                    let _tercero = response.data;
                    $scope.PreFactura.TerceroID = _tercero.TerceroID;
                    $scope.PreFactura.TipoDocumentoID = _tercero.TipoDocumentoID;
                    $scope.PreFactura.TipoPersonaID = _tercero.TipoPersonaID;
                    $scope.PreFactura.Nombres = _tercero.Nombres;
                    $scope.PreFactura.Nombres2 = _tercero.Nombres2;
                    $scope.PreFactura.Apellidos = _tercero.Apellidos;
                    $scope.PreFactura.Apellidos2 = _tercero.Apellidos2;
                    $scope.PreFactura.Email = _tercero.Email;
                    $scope.PreFactura.EmailFacturacionElectronica = _tercero.EmailFacturacionElectronica;
                    $scope.PreFactura.Direccion = _tercero.Direccion;
                    $scope.PreFactura.DireccionBase = _tercero.DireccionBase;
                    $scope.PreFactura.NombreComercial = _tercero.NombreComercial;
                    $scope.PreFactura.PaisID = _tercero.PaisID;
                    $scope.PreFactura.CiudadID = _tercero.CiudadID;
                    $scope.PreFactura.Celular = _tercero.Celular;
                    $scope.PreFactura.ResponsabilidadTributariaID = _tercero.ResponsabilidadTributariaID;
                    $scope.PreFactura.ValidacionDocumento = true;
                    $scope.PreFactura.PreFacturasTerceros=[]
                    $scope.PreFactura.PreFacturasTerceros.push({
                        FacturaTerceroID: null,
                        TerceroID: _tercero.TerceroID,
                        NombreCompleto: _tercero.NombreCompleto,
                        AbreviaturaDocumento: _tercero.TipoDocumentoAbreviatura,
                        PorcentajeParticipacion: 100,
                        Eliminar: false
                    });
                } else {
                    $scope.PreFactura.ValidacionDocumento = true;
                }
                $scope.MostrarProgress(false);
            }
        );
    };

    $scope.searchCiudades = function (term, modelID) {
        let deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseSIS + "Ciudades/CiudadesComboConsultar/",
            { Page: 1, Rows: 30, Nombre: term, CiudadID: modelID, PaisID: $scope.PreFactura.PaisID, Token: $scope.Usuario.Token },
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
            $scope.PreFactura.PaisCodigoISO = (item.CodigoISO == null ? "" : item.CodigoISO).toLowerCase();
            if ($scope.PreFactura.PaisCodigoISO != 'co')
                $scope.PreFactura.CiudadID = null;
        }
    };

    $scope.ValidarPreFactura = function () {
        if ($scope.PreFactura.TipoDocumentoID == undefined || $scope.PreFactura.TipoDocumentoID == null || $scope.PreFactura.TipoDocumentoID == "") {
            alertify.error("El tipo de documento es obligatorio.");
            return false;
        }
        if ($scope.PreFactura.Documento == undefined || $scope.PreFactura.Documento == null || $scope.PreFactura.Documento == "") {
            alertify.error("El documento es obligatorio.");
            return false;
        }
        if ($scope.PreFactura.TipoPersonaID == undefined || $scope.PreFactura.TipoPersonaID == null || $scope.PreFactura.TipoPersonaID == "") {
            alertify.error("El tipo de persona es obligatorio.");
            return false;
        }
        if ($scope.PreFactura.ResponsabilidadTributariaID == undefined || $scope.PreFactura.ResponsabilidadTributariaID == null || $scope.PreFactura.ResponsabilidadTributariaID == "") {
            alertify.error("La responsabilidad tributaria es obligatoria.");
            return false;
        }
        if ($scope.PreFactura.Nombres == undefined || $scope.PreFactura.Nombres == null || $scope.PreFactura.Nombres == "") {
            alertify.error("El nombre es obligatorio.");
            return false;
        }
        if (($scope.PreFactura.Apellidos == undefined || $scope.PreFactura.Apellidos == null || $scope.PreFactura.Apellidos == "") && $scope.PreFactura.TipoPersonaID == 1) {
            alertify.error("El primer apellido es obligatorio.");
            return false;
        }
        if ($scope.PreFactura.EmailFacturacionElectronica == undefined || $scope.PreFactura.EmailFacturacionElectronica == null || $scope.PreFactura.EmailFacturacionElectronica == "") {
            alertify.error("El email para facturación electronica es obligatorio.");
            return false;
        }
        if ($scope.PreFactura.OrigenFacturaID == undefined || $scope.PreFactura.OrigenFacturaID == null || $scope.PreFactura.OrigenFacturaID == "") {
            alertify.error("El origen de factura es obligatorio.");
            return false;
        }
        if ($scope.PreFactura.FechaCreacion == undefined || $scope.PreFactura.FechaCreacion == null || $scope.PreFactura.FechaCreacion == "") {
            alertify.error("La fecha de emisión es obligatoria.");
            return false;
        }
        if ($scope.PreFactura.FechaVencimiento == undefined || $scope.PreFactura.FechaVencimiento == null || $scope.PreFactura.FechaVencimiento == "") {
            alertify.error("La fecha de vencimiento es obligatoria.");
            return false;
        }
        if ($scope.PreFactura.TipoPreFacturaID == undefined || $scope.PreFactura.TipoPreFacturaID == null || $scope.PreFactura.TipoPreFacturaID == "") {
            alertify.error("El tipo de prefactura es requerido.");
            return false;
        }       
        if (($scope.PreFactura.PorcentajePrefactura1 == undefined || $scope.PreFactura.PorcentajePrefactura1 == null || $scope.PreFactura.PorcentajePrefactura1 == "") && $scope.PreFactura.DividirPreFactura) {
            alertify.error("El porcentaje 1 para la división es requerido.");
            return false;
        }
        if (($scope.PreFactura.PorcentajePrefactura2 == undefined || $scope.PreFactura.PorcentajePrefactura2 == null || $scope.PreFactura.PorcentajePrefactura2 == "") && $scope.PreFactura.DividirPreFactura) {
            alertify.error("El porcentaje 2 para la división es requerido.");
            return false;
        }
        if (($scope.PreFactura.PorcentajePrefactura1 + $scope.PreFactura.PorcentajePrefactura2 != 100 ) && $scope.PreFactura.DividirPreFactura) {
            alertify.error("La suma de los porcentajes de división debe ser 100%.");
            return false;
        }
        return true;
    };

    $scope.GenerarPreFactura = function () {
        if ($scope.ValidarPreFactura()) {
            alertify.confirm("¿Desea generar el cupón de pago?", function () {
                $scope.MostrarProgress(true);
                if (!$scope.PreFactura.DividirPreFactura) {
                    $scope.GuardarPreFactura($scope.PreFactura,null)
                } else {
                    let PreFactura1 = angular.copy($scope.PreFactura)
                    let PreFactura2 = angular.copy($scope.PreFactura)
                    angular.forEach(PreFactura1.PreFacturasDetalles, function (elem) {
                        elem.ValorUnitario = (elem.ValorUnitario * $scope.PreFactura.PorcentajePrefactura1) / 100
                        elem.Descuento = (elem.Descuento * $scope.PreFactura.PorcentajePrefactura1) / 100
                        elem.ValorTotal = (elem.Cantidad * elem.ValorUnitario) - elem.Descuento;
                        angular.forEach(elem.Impuestos, function (Impuesto) {
                            Impuesto.ValorImpuesto = (Impuesto.ValorImpuesto * $scope.PreFactura.PorcentajePrefactura1) / 100
                        });
                    });
                    angular.forEach(PreFactura2.PreFacturasDetalles, function (elem) {
                        elem.ValorUnitario = (elem.ValorUnitario * $scope.PreFactura.PorcentajePrefactura2) / 100
                        elem.Descuento = (elem.Descuento * $scope.PreFactura.PorcentajePrefactura2) / 100
                        elem.ValorTotal = (elem.Cantidad * elem.ValorUnitario) - elem.Descuento;
                        angular.forEach(elem.Impuestos, function (Impuesto) {
                            Impuesto.ValorImpuesto = (Impuesto.ValorImpuesto * $scope.PreFactura.PorcentajePrefactura2) / 100
                        });
                    });
                    $scope.GuardarPreFactura(PreFactura1, PreFactura2);
                }
            });
        }
    };
    $scope.GuardarPreFactura = function (PreFactura, PreFactura2) {
        Services.Async(
            $scope.serviceBaseFAC + "PreFacturas/PreFacturasInsertar/",
            PreFactura,
            function (response) {
                if (PreFactura2) {
                    Services.Async(
                        $scope.serviceBaseFAC + "PreFacturas/PreFacturasInsertar/",
                        PreFactura2,
                        function (respuesta) {
                            alertify.success(respuesta.rows[0].Descripcion);
                            $scope.Sincronizar(function () {
                                $scope.AtrasModoView();
                                $scope.PreContacto.ShowPreFacturas = true;
                                $scope.MostrarProgress(false);
                            });
                        }
                    );
                } else {
                    alertify.success(response.rows[0].Descripcion);
                    $scope.Sincronizar(function () {
                        $scope.AtrasModoView();
                        $scope.PreContacto.ShowPreFacturas = true;
                        $scope.MostrarProgress(false);
                    });
                }
                
            }
        );
    };
    $scope.LimpiarPreFactura = function (PreFactura) {
        alertify.confirm("¿Está seguro de limpiar todos los campos de la prefactura?", function () {
            $scope.PreFactura = angular.copy($scope.copyPreFactura)
        });
    };
    $scope.AnularPreFacturas = function () {
        alertify.confirm("¿Está seguro de reversar todos los cupones de pago?", function () {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseFAC + "PreFacturas/PreFacturasAnular/",
                { PreFacturas: $scope.PreContacto.PreFacturasCotizaciones },
                function (response) {
                    alertify.success(response.rows[0].Descripcion);
                    $scope.Sincronizar(function () {
                        $scope.MostrarProgress(false);
                    });
                }
            );

        });
    };

    $scope.SetField = function (field, obj) {
        $scope[field] = obj;
    };
}]);