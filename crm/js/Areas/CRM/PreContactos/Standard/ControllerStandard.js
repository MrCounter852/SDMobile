ERP.controller("ControllerStandard", ['$scope', '$timeout', '$q', 'Services', '$filter', 'alertify', function ($scope, $timeout, $q, Services, $filter, alertify) {    
    $scope.MailModel = {};
    $scope.ModoView = 1;
    $scope.FormasPagos = [];

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

    $scope.Init = function () {
        $scope.ConsultarCombos();        
    };

    $scope.ConsultarCombos = function () {
        Services.Async(
            $scope.serviceBaseFAC + "TiposFacturas/TiposFacturasConsultar",
            { Rows: 0, Page: 0, SucursalID: $scope.Usuario.SucursalID, Token: $scope.Usuario.Token },
            function (response) {
                $scope.TiposFacturas = $filter('filter')(response.rows, function (value) { return value.Activo; }, true);                
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
            $scope.serviceBaseSIS + "FormasPagos/FormasPagosConsultar/",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ FormaPagoID: null, Nombre: " -- Seleccione -- " });
                $scope.FormasPagos = response.rows;
                let _FormaPagoDefecto = $filter("filter")($scope.FormasPagos, function (elem) { return elem.CodigoDIAN == 42 }, true);
                if ($scope.Factura) {
                    if ($scope.Factura.FacturaID == null) {
                        $scope.Factura.FormaPagoID = (_FormaPagoDefecto.length == 0 ? null : _FormaPagoDefecto[0].FormaPagoID);
                    }
                }
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
                    AplicarTributos: true,
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
                        AplicarTributos: true,
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
                        AplicarTributos: true,
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
        $scope.MailModel.Adjuntos = [];
        /*$scope.MailModel.Adjuntos = [{
            Ruta: $scope.serviceBaseCRM + "PDFs/DocumentoB?TipoDocumentoID=1&UniqueID=" + elem.UniqueID + "&Attachment=true",
            Nombre: "Cotizacion_N°_" + elem.Consecutivo + ".pdf",
            NombreArchivo: "Cotizacion_N°_" + elem.Consecutivo + ".pdf",
            Tipo: 2,
            Token: $scope.Usuario.Token
        }];*/
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
        if ($filter("filter")($scope.Cotizacion.CotizacionesProductos, function (elem) { return elem.Eliminar == false }, true).length == 0) {
            alertify.error("La cotización requiere por lo menos un detalle.");
            return false;
        }
        return true;
    };

    $scope.MenuCotizaciones = [
        {
            text: '<i class="fal fa-file-invoice-dollar blue"></i>&nbsp;&nbsp;Documento PDF',
            click: function ($itemScope) {
                $scope.visualizarCotizacion($itemScope.item);
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
                return $itemScope.item.Aprobada;
            }
        },
        {
            text: '<i class="fal fa-trash-alt red"></i>&nbsp;&nbsp;Eliminar',
            click: function ($itemScope) {
                $scope.EliminarCotizacion($itemScope.item);
            }
        },
        {
            text: '<i class="fal fa-file-invoice-dollar orange"></i>&nbsp;&nbsp;Generar factura electronica',
            click: function ($itemScope) {
                $scope.AbrirModalFactura($itemScope.item);
            },
            enabled: function ($itemScope) {
                return $itemScope.item.Aprobado == true;
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

    $scope.MenuDetallesCotizacion = [
        {
            text: '<i class="fab fa-product-hunt font-16"></i>&nbsp;&nbsp;Ir a la configuración del producto',
            click: function ($itemScope) {
                if ($scope.FIN == false)
                    window.open(window.location.origin + "/Productos/ProductosBasico?ProductoID=" + $itemScope.item.ProductoID + "&IsOpener=true");
                else
                    window.open(window.location.origin + "/Productos/CRUD?ProductoID=" + $itemScope.item.ProductoID + "&IsOpener=true");
            },
            enabled: function ($itemScope) {
                return $itemScope.item.ProductoID != null;
            }
        }
    ];

    $scope.visualizarCotizacion = function (item) {
        $scope.viewer.Open(window.location.origin + '/Cotizaciones/VisorInteractivas?UniqueID=' + item.UniqueID + '&CV=false', false);
    };

    $scope.AbrirModalFactura = function (item) {
        if ($filter('filter')($scope.TiposFacturas, function (value) { return value.TipoFacturaID != null; }).length == 0) {
            alertify.error("Antes de crear una factura debe registrar una resolución de facturación.");
            return false;
        }
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseSIS + "Cotizaciones/CotizacionDetalladoConsultar/",
            { CotizacionID: item.CotizacionID, Token: $scope.Usuario.Token },
            function (response) {
                $scope.Factura = angular.extend({}, item, response.data);
                $scope.Factura.DirIP = $scope.Usuario.Ip;
                $scope.Factura.ProcesoID = $scope.PreContacto.ProcesoID;
                $scope.Factura.Usuario = $scope.Usuario.UsuarioID;
                $scope.Factura.Token = $scope.Usuario.Token;
                let _FormaPagoDefecto = $filter("filter")($scope.FormasPagos, function (elem) { return elem.CodigoDIAN == 42 }, true);
                if ($scope.Factura.FormaPagoID == undefined)
                    $scope.Factura.FormaPagoID = (_FormaPagoDefecto.length == 0 ? null : _FormaPagoDefecto[0].FormaPagoID);
                $scope.Factura.TipoFacturaID = $scope.TiposFacturas[0].TipoFacturaID;
                $scope.Factura.TipoFactura = $scope.TiposFacturas[0];
                $scope.Factura.FechaCreacion = moment().format("DD/MM/YYYY");
                $scope.Factura.FechaVencimiento = moment().add($scope.TiposFacturas[0].DiasVencimientoFecha1 == null ? 30 : $scope.TiposFacturas[0].DiasVencimientoFecha1, 'days').format("DD/MM/YYYY");
                $scope.Titulo = "GENERAR FACTURA ELECTRÓNICA";
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
            $scope.Factura.ClientePaisCodigoISO = (item.CodigoISO == null ? "" : item.CodigoISO).toLowerCase();
            if ($scope.Factura.ClientePaisCodigoISO != 'co')
                $scope.Factura.ClienteCiudadID = null;
        }
    };

    $scope.ValidarFactura = function () {          
        if ($scope.Factura.ClienteTipoDocumentoID == undefined || $scope.Factura.ClienteTipoDocumentoID == null) {
            alertify.error("Debe seleccionar un tipo de identificación es obligatorio");
            return false;
        }
        if ($scope.Factura.ClienteDocumento == undefined || $scope.Factura.ClienteDocumento == null || $scope.Factura.ClienteDocumento == "") {
            alertify.error("Debe ingresar un numero de identificación del cliente");
            return false;
        }
        if ($scope.Factura.ClienteTipoPersonaID == undefined || $scope.Factura.ClienteTipoPersonaID == null) {
            alertify.error("El tipo de persona es obligatorio.");
            return false;
        }
        if ($scope.Factura.ClienteNombres == undefined || $scope.Factura.ClienteNombres == null || $scope.Factura.ClienteNombres == "") {
            alertify.error("El nombre del cliente es obligatorio.");
            return false;
        }
        let _empresa = $filter('filter')($scope.TiposPersonas, function (elem) { return elem.TipoPersonaID == $scope.Factura.ClienteTipoPersonaID }, true)[0].Empresa;
        if (_empresa == false) {
            if ($scope.Factura.ClienteApellidos == undefined || $scope.Factura.ClienteApellidos == null || $scope.Factura.ClienteApellidos == "") {
                alertify.error("El apellido del cliente es obligatorio.");
                return false;
            }
        }
        if ($scope.Factura.ClienteCelular == undefined || $scope.Factura.ClienteCelular == null || $scope.Factura.ClienteCelular == "") {
            alertify.error("Debe ingresar el celular del cliente es obligatorio");
            return false;
        }
        if ($scope.Factura.ClienteEmailFacturacionElectronica == undefined || $scope.Factura.ClienteEmailFacturacionElectronica == null || $scope.Factura.ClienteEmailFacturacionElectronica == "") {
            alertify.error("Debe ingresar el email de facturación del cliente es obligatorio");
            return false;
        }
        if ($scope.Factura.ClientePaisID == undefined || $scope.Factura.ClientePaisID == null) {
            alertify.error("El pais del cliente es obligatoria.");
            return false;
        }
        if ($scope.Factura.ClientePaisCodigoISO.toLowerCase() == 'co') {
            if ($scope.Factura.ClienteCiudadID == undefined || $scope.Factura.ClienteCiudadID == null) {
                alertify.error("La ciudad del cliente es obligatoria.");
                return false;
            }
        } else {
            $scope.Factura.ClienteCiudadID = null;
        }
        if ($scope.Factura.FechaCreacion == undefined || $scope.Factura.FechaCreacion == null) {
            alertify.error("La fecha de creación del cupon de pago es obligatoria.");
            return false;
        }
        if ($scope.Factura.FechaVencimiento == undefined || $scope.Factura.FechaVencimiento == null) {
            alertify.error("La fecha de vencimiento del cupon de pago es obligatoria.");
            return false;
        }
        if ($scope.Factura.TipoFacturaID == undefined || $scope.Factura.TipoFacturaID == null) {
            alertify.error("La resolución de facturación es obligatoria.");
            return false;
        }
        return true;
    };

    $scope.GenerarFactura = function () {
        if ($scope.ValidarFactura()) {
            alertify.confirm("¿Desea generar la factura electronica?", function () {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseCRM + "Cotizaciones/GenerarFacturasDesdeCotizacion/",
                    $scope.Factura,
                    function (response) {
                        alertify.success(response.rows[0].Descripcion);
                        $scope.Sincronizar(function () {
                            $scope.AtrasModoView();
                            $scope.PreContacto.ShowFacturas = true;
                            $scope.MostrarProgress(false);                            
                        });
                    }
                );
            });
        }
    };

    $scope.SeleccionarResolucion = function () {
        let item = $filter('filter')($scope.TiposFacturas, function (value) { return value.TipoFacturaID == $scope.Factura.TipoFacturaID; }, true)[0];
        $scope.Factura.TipoFactura = item;
        $scope.Factura.FechaVencimiento = moment().add(item.DiasVencimientoFecha1 == null ? 30 : item.DiasVencimientoFecha1, 'days').format("DD/MM/YYYY");
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

    $scope.SetField = function (field, obj) {
        $scope[field] = obj;
    };
}]);