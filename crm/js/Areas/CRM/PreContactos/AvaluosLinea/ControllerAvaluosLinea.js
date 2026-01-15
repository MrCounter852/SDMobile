ERP.controller("ControllerAvaluosLinea", ['$scope', '$timeout', '$q', 'Services', '$filter', 'alertify', function ($scope, $timeout, $q, Services, $filter, alertify) {
    $scope.ModoView = 1;
    
    let _arrayConfigs = $scope.GetConfig("CC_FACTURA,ELEC_ORDEN_COM");
    $scope.CC_FACTURA = $scope.GetConfig("CC_FACTURA", _arrayConfigs);
    $scope.ELEC_ORDEN_COM = $scope.GetConfig("ELEC_ORDEN_COM", _arrayConfigs);

    $scope.viewer = {
        Token: $scope.Usuario.Token
    };

    $scope.AtrasModoView = function () {
        $scope.ModoView = 1;
        $scope.MostrarHeaderPrincipal(true);
    };

    $scope.PreFactura = {
        TipoOperacionID: 2,
        OrigenFacturaID: 14,
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
        PlantillaDocumentoID:null,
        Observaciones: null,
        PSE: true,
        IncluirSaldoAnterior: false,
        NoFacturar: false,
        CentroCostoID: null,
        CodigoOrigen: $scope.PreContacto.ProcesoID,
        PreFacturasDetalles: [],
        PreFacturasTerceros: []
    };

    $scope.copyPreFactura = angular.copy($scope.PreFactura);

    $scope.PreFacturaDetalle = {
        PreFacturaDetalleID: null,
        ProductoID: null,
        Cantidad: 1,
        ValorUnitario: 0,
        Descuento: 0,
        ModoTexto: false,
        Eliminar: false
    };

    $scope.copyPreFacturaDetalle = angular.copy($scope.PreFacturaDetalle);

    $scope.CerrarProceso = {
        AsesorID: null,
        Estado: null,
        TipoOfertaID:null,
        InmuebleDireccion: null
    };

    $scope.copyCerrarProceso = angular.copy($scope.CerrarProceso);

    $scope.Init = function () {
        $scope.ConsultarCombos();
        angular.forEach($scope.PreContacto.PreFacturas, function (elem) {
            if (elem.PagadaPSE)
                $scope.MostrarCerrarProceso=true
        });
    };

    $scope.AbrirModalCerrarProceso = function () {
        $scope.CerrarProceso = angular.copy($scope.copyCerrarProceso);
        $('#modalCerrarProceso').modal("show");
    };

    $scope.AbrirNuevaPrefactura = function () {
        $scope.PreFactura = angular.copy($scope.copyPreFactura);
        let _tipoPrefactura = $scope.TiposPreFacturas[($scope.TiposPreFacturas.length == 1 ? 0 : 1)];
        $scope.PreFactura.TipoPreFactura = _tipoPrefactura;
        $scope.PreFactura.TipoPreFacturaID = _tipoPrefactura.TipoPreFacturaID
        $scope.Titulo = "NUEVO CUPÓN DE PAGO";
        $scope.MostrarHeaderPrincipal(false);
        $scope.ModoView = 2;
        $scope.IsEditing = false;
    };

    $scope.AbrirEditarPrefactura = function (item) {
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseFAC + "PreFacturas/PreFacturasDetalladoConsultar",
            { PreFacturaID: item.PreFacturaID },
            function (response) {
                $scope.PreFactura = angular.extend({}, response.data);
                if (!$scope.PreFactura.CiudadID)
                    $scope.PreFactura.CiudadID = response.data.CiudadTerceroID
                $scope.CopyProducto = angular.copy($scope.Producto);
                angular.forEach($scope.PreFactura.PreFacturasDetalles, function (elem) {
                    elem.Eliminar = false;
                });
                $scope.CalcularTotalesPreFactura();
                $scope.Titulo = "CUPÓN DE PAGO N° " + $scope.PreFactura.Consecutivo;
                $scope.MostrarHeaderPrincipal(false);
                $scope.ModoView = 2;
                $scope.IsEditing = true;
                $scope.CalcularImpuestos(function (response) {
                    $scope.PreFactura.PreFacturasDetalles = response;
                    $scope.CalcularImpuestosDocumento();
                    $scope.MostrarProgress(false);
                });
                $scope.MostrarProgress(false);

            }
        );
    };

    $scope.AgregarProducto = function () {
        if ($scope.PreFacturaDetalle.Cantidad == undefined || $scope.PreFacturaDetalle.Cantidad == "" || $scope.PreFacturaDetalle.Cantidad == null || $scope.PreFacturaDetalle.Cantidad <= 0) {
            alertify.error("Ingrese una cantidad valida.");
            return false;
        } else if ($scope.PreFacturaDetalle.ProductoNombre == null || $scope.PreFacturaDetalle.ProductoNombre == "") {
            alertify.error("Seleccione un producto.");
            return false;
        } else if ($scope.PreFacturaDetalle.ValorUnitario == undefined || $scope.PreFacturaDetalle.ValorUnitario == "" || $scope.PreFacturaDetalle.ValorUnitario == null || $scope.PreFacturaDetalle.ValorUnitario <= 0) {
            alertify.error("Ingrese el precio unitario.");
            return false;
        } else {
            $scope.PreFactura.PreFacturasDetalles.push(angular.copy($scope.PreFacturaDetalle));
            $scope.PreFacturaDetalle = angular.copy($scope.copyPreFacturaDetalle);
            $scope.CalcularTotalesPreFactura();
            $scope.CalcularImpuestos(function (response) {
                $scope.PreFactura.PreFacturasDetalles = response;
                $scope.CalcularImpuestosDocumento();
                $scope.MostrarProgress(false);
            });
        }
    };

    $scope.EliminarProducto = function (index, producto) {
        alertify.confirm("¿Desea eliminar el producto " + producto.ProductoNombre + "?", function () {
            if ($scope.PreFactura.PreFacturaID == null)
                $scope.PreFactura.PreFacturasDetalles.splice(index, 1);
            else 
                producto.Eliminar = true;

            $scope.CalcularTotalesPreFactura();
            if ($scope.PreFactura.PreFacturasDetalles.length > 0) {
                $scope.MostrarProgress(true);
                $scope.CalcularImpuestos(function (response) {
                    $scope.PreFactura.PreFacturasDetalles = response;
                    $scope.CalcularImpuestosDocumento();
                    $scope.MostrarProgress(false);
                });
            } else {
                $scope.CalcularImpuestosDocumento();
            }
        });
    };

    $scope.BuscarTercero = function () {
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
                    $scope.PreFactura.PreFacturasTerceros.push({
                        TerceroID: _tercero.TerceroID,
                        NombreCompleto: _tercero.NombreCompleto,
                        AbreviaturaDocumento: _tercero.TipoDocumentoAbreviatura,
                        PorcentajeParticipacion: 100,
                        Eliminar:false
                    })
                } else {
                    $scope.PreFactura.ValidacionDocumento = true;
                }
                $scope.MostrarProgress(false);
            }
        );
    };

    $scope.GuardarActualizarPreFactura = function () {
        if ($scope.ValidarPreFactura()) {
            alertify.confirm("¿Desea " + ($scope.PreFactura.PreFacturaID == null ? "crear" : "actualizar") + " el cupón de pago?", function () {
                $scope.MostrarProgress(true);
                for (let i = 0; i < $scope.PreFactura.PreFacturasDetalles.length; i++)
                    $scope.PreFactura.PreFacturasDetalles[i].Orden = i + 1;
                Services.Async(
                    $scope.serviceBaseFAC + ($scope.PreFactura.PreFacturaID == null ? "PreFacturas/PreFacturasInsertar/" : "PreFacturas/PreFacturasActualizar/") ,
                    $scope.PreFactura,
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

    $scope.EliminarPreFactura = function (item) {
        alertify.confirm("¿Desea eliminar el cupón de pago?", function () {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseFAC + "PreFacturas/PreFacturasEliminar/",
                { PreFacturaID: item.PreFacturaID },
                function (response) {
                    alertify.success(response.rows[0].Descripcion);
                    $scope.Sincronizar(function () {
                        $scope.MostrarProgress(false);
                    });
                }
            );
        });
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
        return true;
    };

    $scope.ConsultarCombos = function () {
        new async(
            $scope.serviceBaseFAC + "Facturas/TiposOperacionesConsultar/",
            null,
            function (response) {
                $scope.TiposOperaciones = response.rows;
            }, undefined, false
        );
        new async(
            $scope.serviceBaseFAC + "TiposPreFacturas/TiposPreFacturasConsultar",
            { Rows: 0, Page: 0, SucursalID: $scope.Usuario.SucursalID, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ TipoPreFacturaID: null, Prefijo: " -- Seleccione -- " });
                $scope.TiposPreFacturas = response.rows;
            }, undefined, false
        );       
        new async(
            $scope.serviceBaseFAC + "OrigenesFacturas/OrigenesFacturasConsultar/",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ OrigenFacturaID: null, Nombre: " -- Seleccione -- " });
                $scope.OrigenesFacturas = response.rows;
            }, undefined, false
        );
        new async(
            $scope.serviceBaseSIS + "TipoPersonas/TipoPersonasConsultar/",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ TipoPersonaID: null, Nombre: " -- Seleccione -- " })
                $scope.TipoPersonas = response.rows;
            }, undefined, false
        );
        new async(
            $scope.serviceBaseSIS + "TipoDocumentos/TipoDocumentosConsultar/",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ TipoDocumentoID: null, Nombre: " -- Seleccione -- " })
                $scope.TipoDocumentos = response.rows;
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
            $scope.serviceBaseSIS + "ResponsabilidadesTributarias/ResponsabilidadesTributariasConsultar/",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ ResponsabilidadTributariaID: null, Descripcion: " -- Seleccione -- " });
                $scope.ResponsabilidadesTributarias = response.rows;
            }
        );
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

    $scope.ddlSearchPaises = {
        autoExpand: true
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
            $scope.PreFacturaDetalle.ProductoNombre = item.Nombre;
            $scope.PreFacturaDetalle.ValorUnitario = $scope.PreFacturaDetalle.ValorDiario != null ? $scope.PreFacturaDetalle.ValorDiario : (item.PrecioBase == undefined || item.PrecioBase == null ? item.ValorUnitario : item.PrecioBase);
            $scope.PreFacturaDetalle.Cantidad = $scope.PreFacturaDetalle.Cantidad == null ? 1 : $scope.PreFacturaDetalle.Cantidad;
            $scope.PreFacturaDetalle.Descuento = $scope.PreFacturaDetalle.Descuento == null ? 0 : $scope.PreFacturaDetalle.Descuento;
            $scope.CalcularProductoPreFactura();
        },
        autoExpand: true
    };

    $scope.searchCiudades = function (term, modelID, model, options, PaisID) {
        let deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseSIS + "Ciudades/CiudadesComboConsultar/",
            { Page: options.Page, Rows: options.Rows, CiudadID: modelID, Nombre: term, PaisID: $scope.PreFactura.PaisID, Token: $scope.Usuario.Token },
            function (response) {
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.ddlSearchCiudades = {
        autoExpand: true,
        SyncScroll: true,
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

    $scope.ddlSearchCentroCostoProducto = {
        autoExpand: true,
        FieldBold: "Maestro",
        onSelect: function (item) {
            if (item.CentroCostoID != null) {
                if (item.Maestro) {
                    $scope.PreFactura.CentroCostoID = null;
                    alertify.error("Debe seleccionar un centro de costo no maestro");
                } else {
                    $scope.PreFacturaDetalle.CentroCostoNombre = item.CodigoAcumulado + ' - ' + item.Nombre;
                }
            }
        }
    };
    $scope.searchAsesores = function (term, modelID) {
        let deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseCRM + "Asesores/AsesoresConsultar/",
            { Rows: 20, Page: 1, Activo: true, AsesorID: modelID, SucursalID: modelID ? null : $scope.Usuario.SucursalID, Token: $scope.Usuario.Token, NombreCompleto: term },
            function (response) {
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.AbrirModalDireccion = function () {
        $scope.address.Title = "Dirección del cliente";
        $scope.address.SetDireccionBase($scope.PreFactura.DireccionBase);
        $scope.address.OnSelectAddress = function (_DireccionBase, _Direccion, _Latitud, _Longitud, _LocalidadNombre) {
            $scope.PreFactura.DireccionBase = $scope.address.getDireccionBase();
            $scope.PreFactura.Direccion = _Direccion;
        };
    };

    $scope.CambiarModoProducto = function () {
        if ($scope.PreFacturaDetalle.ModoTexto == true)
            $scope.PreFacturaDetalle.ModoTexto = false;
        else
            $scope.PreFacturaDetalle.ModoTexto = true;
    };

    $scope.CalcularProductoPreFactura = function (_item) {
        if (_item != undefined) {
            if ($scope.TimeOutImpuesto)
                $timeout.cancel($scope.TimeOutImpuesto);
            $scope.TimeOutImpuesto = $timeout(function () {
                let cantidad = _item.Cantidad == null ? 0 : _item.Cantidad;
                let valorUnitario = _item.ValorUnitario == null ? 0 : _item.ValorUnitario;
                let descuento = _item.Descuento == null ? 0 : _item.Descuento;
                _item.ValorTotal = $scope.RedondearConDecimal(cantidad * valorUnitario, $scope.PreFactura.TipoPreFactura.NumeroDecimales) - descuento;
                $scope.CalcularImpuestos(function (response) {
                    $scope.PreFactura.PreFacturasDetalles = response;
                    $scope.CalcularImpuestosDocumento();
                }, false);
            }, 1000);
        } else if ($scope.PreFacturaDetalle != undefined) {
            let cantidad = $scope.PreFacturaDetalle.Cantidad == null ? 0 : $scope.PreFacturaDetalle.Cantidad;
            let valorUnitario = $scope.PreFacturaDetalle.ValorUnitario == null ? 0 : $scope.PreFacturaDetalle.ValorUnitario;
            let Descuento = $scope.PreFacturaDetalle.Descuento == null ? 0 : $scope.PreFacturaDetalle.Descuento;
            $scope.PreFacturaDetalle.ValorTotal = $scope.RedondearConDecimal(cantidad * valorUnitario, $scope.PreFactura.TipoPreFactura.NumeroDecimales) - Descuento;
         }
    };

    $scope.CalcularTotalesPreFactura = function () {        
        $scope.PreFactura.ValorTotal = 0;        
        angular.forEach($scope.PreFactura.PreFacturasDetalles, function (producto) {
            if (producto.Eliminar == false) {
                $scope.PreFactura.ValorTotal += producto.ValorTotal;
            }
        });
    };

    $scope.RedondearConDecimal = function (numero, decimales) {
        const factor = Math.pow(10, decimales);
        return Math.round(numero * factor) / factor;
    };

    $scope.ChangeTipoPrefactura = function () {
        let array = $filter("filter")($scope.TiposPreFacturas, function (elem) { return elem.TipoPreFacturaID == $scope.PreFactura.TipoPreFacturaID }, true);
        if (array.length > 0)
            $scope.PreFactura.Prefijo = array[0];
        else
            $scope.PreFactura.TipoPreFactura = {
                NumeroDecimalesCantidad: 0,
                NumeroDecimales: 0,
                Prefijo: "xxxx"
            };
        if ($filter("filter")($scope.PreFactura.PreFacturasDetalles, function (elem) { return elem.Eliminar == false }, true).length > 0) {
            angular.forEach($scope.PreFactura.PreFacturasDetalles, function (elem) {
                elem.Cantidad = $scope.RedondearConDecimal(elem.Cantidad, $scope.PreFactura.TipoPreFactura.NumeroDecimalesCantidad);
                if (elem.ValorDiario != null && isNaN(elem.ValorDiario) == false)
                    elem.ValorDiario = $scope.RedondearConDecimal(elem.ValorDiario, $scope.PreFactura.TipoPreFactura.NumeroDecimales);
                if (elem.ValorUnitario != null && isNaN(elem.ValorUnitario) == false)
                    elem.ValorUnitario = $scope.RedondearConDecimal(elem.ValorUnitario, $scope.PreFactura.TipoPreFactura.NumeroDecimales);
                let cantidad = elem.Cantidad == null ? 0 : elem.Cantidad;
                let valorUnitario = elem.ValorUnitario == null ? 0 : elem.ValorUnitario;
                let descuento = elem.Descuento == null ? 0 : elem.Descuento;
                let cantidadTiempo = elem.CantidadTiempo;
                let valorDiario = elem.ValorDiario;
                if ($scope.PreFactura.OrigenFacturaID == 4) {
                    if (cantidadTiempo != undefined && cantidadTiempo != null && valorDiario != undefined && valorDiario != null) {
                        valorUnitario = cantidadTiempo * valorDiario;
                        elem.ValorUnitario = valorUnitario;
                    } else {
                        elem.ValorUnitario = valorDiario;
                        valorUnitario = valorDiario;
                    }
                }
                elem.ValorTotal = (cantidad * valorUnitario) - descuento;
            });
            
            $scope.MostrarProgress(true);
            $scope.CalcularImpuestos(function (response) {
                $scope.PreFactura.PreFacturasDetalles = response;
                $scope.CalcularImpuestosDocumento();
                $scope.MostrarProgress(false);
            });
        }
    };

    $scope.CalcularImpuestos = function (OnSuccess, _async) {
        if (_async == undefined)
            _async = true;
        if (_async == true) {
            Services.Async(
                $scope.serviceBaseSIS + "Impuestos/CalcularImpuestosProductosPreFacturas",
                {
                    PreFacturasDetalles: $scope.PreFactura.PreFacturasDetalles,
                    ClienteCiudadID: $scope.PreFactura.CiudadID,
                    ClienteTipoPersonaID: $scope.PreFactura.TipoPersonaID,
                    ClienteResponsabilidadTributariaID: $scope.PreFactura.ResponsabilidadTributariaID,
                    TipoOperacionID: $scope.PreFactura.TipoOperacionID
                },
                function (response) {
                    OnSuccess(response);
                }
            );
        } else {
            new async(
                $scope.serviceBaseSIS + "Impuestos/CalcularImpuestosProductosPreFacturas",
                {
                    PreFacturasDetalles: $scope.PreFactura.PreFacturasDetalles,
                    ClienteCiudadID: $scope.PreFactura.CiudadID,
                    ClienteTipoPersonaID: $scope.PreFactura.TipoPersonaID,
                    ClienteResponsabilidadTributariaID: $scope.PreFactura.ResponsabilidadTributariaID,
                    TipoOperacionID: $scope.PreFactura.TipoOperacionID
                },
                function (response) {
                    OnSuccess(response);
                }, undefined, false
            );
        }
    };
    $scope.CalcularImpuestosDocumento = function () {
        $scope.PreFactura.ValorNeto = 0;
        $scope.PreFactura.ValorTotal = 0;
        $scope.PreFactura.Impuestos = [];
        $scope.PreFactura.ValorImpuestos = 0;
        let _index = 0;
        angular.forEach($scope.PreFactura.PreFacturasDetalles, function (producto) {
            if (producto.Eliminar == false) {
                _index++;
                producto.$index = _index;
                $scope.PreFactura.ValorNeto += producto.ValorTotal;
                angular.forEach(producto.Impuestos, function (impuesto) {
                    if (impuesto.Eliminar == false) {
                        $scope.PreFactura.ValorImpuestos += impuesto.ValorImpuesto;
                        if ($filter('filter')($scope.PreFactura.Impuestos, function (value) { return value.ImpuestoID == impuesto.ImpuestoID; }, true).length > 0) {
                            angular.forEach($scope.PreFactura.Impuestos, function (value, key) {
                                if (value.ImpuestoID == impuesto.ImpuestoID)
                                    value.ValorImpuesto += impuesto.ValorImpuesto;
                            });
                        } else
                            $scope.PreFactura.Impuestos.push(angular.copy(impuesto));
                    }
                });
            }
        });
        $scope.PreFactura.ValorTotal = $scope.PreFactura.ValorNeto + $scope.PreFactura.ValorImpuestos;
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
        if (($scope.CerrarProceso.AsesorID == undefined || $scope.CerrarProceso.AsesorID == "" || $scope.CerrarProceso.AsesorID == null ) && $scope.CerrarProceso.Estado) {
            alertify.error("El asesor es obligatorio.");
            return false;
        } else if (($scope.CerrarProceso.TipoOfertaID == undefined || $scope.CerrarProceso.TipoOfertaID == "" || $scope.CerrarProceso.TipoOfertaID == null ) && $scope.CerrarProceso.Estado) {
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
                        $scope.Sincronizar(function () {
                            $scope.MostrarProgress(false);
                        });
                    }
                );
            });
        }
    };
    $scope.MenuPreFacturas = [
        {
            text: '<i class="fad fa-print red"></i>&nbsp;&nbsp;Ver PDF',
            click: function ($itemScope) {
                $scope.viewer.Open('API_FAC/api/PDFs/DocumentoD?TipoDocumentoID=4&DocumentoID=' + $itemScope.item.PreFacturaID)
            }
        },{
            text: '<i class="fal fa-edit blue"></i>&nbsp;&nbsp;Editar',
            click: function ($itemScope) {
                $scope.AbrirEditarPrefactura($itemScope.item);
            }
        },
        {
            text: '<i class="fal fa-trash-alt red"></i>&nbsp;&nbsp;Eliminar',
            click: function ($itemScope) {
                $scope.EliminarPreFactura($itemScope.item);
            }
        }
    ];
    $scope.SetField = function (field, obj) {
        $scope[field] = obj;
    };
}]);