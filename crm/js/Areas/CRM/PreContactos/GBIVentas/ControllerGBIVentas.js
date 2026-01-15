ERP.controller("ControllerGBIVentas", ['$scope', '$timeout', '$q', 'Services', '$filter', 'alertify', '$window', function ($scope, $timeout, $q, Services, $filter, alertify, $window) {
    $scope.MailModel = {};
    $scope.ModoView = 1;
    $scope.LocalConfigInmuebles = "Config_Inmuebles_" + $scope.Usuario.EmpresaID + "_" + $scope.Usuario.UsuarioID;
    $scope.ActividadPromesa = {};
    $scope.ActividadDesembolso = {};
    $scope.ActividadEscrituracion = {};
    $scope.ConfigInmueble = {
        ValorAdministracion: false,
        Barrio: false,
        Zona: false,
        Estrato: false,
        MetroCuadrado: false,
        FincaRaiz: false,
        MercadoLibre: false,
        Paxzu: false,
        FechaRegistro: false,
        Propietario: false,
        PropietarioCelular: false,
        PropietarioDireccion: false,
        PropietarioEmail: false,
        RestriccionesVisita: false,
        AreaLote: false,
        AreaConstruida: false,
        Chip: false,
        ValorTotal: false,
        EdadInmueble: false,
        Sucursal: false,
        UbicacionLlaves: false,
        Fotos: false
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

    $scope.AtrasModoView = function () {
        if ($scope.ModoView == 2)
            angular.element("#Modo3").attr("class", $scope.ClassesInventario);
        $scope.ModoView = 1;
        $scope.MostrarHeaderPrincipal(true);
    };

    $scope.CargarConfiguraciones = function () {
        Services.Async(
            $scope.serviceBaseGBI + "Configuraciones/ConfiguracionesConsultar",
            $scope.search,
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

    $scope.Init = function () {
        $scope.MostrarProgress(true);
        $scope.CargarConfiguraciones();
        $scope.ConsultarCombos(function () {
            $scope.MostrarProgress(false);
        });
    };

    $scope.ConsultarCombos = function (OnSuccess) {
        Services.Async(
            $scope.serviceBaseGBI + "TiposInmuebles/TiposInmueblesConsultar",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ TipoInmuebleID: null, Nombre: "Todos" });
                $scope.TiposInmuebles = response.rows;
            }
        );
        Services.Async(
            $scope.serviceBaseGBI + "AntiguedadesInmuebles/AntiguedadesInmueblesConsultar/",
            { Token: $scope.Usuario.Token },
            function (response) {
                $scope.AntiguedadesInmuebles = response.rows;
                $scope.AntiguedadesInmuebles.unshift({ AntiguedadInmuebleID: null, Nombre: " -- Seleccione -- " });
            }
        );
        Services.Async(
            $scope.serviceBaseGBI + "InmueblesProcesosProcesos/FormasPagosComprasInmueblesConsultar/",
            { Token: $scope.Usuario.Token },
            function (response) {
                $scope.FormasPagosComprasInmuebles = response.rows;
                $scope.FormasPagosComprasInmuebles.unshift({ FormaPagoCompraInmuebleID: null, Nombre: " -- Seleccione -- " });
            }
        );
        Services.Async(
            $scope.serviceBaseSIS + "TiposCalendariosActividades/TiposCalendariosActividadesConsultar/",
            { Page: 0, Rows: 0, Token: $scope.Usuario.Token },
            function (response) {
                $scope.TiposActividades = response.rows;
                $scope.TiposActividades.unshift({ TipoCalendarioActividadID: null, Nombre: " -- Seleccione -- " });
                if (OnSuccess)
                    OnSuccess();
            }
        );
        Services.Async(
            $scope.serviceBaseGBI + "TarifasComisiones/TarifasComisionesConsultar/",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ TarifaComisionID: null, Nombre: "Sin comisión" });
                $scope.TarifasComisiones = response.rows;
            }
        );
    };

    $scope.AbrirInmueblesInteres = function () {
        $scope.Titulo = "Asociar inmuebles";
        $scope.MostrarHeaderPrincipal(false);
        let _elem = angular.element("#Modo3")
        $scope.ClassesInventario = _elem.attr("class");
        _elem.removeAttr("class");
        $scope.searchInventario = {
            Page: 1,
            Rows: 30,
            TipoOfertaID: 2,
            TipoPreContactoID: 5,
            EstadoInmuebleID: 1,
            TipoInmuebleID: null,
            TipoBusqueda: true,
            SucursalID: $scope.Usuario.SucursalID,
            Token: $scope.Usuario.Token
        };
        $scope.copySearchInventario = angular.copy($scope.searchInventario);
        let _item = $scope.GetLocalStorage($scope.LocalConfigInmuebles);
        if (_item)
            $scope.ConfigInmueble = angular.copy(_item);
        angular.element("#panel-menu-contacto").removeClass("opened").addClass("closed");
        $scope.ChangeTipoBusqueda();
        $scope.ModoView = 2;
    };

    $scope.ChangeTipoBusqueda = function () {
        if ($scope.searchInventario.TipoBusqueda) {
            $scope.searchInventario = angular.copy($scope.copySearchInventario);
            $scope.searchInventario.TipoBusqueda = true;
        } else {
            $scope.searchInventario.TipoOfertaID = $scope.PreContacto.TipoOfertaID;
            //$scope.searchInventario.CondicionInmuebleID = $scope.PreContacto.CondicionInmuebleID;            
            $scope.searchInventario.TipoInmuebleID = $scope.PreContacto.TipoInmuebleID;
            $scope.searchInventario.MinAreaConstruida = $scope.PreContacto.AreaDesde;
            $scope.searchInventario.MaxAreaConstruida = $scope.PreContacto.AreaHasta;
            if ($scope.searchInventario.TipoOfertaID == 1) {
                $scope.searchInventario.MinValorTotal = $scope.PreContacto.PresupuestoDesde;
                $scope.searchInventario.MaxValorTotal = $scope.PreContacto.PresupuestoHasta;
            } else {
                $scope.searchInventario.MinValorVenta = $scope.PreContacto.PresupuestoDesde;
                $scope.searchInventario.MaxValorVenta = $scope.PreContacto.PresupuestoHasta;
            }
            $scope.searchInventario.MinHabitaciones = $scope.PreContacto.Cantidadhabitaciones;
            $scope.searchInventario.MinParqueaderos = $scope.PreContacto.CantidadGarajes;
            $scope.searchInventario.MinBanos = $scope.PreContacto.CantidadBanos;
            let _localidades = "";
            angular.forEach($scope.PreContacto.ProcesosInmobiliariaLocalidades, function (elem) {
                _localidades += elem.LocalidadNombre + ";"
            });
            $scope.searchInventario.Localidad = (_localidades == "" ? null : _localidades);
            $scope.searchInventario.Estrato = ($scope.PreContacto.Estrato1 ? "1;" : "") + ($scope.PreContacto.Estrato2 ? "2;" : "") + ($scope.PreContacto.Estrato3 ? "3;" : "") + ($scope.PreContacto.Estrato4 ? "4;" : "") + ($scope.PreContacto.Estrato5 ? "5;" : "") + ($scope.PreContacto.Estrato6 ? "6;" : "");
            if ($scope.searchInventario.Estrato == "")
                $scope.searchInventario.Estrato = null;
            $scope.searchInventario.AntiguedadInmuebleID = $scope.PreContacto.AntiguedadInmuebleID;
            if ($scope.searchInventario.AntiguedadInmuebleID != null) {
                let _Antiguedad = $filter("filter")($scope.AntiguedadesInmuebles, function (elem) { return elem.AntiguedadInmuebleID == $scope.searchInventario.AntiguedadInmuebleID; }, true);
                if (_Antiguedad.length > 0) {
                    $scope.searchInventario.MinEdadInmueble = _Antiguedad[0].AnosInicio;
                    $scope.searchInventario.MaxEdadInmueble = _Antiguedad[0].AnosFin;
                }
            }
        }
        $scope.ConsultarInventario();
    };

    $scope.AsociarInmueble = function (item) {
        let copySeleccionar = angular.copy(item.Seleccionar);
        Services.Async(
            $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesProcesosAsociar/",
            {
                DirIP: $scope.Usuario.Ip,
                Usuario: $scope.Usuario.UsuarioID,
                ProcesoID: $scope.PreContacto.ProcesoID,
                InmueblesProcesos: [
                    {
                        InmuebleProcesoProcesoID: item.InmuebleProcesoProcesoID,
                        InmuebleProcesoID: item.InmuebleProcesoID,
                        Principal: item.Principal,
                        Eliminar: !item.Seleccionar
                    }
                ],
                Token: $scope.Usuario.Token
            },
            function (response) {
                $scope.PreContacto.InmueblesProcesos = response.rows[0].data;
                angular.forEach($scope.InmueblesDisponibles, function (elem) {
                    let _item = $filter("filter")($scope.PreContacto.InmueblesProcesos, function (elem2) { return elem2.InmuebleProcesoID == elem.InmuebleProcesoID; }, true);
                    if (_item.length > 0) {
                        elem.Principal = _item[0].Principal;
                        elem.InmuebleProcesoID = _item[0].InmuebleProcesoID;
                        elem.InmuebleProcesoProcesoID = _item[0].InmuebleProcesoProcesoID;
                        elem.Seleccionar = true;
                    } else {
                        elem.Principal = false;
                        elem.Seleccionar = false;
                        elem.InmuebleProcesoProcesoID = null;
                    }
                });
            },
            function (response) {
                item.Seleccionar = copySeleccionar;
                angular.forEach($scope.InmueblesDisponibles, function (elem) {
                    let _item = $filter("filter")($scope.PreContacto.InmueblesProcesos, function (elem2) { return elem2.InmuebleProcesoID == elem.InmuebleProcesoID; }, true);
                    if (_item.length > 0) {
                        elem.Principal = _item[0].Principal;
                        elem.InmuebleProcesoID = _item[0].InmuebleProcesoID;
                        elem.InmuebleProcesoProcesoID = _item[0].InmuebleProcesoProcesoID;
                        elem.Seleccionar = true;
                    } else {
                        elem.Principal = false;
                        elem.Seleccionar = false;
                        elem.InmuebleProcesoProcesoID = null;
                    }
                });
            }
        );
    };

    $scope.VerFichaInmueble = function (elem) {
        $scope.viewer.Open(window.location.origin + "/GBI/InmueblesGBI/Visualizar?UniqueID=" + elem.UniqueID);
    };    

    $scope.ConsultarInventario = function (OnSuccess) {
        $scope.MostrarProgress(true);
        let _filtros = angular.copy($scope.searchInventario);
        Services.Async(
            $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesDisponiblesConsultar/",
            _filtros,
            function (response) {
                $scope.InmueblesDisponibles = response.rows;
                if (OnSuccess)
                    OnSuccess();
                $scope.MostrarProgress(false);
            }
        );
    };

    $scope.GlobalOrderInventario = function (field, _event) {
        let _th = angular.element(_event.target).closest("th");
        let _order = null;
        if (_th.hasClass("sort-desc")) {
            _order = "ASC";
            angular.element("thead.thead-frozen tr th").removeClass("sort-desc").removeClass("sort-asc");
            _th.addClass("sort-asc");
        } else {
            _order = "DESC"
            angular.element("thead.thead-frozen tr th").removeClass("sort-desc").removeClass("sort-asc");
            _th.addClass("sort-desc");
        }
        $scope.searchInventario.SortColumn = field;
        $scope.searchInventario.SortDirection = _order;
        $scope.ConsultarInventario();
    };

    $scope.AnteriorInventario = function () {
        if ($scope.searchInventario.Page > 1) {
            $scope.searchInventario.Page--;
            $scope.ConsultarInventario();
        }
    };

    $scope.SiguienteInventario = function (_field) {
        if (($scope.searchInventario.Page * $scope.searchInventario.Rows) < $scope[_field][0].TotalRows) {
            $scope.searchInventario.Page++;
            $scope.ConsultarInventario();
        }
    };

    $scope.GuardarConfiguracion = function (Config, Field) {
        $scope.SetLocalStorage($scope[Config], $scope[Field]);
    };

    $scope.SetLocalStorage = function (_key, _value) {
        $window.localStorage.setItem(_key, JSON.stringify(_value));
    };

    $scope.GetLocalStorage = function (_value) {
        let item = $window.localStorage.getItem(_value);
        if (item == undefined)
            return false;
        try {
            item = JSON.parse(item);
        } catch (e) {
            return false;
        }
        return item;
    };

    $scope.AbrirPanel = function (event) {
        let elem = angular.element(event.currentTarget).closest(".opciones-bottom");
        if (elem.hasClass("opened"))
            elem.removeClass("opened").addClass("closed");
        else
            elem.removeClass("closed").addClass("opened");
    };

    $scope.InitInmueblesDisponibles = function (item) {
        let _item = $filter("filter")($scope.PreContacto.InmueblesProcesos, function (elem) { return elem.InmuebleProcesoID == item.InmuebleProcesoID; }, true);
        if (_item.length > 0) {
            item.Seleccionar = true;
            item.InmuebleProcesoProcesoID = _item[0].InmuebleProcesoProcesoID;
            item.Principal = _item[0].Principal;
        } else {
            item.Seleccionar = false;
            item.Principal = false;
        }
    };

    $scope.MenuInmueblesProcesos = [
        {
            text: '<i class="fal fa-home-alt"></i>&nbsp;&nbsp;Ficha del inmueble',
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
            text: '<i class="far fa-check-circle green"></i>&nbsp;&nbsp;Si le interesa el inmueble',
            click: function ($itemScope) {
                let _elem = angular.copy($itemScope.item);
                alertify.confirm("¿Desea reanudar el interes del inmueble?", function () {
                    _elem.DirIP = $scope.Usuario.Ip;
                    _elem.Usuario = $scope.Usuario.UsuarioID;
                    _elem.Token = $scope.Usuario.Token;
                    _elem.Interesado = true;
                    Services.Async(
                        $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesProcesosActualizar/",
                        _elem,
                        function (response) {
                            $scope.PreContacto.InmueblesProcesos = response.rows[0].data;
                        }
                    );
                });
            },
            displayed: function ($itemScope) {
                return $itemScope.item.Interesado == false && $itemScope.item.EstadoProcesoInmuebleID == 1 && $itemScope.item.Reservado == false;
            }
        },
        {
            text: '<i class="far fa-times-square red"></i>&nbsp;&nbsp;Ya no le interesa el inmueble',
            click: function ($itemScope) {
                $scope.InmuebleInviable = angular.copy($itemScope.item);
                $scope.InmuebleInviable.DirIP = $scope.Usuario.Ip;
                $scope.InmuebleInviable.Usuario = $scope.Usuario.UsuarioID;
                $scope.InmuebleInviable.Token = $scope.Usuario.Token;
                $scope.InmuebleInviable.Interesado = false;
                $scope.InmuebleInviable.CausalInviabilidadProcesoID = null;
                angular.element("#ModalInviabilizarInmueble").modal("show");
            },
            displayed: function ($itemScope) {
                return $itemScope.item.Interesado == true && $itemScope.item.EstadoProcesoInmuebleID == 1 && $itemScope.item.Reservado == false;
            }
        },
        {
            text: '<i class="fal fa-home-heart green"></i>&nbsp;&nbsp;Separar el inmueble',
            click: function ($itemScope) {
                alertify.confirm("¿Desea separar el inmueble N°." + $itemScope.item.InmuebleConsecutivo + "?", function () {
                    let _elem = angular.copy($itemScope.item);
                    _elem.DirIP = $scope.Usuario.Ip;
                    _elem.Usuario = $scope.Usuario.UsuarioID;
                    _elem.Token = $scope.Usuario.Token;
                    Services.Async(
                        $scope.serviceBaseCRM + "Inmuebles/ReservarProcesoInmueble/",
                        _elem,
                        function (response) {
                            $scope.PreContacto.InmueblesProcesos = response.rows[0].data;
                        }
                    );
                });
            },
            displayed: function ($itemScope) {
                return $itemScope.item.Interesado && $itemScope.item.EstadoProcesoInmuebleID == 1 && $itemScope.item.Reservado == false;
            }
        },
        {
            text: '<i class="fal fa-home-alt red"></i>&nbsp;&nbsp;Anular la separación',
            click: function ($itemScope) {
                alertify.confirm("¿Desea anular la separación del inmueble N°." + $itemScope.item.InmuebleConsecutivo + "?", function () {
                    let _elem = angular.copy($itemScope.item);
                    _elem.DirIP = $scope.Usuario.Ip;
                    _elem.Usuario = $scope.Usuario.UsuarioID;
                    _elem.Token = $scope.Usuario.Token;
                    Services.Async(
                        $scope.serviceBaseCRM + "Inmuebles/LiberarProcesoInmueble/",
                        _elem,
                        function (response) {
                            $scope.PreContacto.InmueblesProcesos = response.rows[0].data;
                        }
                    );
                });
            },
            displayed: function ($itemScope) {
                return $itemScope.item.Interesado && $itemScope.item.EstadoProcesoInmuebleID == 4 && $itemScope.item.Reservado == true;
            }
        },
        {
            text: '<i class="fal fa-calendar-plus blue"></i>&nbsp;&nbsp;Agendar cita o actividad del inmueble',
            click: function ($itemScope) {
                $scope.Actividad = {
                    DirIP: $scope.Usuario.Ip,
                    Usuario: $scope.Usuario.UsuarioID,
                    UsuarioID: $scope.Usuario.UsuarioID,
                    CalendarioActividadID: null,
                    CalendarioActividadOrigenID: 2,
                    InmuebleProcesoProcesoID: $itemScope.item.InmuebleProcesoProcesoID,
                    TipoCalendarioActividadID: $scope.PreContacto.ConfiguracionGBI.VisitaComercialTipoCalendarioActividadID,
                    Completada: false,                    
                    BloquearNuevaActividad: true,
                    Email: $scope.Usuario.Email + ";" + ($scope.PreContacto.Email == null ? "" : $scope.PreContacto.Email + ";") + ($scope.PreContacto.ClienteEmail == null ? "" : $scope.PreContacto.ClienteEmail),
                    Direccion: null,
                    Celular: $scope.PreContacto.Celular,
                    Notificacion: true,
                    NotificarPropietario: true,                    
                    Telefono: $scope.PreContacto.ClienteTelefono,
                    Descripcion: null,
                    CodigoOrigen: $scope.PreContacto.ProcesoID,
                    Token: $scope.Usuario.Token
                };                
                $scope.VisualizarActividadesSeguimientos($scope.PreContacto, function () {
                    $scope.NuevaActividad($scope.Actividad);
                    $scope.PreContacto.AgregarActividad = true;
                });
            },
            enabled: function ($itemScope) {
                return $itemScope.item.Interesado && ($itemScope.item.EstadoProcesoInmuebleID == 1 || ($itemScope.item.EstadoProcesoInmuebleID == 4 && $itemScope.item.Reservado));
            }
        },
        {
            text: '<i class="fal fa-ballot-check orange"></i>&nbsp;&nbsp;Iniciar proceso de compra',
            click: function ($itemScope) {
                $scope.AbrirProcesoCompra($itemScope.item);
            },
            displayed: function ($itemScope) {
                return $scope.ShowEnNegociacion() == false;
            },
            enabled: function ($itemScope) {
                return $itemScope.item.Interesado && ($itemScope.item.EstadoProcesoInmuebleID == 1 || ($itemScope.item.EstadoProcesoInmuebleID == 4 && $itemScope.item.Reservado));
            }
        },
        {
            text: '<i class="fal fa-backward red"></i>&nbsp;&nbsp;Reversar proceso de compra',
            click: function ($itemScope) {
                $scope.ReversarProcesoCompra($itemScope.item);
            },
            displayed: function ($itemScope) {
                return $scope.ShowResersarCompra();
            },
            enabled: function ($itemScope) {
                return $itemScope.item.Interesado && ($itemScope.item.EstadoProcesoInmuebleID == 1 || ($itemScope.item.EstadoProcesoInmuebleID == 4 && $itemScope.item.Reservado));
            }
        },
        null,
        {
            text: '<label class="text-center mb-0" style="width: 100%;">Compartir busqueda</label>'
        },
        null,
        {
            text: '<i class="fad fa-search-location blue"></i>&nbsp;&nbsp;Ver busqueda',
            click: function ($itemScope) {
                $scope.VerBusqueda();
            }
        },
        {
            text: '<i class="fal fa-link"></i>&nbsp;&nbsp;Copiar enlace',
            click: function ($itemScope) {
                $scope.CopiarEnlace();
            }
        },
        {
            text: '<i class="fab fa-whatsapp green"></i>&nbsp;&nbsp;WhatsApp',
            click: function ($itemScope) {
                $scope.CompartirWhatsApp();
            }
        },
        {
            text: '<i class="fal fa-envelope orange"></i>&nbsp;&nbsp;Gmail',
            click: function ($itemScope) {
                $scope.CompartirGmail();
            }
        }
    ];

    $scope.VerBusqueda = function () {
        window.open(window.location.origin + "/GBI/InmueblesGBI/Visualizar?ProcesoID=" + $scope.PreContacto.UniqueID);
    };

    $scope.CopiarEnlace = function () {
        var $temp_input = $("<input>");
        $("body").append($temp_input);
        $temp_input.val(window.location.origin + '/GBI/InmueblesGBI/Visualizar?ProcesoID=' + $scope.PreContacto.UniqueID).select();
        document.execCommand("copy");
        $temp_input.remove();
        alertify.success("Enlace copiado");
    };

    $scope.FilterInmueblesProcesos = function (value, index, array) {
        return (value.EstadoProcesoInmuebleID == 1 || value.EstadoProcesoInmuebleID == 4 || value.EstadoProcesoInmuebleID == 5)
    };

    $scope.CompartirWhatsApp = function () {
        if ($scope.PreContacto.Celular)
            window.open('https://api.whatsapp.com/send?phone=57' + $scope.PreContacto.Celular + '&text=Acontinuación+encontraras+en+el+siguiente+link+la+lista+de+los+inmuebles+con+mas+afinidad+con+tu+busqueda+Link+-->+\n+' + window.location.origin + '/GBI/InmueblesGBI/Visualizar?ProcesoID=' + $scope.PreContacto.UniqueID);
    };

    $scope.CompartirGmail = function () {
        let _urlEmail = "https://mail.google.com/mail/?view=cm&fs=1&to=";
        if ($scope.PreContacto.Email != "" && $scope.PreContacto.Email != undefined)
            _urlEmail += $scope.PreContacto.Email;
        if ($scope.PreContacto.ClienteEmail != "" && $scope.PreContacto.ClienteEmail != undefined)
            _urlEmail += ";" + $scope.PreContacto.ClienteEmail;
        _urlEmail += "&su=Comparto+la+busqueda+de+los+inmuebles+de+su+interes&body=Acontinuación+encontraras+en+el+siguiente+link+la+lista+de+los+inmuebles+con+mas+afinidad+con+tu+busqueda+Link+-->+\n+" + window.location.origin + "/GBI/InmueblesGBI/Visualizar?ProcesoID=" + $scope.PreContacto.UniqueID;
        window.open(_urlEmail);
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

    $scope.AbrirLinkPaxzu = function (_paxzu) {
        if ($scope.configuracionWS.UrlPreview != null)
            window.open($scope.configuracionWS.UrlPreview + _paxzu);
    };

    $scope.AbrirLinkCienCuadras = function (_cienCuadras) {
        if ($scope.configuracionCC.Pruebas != undefined)
            window.open(($scope.configuracionCC.Pruebas == false ? "https://www.ciencuadras.com/inmueble/" : "https://pre.ciencuadras.com/inmueble/") + _cienCuadras);
    };

    $scope.ShowEnNegociacion = function () {
        return $filter("filter")($scope.PreContacto.InmueblesProcesos, function (elem) { return elem.EstadoInmuebleProcesoProcesoID >= 7; }, true).length == 0 ? false : true;        
    };

    $scope.ShowValidacionSeguridad = function () {
        return $filter("filter")($scope.PreContacto.InmueblesProcesos, function (elem) { return elem.EstadoInmuebleProcesoProcesoID >= 12; }, true).length == 0 ? false : true;
    };

    $scope.ShowResersarCompra = function () {
        return $filter("filter")($scope.PreContacto.InmueblesProcesos, function (elem) { return elem.InmuebleEnGestion == true; }, true).length == 0 ? false : true;
    };

    $scope.ReversarProcesoCompra = function (item) {
        alertify.confirm("¿Desea reversar el proceso de la compra del inmueble N°." + $scope.PreContacto.InmuebleCompra.InmuebleConsecutivo + "?", function () {
            $scope.MostrarProgress(true);
            item.DirIP = $scope.Usuario.Ip;
            item.Usuario = $scope.Usuario.UsuarioID;
            item.Token = $scope.Usuario.Token;
            Services.Async(
                $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesProcesosReversarCompra/",
                item,
                function (response) {
                    $scope.PreContacto.InmueblesProcesos = response.rows[0].data;                    
                    $scope.Sincronizar(function () {
                        $scope.MostrarProgress(false);
                    });
                }
            );
        });
    };

    $scope.AbrirProcesoCompra = function (item) {
        $scope.InmuebleProceso = angular.copy(item);
        $scope.Compra = {
            DirIP: $scope.Usuario.Ip,
            Usuario: $scope.Usuario.UsuarioID,
            InmuebleProcesoProcesoID: item.InmuebleProcesoProcesoID,
            AvaluoCompania: true,
            AvaluoCompaniaObservaciones: null,
            EstudioTitulosCompania: true,
            EstudioTitulosCompaniaObservaciones: null,
            InmueblesProcesosProcesosOfertas: [],
            Token: $scope.Usuario.Token
        };
        $scope.Oferta = {
            InmuebleProcesoProcesoOfertaID: null,
            ValorOferta: null,
            FechaOferta: null,
            ValorContraOferta: null,
            FechaContraOferta: null,
            Eliminar: false
        };
        $scope.CopyOferta = angular.copy($scope.Oferta);
        $("#modalIniciarProceso").modal("show");
    };

    $scope.ShowAgregarOferta = function () {
        if ($scope.Compra) {
            if ($scope.Compra.InmueblesProcesosProcesosOfertas) {
                if ($filter("filter")($scope.Compra.InmueblesProcesosProcesosOfertas, function (elem) { return elem.Eliminar == false && elem.ValorContraOferta == null }, true).length > 0)
                    return false;
                else
                    return true;
            } else
                return false;
        } else
            return false;
    };

    $scope.AgregarOferta = function () {
        if ($scope.Oferta.ValorOferta == null || $scope.Oferta.ValorOferta == undefined) {
            alertify.error("El valor de la oferta es requerido");
            return;
        }
        alertify.confirm("¿Desea confirmar la oferta $." + $scope.Oferta.ValorOferta + "?", function () {
            $scope.Oferta.FechaOferta = moment().format("YYYY-MM-DDTHH:mm");
            $scope.Compra.InmueblesProcesosProcesosOfertas.push(angular.copy($scope.Oferta));
            $scope.Oferta = angular.copy($scope.CopyOferta);
        });
    };

    $scope.AgregarContraOferta = function (item, index) {
        if ($scope.Oferta.ValorContraOferta == null || $scope.Oferta.ValorContraOferta == undefined) {
            alertify.error("El valor de la contra oferta es requerido");
            return;
        }
       /* if (item.ValorOferta >= $scope.Oferta.ValorContraOferta) {
            alertify.error("El valor de la contra oferta es mayor o igual a la oferta");
            return;
        }*/
        alertify.confirm("¿Desea confirmar la contra oferta $." + $scope.Oferta.ValorContraOferta + "?", function () {
            item.FechaContraOferta = moment().format("YYYY-MM-DDTHH:mm");
            item.ValorContraOferta = $scope.Oferta.ValorContraOferta;
            $scope.Oferta = angular.copy($scope.CopyOferta);
        });
    };

    $scope.EliminarOferta = function (item, index) {
        if (item.InmuebleProcesoProcesoOfertaID != null) {
            alertify.error("La oferta ya no se puede eliminar");
            return;
        }
        alertify.confirm("¿Desea eliminar la oferta?", function () {
            if (item.InmuebleProcesoProcesoOfertaID == null)
                $scope.Compra.InmueblesProcesosProcesosOfertas.splice(index, 1);
            else
                item.Eliminar = true;
        });
    };

    $scope.GuardarOfertas = function () {
        if ($scope.ValidarOfertas()) {
            alertify.confirm("¿Desea guardar los cambios sobre las ofertas?", function () {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesProcesosIniciarCompra/",
                    $scope.Compra,
                    function (response) {
                        $scope.PreContacto.InmueblesProcesos = response.rows[0].data;
                        $("#modalIniciarProceso").modal("hide");  3
                        $scope.Sincronizar(function () {
                            $scope.MostrarProgress(false);
                        });
                    }
                );
            });
        }  
    };

    $scope.ValidarOfertas = function () {
        if ($scope.Compra.AvaluoCompania == false) {
            if ($scope.Compra.AvaluoCompaniaObservaciones == null || $scope.Compra.AvaluoCompaniaObservaciones == undefined) {
                alertify.error("Las observaciones del por que no se hizo avaluo es requerida");
                return false;
            }            
        }
        if ($scope.Compra.EstudioTitulosCompania == false) {
            if ($scope.Compra.EstudioTitulosCompaniaObservaciones == null || $scope.Compra.EstudioTitulosCompaniaObservaciones == undefined) {
                alertify.error("Las observaciones de por que no se hizo los estudios es requerida");
                return false;
            }
        }
        if ($filter("filter")($scope.Compra.InmueblesProcesosProcesosOfertas, function (elem) { return elem.Eliminar == false; }, true).length == 0) {
            alertify.error("Se debe ingresar al menos 1 oferta");
            return false;
        }
        return true;
    };

    $scope.AbrirOfertasModal = function () {
        $scope.MostrarProgress(true);
        $scope.InmuebleProceso = angular.copy($filter("filter")($scope.PreContacto.InmueblesProcesos, function (elem) { return elem.InmuebleEnGestion == true; }, true)[0]);
        Services.Async(
            $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesProcesosProcesosComprasConsultar/",
            { InmuebleProcesoProcesoID: $scope.InmuebleProceso.InmuebleProcesoProcesoID, Token: $scope.Usuario.Token },
            function (response) {
                $scope.Compra = angular.copy(response.data);
                $scope.Compra.DirIP = $scope.Usuario.Ip;
                $scope.Compra.Usuario = $scope.Usuario.UsuarioID;
                $scope.Compra.Token = $scope.Usuario.Token;
                angular.forEach($scope.Compra.InmueblesProcesosProcesosOfertas, function (elem2) {
                    elem2.Eliminar = false;
                });
                $scope.Oferta = {
                    InmuebleProcesoProcesoOfertaID: null,
                    ValorOferta: null,
                    FechaOferta: null,
                    ValorContraOferta: null,
                    FechaContraOferta: null,
                    Eliminar: false
                };
                $scope.CopyOferta = angular.copy($scope.Oferta);
                $("#modalIniciarProceso").modal("show");
                $scope.MostrarProgress(false);
            }
        );
    };

    $scope.VerFichaInmueble = function (elem) {
        $scope.viewer.Open(window.location.origin + "/GBI/InmueblesGBI/Visualizar?UniqueID=" + elem.UniqueID);
    };

    $scope.OnCloseVentanaInmueble = function (IsEdicion) {
        $scope.MostrarProgress(true);
        $scope.Sincronizar(function () {
            $scope.MostrarProgress(false);
        });
    };

    $scope.AceptarOferta = function (item) {
        $scope.Oferta = angular.copy(item);
        $scope.Oferta.DirIP = $scope.Usuario.Ip;
        $scope.Oferta.Usuario = $scope.Usuario.UsuarioID;
        $scope.Oferta.Token = $scope.Usuario.Token;
        $scope.Oferta.OfertasCondicionesPagos = [];
        $scope.Oferta.CompradoresVendedores = [];
        $scope.Oferta.ProcesosDocumentos = [];
        $scope.Oferta.SincronizarPropietarios = true;
        $scope.Condicion = {
            InmuebleProcesoProcesoOfertaCondicionPagoID: null,
            Descripcion: null,
            Porcentaje: null,            
            Eliminar: false
        };
        $scope.CopyCondicion = angular.copy($scope.Condicion);
        $scope.MostrarHeaderPrincipal(false);
        $scope.Titulo = "Aceptación de la oferta";
        $scope.ModoView = 3;
    };

    $scope.AgregarCondicionPago = function () {
        if ($scope.Condicion.Porcentaje == null || $scope.Condicion.Porcentaje == undefined) {
            alertify.error("El porcentaje es requerido.");
            return;
        }
        if ($scope.Condicion.Descripcion == null || $scope.Condicion.Descripcion == undefined) {
            alertify.error("La descripción es requerida.");
            return;
        }
        alertify.confirm("¿Desea agregar la condición de pago?", function () {            
            $scope.Oferta.OfertasCondicionesPagos.push(angular.copy($scope.Condicion));
            $scope.Condicion = angular.copy($scope.CopyCondicion);
        });
    };

    $scope.EliminarCondicionPago = function (item, index) {       
        alertify.confirm("¿Desea eliminar la condición de pago?", function () {
            if (item.InmuebleProcesoProcesoOfertaCondicionPagoID == null)
                $scope.Oferta.OfertasCondicionesPagos.splice(index, 1);
            else
                item.Eliminar = true;
        });
    };

    $scope.ValidarCondicionesPagos = function () {
        if ($scope.Oferta.FormaPagoCompraInmuebleID == null || $scope.Oferta.FormaPagoCompraInmuebleID == undefined) {
            alertify.error("La forma de pago es requerido.");
            return false;
        }
        if ($filter("filter")($scope.Oferta.OfertasCondicionesPagos, function (elem) { return elem.Eliminar == false }, true).length == 0) {
            alertify.error("Debe ingresar una condición de pago.");
            return false;
        }
        if ($filter("filter")($scope.Oferta.CompradoresVendedores, function (elem) { return elem.Eliminar == false && elem.Comprador == true }, true).length == 0) {
            alertify.error("Debe ingresar los compradores.");
            return false;
        }
        return true;
    };

    $scope.GuardarCondicionesPagos = function () {
        if ($scope.ValidarCondicionesPagos()) {
            alertify.confirm("¿Desea guardar los cambios de la aceptación de la oferta?", function () {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesAceptarOfertaCompra/",
                    $scope.Oferta,
                    function (response) {
                        let _arrayFiles = [], _arrayDeleteFiles = [];
                        angular.forEach($scope.Oferta.ProcesosDocumentos, function (elem) {
                            if (elem.Eliminar == false && elem.InmuebleProcesoProcesoDocumentoID == null)
                                _arrayFiles.push(elem.Ruta.replaceAll("cdn://", ""));
                            else if (elem.Eliminar == true)
                                _arrayDeleteFiles.push({ CodigoUnico: elem.Ruta.replaceAll("cdn://", "") });
                        });
                        $scope.CommitCDN(_arrayFiles);
                        $scope.EliminarArchivoCDN(_arrayDeleteFiles);
                        $scope.PreContacto.InmueblesProcesos = response.rows[0].data;
                        $scope.AtrasModoView();
                        $scope.Sincronizar(function () {
                            $scope.MostrarProgress(false);
                        });
                    }
                );
            });
        }
    };

    $scope.AbrirModalComprador = function () {
        let _tipoPersona = $filter('filter')($scope.TiposPersonas, function (elem) { return elem.DefaultPersonas == true }, true)[0];
        $scope.Comprador = {
            InmuebleProcesoProcesoCompradorVendedorID: null,
            TerceroID: null,
            Nombres: null,
            Nombres2: null,
            Apellidos: null,
            Apellidos2: null,
            TipoDocumentoID: $scope.TiposDocumentos[0].TipoDocumentoID,
            Documento: null,
            Direccion: null,
            Celular: null,
            Email: null,            
            TipoPersonaID: _tipoPersona.TipoPersonaID,            
            ValidacionDocumento: false,
            DocumentosAnexos: [],
            Comprador: true,
            Eliminar: false,
        };        
        $scope.ChangeTipoPersona($scope.Comprador, 'TipoPersonaID');
        $("#modalAgregarComprador").modal("show");
    };

    $scope.GuardarActualizarComprador = function () {
        if ($scope.Comprador.Documento == undefined || $scope.Comprador.Documento == null || $scope.Comprador.Documento == "") {
            alertify.error("El documento es obligatorio.");
            return;
        } else if ($scope.Comprador.Nombres == undefined || $scope.Comprador.Nombres == null || $scope.Comprador.Nombres == "") {
            alertify.error(($scope.Comprador.ShowTipoPersona ? "El nombre " : "La razon social ") + "es obligatorio.");
            return;
        } else if ($scope.Comprador.ShowTipoPersona) {
            if ($scope.Comprador.Apellidos == undefined || $scope.Comprador.Apellidos == null || $scope.Comprador.Apellidos == "") {
                alertify.error("El apellido es obligatorio.");
                return;
            }
        } 
        $scope.Comprador.TipoDocumentoAbreviatura = $filter("filter")($scope.TiposDocumentos, function (elem) { return elem.TipoDocumentoID == $scope.Comprador.TipoDocumentoID }, true)[0].Abreviatura;
        $scope.Comprador.NombreCompleto = $scope.Comprador.Nombres + " " + ($scope.Comprador.Nombres2 == null ? "" : $scope.Comprador.Nombres2 + " ") + ($scope.Comprador.Apellidos == null ? "" : $scope.Comprador.Apellidos + " ") + ($scope.Comprador.Apellidos2 == null ? "" : $scope.Comprador.Apellidos2 + " ");
        alertify.confirm("¿Desea guardar los cambios del comprador?", function () {
            if ($scope.indexComprador == undefined)
                $scope.Oferta.CompradoresVendedores.push(angular.copy($scope.Comprador));
            else                
                $scope.Oferta.CompradoresVendedores[$scope.indexComprador] = angular.copy($scope.Comprador);
            $("#modalAgregarComprador").modal("hide");
        });
    };

    $scope.EditarComprador = function (item, index) {        
        $scope.Comprador = angular.copy(item);
        $scope.Comprador.ValidacionDocumento = true;
        if ($scope.Comprador.DocumentosAnexos == null)
            $scope.Comprador.DocumentosAnexos = [];
        $scope.indexComprador = index;
        $scope.ChangeTipoPersona($scope.Comprador, 'TipoPersonaID');
        $("#modalAgregarComprador").modal("show");
    };

    $scope.EliminarComprador = function (item, index) {
        alertify.confirm("¿Desea eliminar el comprador " + item.NombreCompleto + "?", function () {
            if (item.InmuebleProcesoProcesoCompradorVendedorID == null)
                $scope.Oferta.CompradoresVendedores.splice(index, 1);
            else
                item.Eliminar = true;
        });
    };

    $scope.AbrirModalCondiciones = function () {
        $scope.MostrarProgress(true);        
        Services.Async(
            $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesProcesosProcesosOfertaConsultar/",
            { InmuebleProcesoProcesoOfertaID: $scope.PreContacto.OfertaAceptada.InmuebleProcesoProcesoOfertaID, Token: $scope.Usuario.Token },
            function (response) {
                $scope.Oferta = angular.copy(response.data);
                $scope.Oferta.DirIP = $scope.Usuario.Ip;
                $scope.Oferta.Usuario = $scope.Usuario.UsuarioID;
                $scope.Oferta.Token = $scope.Usuario.Token;                
                $scope.Oferta.SincronizarPropietarios = false;
                angular.forEach($scope.Oferta.CompradoresVendedores, function (elem2) {
                    elem2.Eliminar = false;
                    angular.forEach(elem2.DocumentosAnexos, function (elem3) {
                        elem3.Eliminar = false;
                    });
                });
                angular.forEach($scope.Oferta.OfertasCondicionesPagos, function (elem2) {
                    elem2.Eliminar = false;
                });
                angular.forEach($scope.Oferta.ProcesosDocumentos, function (elem2) {
                    elem2.Eliminar = false;
                });
                $scope.Condicion = {
                    InmuebleProcesoProcesoOfertaCondicionPagoID: null,
                    Descripcion: null,
                    Porcentaje: null,
                    Eliminar: false
                };
                $scope.CopyCondicion = angular.copy($scope.Condicion);
                $scope.MostrarHeaderPrincipal(false);
                $scope.Titulo = "Aceptación de la oferta";
                $scope.ModoView = 3;
                $scope.MostrarProgress(false);
            }
        );
    };

    $scope.ConfigInput = {
        IsMultiple: true,
        CDNEndPoint: $scope.Usuario.CDNEndPoint,
        CDNLlavePublica: $scope.Usuario.CDNLlavePublica,
        CDNLlavePrivada: $scope.Usuario.CDNLlavePrivada,
        Token: $scope.Usuario.Token,
        PreUploadFileCDN: function (_file, _config) {
            if (_file.name != undefined && _file.name != "") {
                if (_file.name.length > 200) {
                    alertify.error("El nombre del archivo adjunto no puede superar los 100 caracteres.");
                    return false;
                }
            }
            let extencion = _file.name.split(".").pop().toLowerCase();
            if (extencion == "exe" || extencion == "xps") {
                alertify.error("Un archivo no se puede cargar por que no es valido.");
                return false;
            }
            return true;
        },
        UploadFileCDN: function (response, _file) {
            let _item = {                
                InmuebleProcesoProcesoDocumentoID: null,                
                NombreArchivo: _file.name,
                Ruta: "cdn://" + response.CodigoUnico,
                Url: $scope.Usuario.CDNEndPoint + '/api/Files/GetFile?PublicKey=' + $scope.Usuario.CDNLlavePublica + '&UniqueID=' + response.CodigoUnico + '&Disposition=Inline',
                Eliminar: false
            };
            if ($scope.Oferta.ProcesosDocumentos == null)
                $scope.Oferta.ProcesosDocumentos = [];
            $scope.Oferta.ProcesosDocumentos.push(_item);
        }
    };

    $scope.EliminarArchivo = function (index, item) {
        alertify.confirm("¿Desea eliminar el archivo?", function () {
            if (item.InmuebleProcesoProcesoDocumentoID == null && item.InmuebleProcesoProcesoDocumentoID == undefined) {
                $scope.EliminarArchivoCDN([{ CodigoUnico: item.Ruta.replaceAll("cdn://", "") }], function (response) {
                    $scope.Oferta.ProcesosDocumentos.splice(index, 1);
                });
            } else
                item.Eliminar = true;
        });
    };

    $scope.ConfigInputComprador = {
        IsMultiple: true,
        CDNEndPoint: $scope.Usuario.CDNEndPoint,
        CDNLlavePublica: $scope.Usuario.CDNLlavePublica,
        CDNLlavePrivada: $scope.Usuario.CDNLlavePrivada,
        Token: $scope.Usuario.Token,
        PreUploadFileCDN: function (_file, _config) {
            if (_file.name != undefined && _file.name != "") {
                if (_file.name.length > 200) {
                    alertify.error("El nombre del archivo adjunto no puede superar los 100 caracteres.");
                    return false;
                }
            }
            let extencion = _file.name.split(".").pop().toLowerCase();
            if (extencion == "exe" || extencion == "xps") {
                alertify.error("Un archivo no se puede cargar por que no es valido.");
                return false;
            }
            return true;
        },
        UploadFileCDN: function (response, _file) {
            let _item = {
                InmuebleProcesoProcesoDocumentoID: null,
                NombreArchivo: _file.name,
                Ruta: "cdn://" + response.CodigoUnico,
                Url: $scope.Usuario.CDNEndPoint + '/api/Files/GetFile?PublicKey=' + $scope.Usuario.CDNLlavePublica + '&UniqueID=' + response.CodigoUnico + '&Disposition=Inline',
                Eliminar: false
            };
            if ($scope.Comprador.DocumentosAnexos == null)
                $scope.Comprador.DocumentosAnexos = [];
            $scope.Comprador.DocumentosAnexos.push(_item);
        }
    };

    $scope.EliminarArchivoComprador = function (index, item) {
        alertify.confirm("¿Desea eliminar el archivo?", function () {
            if (item.InmuebleProcesoProcesoDocumentoID == null && item.InmuebleProcesoProcesoDocumentoID == undefined) {
                $scope.EliminarArchivoCDN([{ CodigoUnico: item.Ruta.replaceAll("cdn://", "") }], function (response) {
                    $scope.Comprador.DocumentosAnexos.splice(index, 1);
                });
            } else
                item.Eliminar = true;
        });
    };

    $scope.CargarHtmlAnexosCompradores = function (_event, item) {
        if ($scope.elem)
            $scope.elem.popover("dispose");
        if (item == undefined) {
            $scope.elem = $(_event.currentTarget).popover({
                container: 'body',
                html: true,
                placement: 'auto',
                sanitize: false,
                content: "No hay adjuntos del comprador",
                boundary: 'viewport',
                trigger: 'manual'
            });
            $scope.elem.popover("show");
        } else {           
                $scope.elem = $(_event.currentTarget).popover({
                    container: 'body',
                    html: true,
                    placement: 'auto',
                    sanitize: false,
                    content: item.DocumentosAnexos.length > 0 ? $scope.TableAdjuntosCompradores(item) : "No hay adjuntos de la factura",
                    boundary: 'viewport',
                    trigger: 'manual'
                });
                $scope.elem.popover("show");            
        }
    };

    $scope.TableAdjuntosCompradores = function (item) {
        let _table = '<label class="control-label control-label-sm">Adjuntos del comprador</label>' +
            '<button class="close ml-10" onclick="CerrarPopover()"><i class="fal fa-times"></i></button>' +
            '<table class="table table-striped table-sm mb-0">' +
            '<tbody>';
        for (let i = 0; i < item.DocumentosAnexos.length; i++) {
            let elem = item.DocumentosAnexos[i];
            _table += '<tr>' +
                '<td class="width-30">' +
                '<button class="not-btn" onclick="AbrirArchivo(\'' + elem.Ruta + '\')">' +
                '<i class="fal fa-file-pdf font-14"></i>' +
                '</button>' +
                '</td>' +
                '<td><a href="#" onclick="AbrirArchivo(\'' + elem.Ruta + '\')">' + (elem.NombreArchivo == null ? '' : elem.NombreArchivo) + '</a></td>' +
                '</tr>';
        }
        _table += '</tbody></table>';

        return _table;
    };

    AbrirArchivo = function (ruta) {
        $scope.viewer.Open(ruta);
    };

    CerrarPopover = function () {
        if ($scope.elem)
            $scope.elem.popover("dispose");
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

    $scope.AbrirModalPromesa = function () {
        $("#modalPromesaVenta").modal("show");
    };

    $scope.AbrirModalPromesaVentaFinalizacion = function () {
        $("#modalPromesaVentaFinalizacion").modal("show");
    };

    $scope.ConfigInputPromesa = {
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
            let _item = {
                DirIp: $scope.Usuario.Ip,
                Usuario: $scope.Usuario.UsuarioID,
                InmuebleProcesoProcesoID: $scope.PreContacto.InmuebleCompra.InmuebleProcesoProcesoID,
                RutaPromesaCompraVenta: "cdn://" + responseFile.CodigoUnico,
                Token: $scope.Usuario.Token
            };
            Services.Async(
                $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesProcesosCargarPromesaVenta/",
                _item,
                function (response) {                    
                    alertify.success(response.rows[0].Descripcion);
                    $scope.CommitCDN([_item.Ruta.replaceAll("cdn://", "")]);
                }
            );
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

    $scope.EliminarArchivoPromesa = function () {
        alertify.confirm("¿Desea eliminar el archivo de la promesa?", function () {
            if ($scope.PreContacto.InmuebleCompra.RutaPromesaCompraventa != null) {
                $scope.EliminarArchivoCDN([{ CodigoUnico: $scope.PreContacto.InmuebleCompra.RutaPromesaCompraventa }], function (response) {
                    $scope.MostrarProgress(true);
                    let _item = {
                        DirIp: $scope.Usuario.Ip,
                        Usuario: $scope.Usuario.UsuarioID,
                        InmuebleProcesoProcesoID: $scope.PreContacto.InmuebleCompra.InmuebleProcesoProcesoID,
                        RutaPromesaCompraVenta: null,
                        Token: $scope.Usuario.Token
                    };
                    Services.Async(
                        $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesProcesosCargarPromesaVenta/",
                        _item,
                        function (response) {
                            alertify.success(response.rows[0].Descripcion);
                            $scope.Sincronizar(function () {
                                $scope.MostrarProgress(false);
                            });
                        }
                    );
                });
            }
        });
    };

    $scope.EnviarNotificacionFacturaComision = function () {
        /*
        if ($scope.PreContacto.ClienteNombres == undefined || $scope.PreContacto.ClienteNombres == null || $scope.PreContacto.ClienteDocumento == undefined || $scope.PreContacto.ClienteDocumento == null) {
            alertify.confirm("Para continuar con este paso antes debe completar la información del cliente, ¿Desea completar los campos?", function () {
                $scope.AbrirModalEditar($scope.PreContacto, 3, function () {
                    angular.element("#pnl-contacto").collapse("hide");
                    angular.element("#pnl-cliente").collapse("show");
                });
            });
            return;
        }*/
        alertify.confirm("¿Desea enviar la notificación para realización de la factura de comision, con fecha de vencimiento " + ($scope.PreContacto.OfertaAceptada.FechaVencimientoFactura == null ? "NO SE INGRESO" : $filter("date")($scope.PreContacto.OfertaAceptada.FechaVencimientoFactura, "dd/MM/yyyy")) + "?", function () {
            $scope.MostrarProgress(true);
            let _item = {
                DirIp: $scope.Usuario.Ip,
                Usuario: $scope.Usuario.UsuarioID,
                InmuebleProcesoProcesoID: $scope.PreContacto.InmuebleCompra.InmuebleProcesoProcesoID,
                Token: $scope.Usuario.Token
            };
            Services.Async(
                $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesProcesosNotificarComisionVenta/",
                _item,
                function (response) {
                    alertify.success(response.rows[0].Descripcion);
                    $scope.Sincronizar(function () {
                        $scope.MostrarProgress(false);
                    });
                }
            );
        });
    };

    $scope.GetAprobacionSarglaft = function (value, index, array) {
        return value.AprobacionSarglaft == null || value.AprobacionSarglaft == false;
    };

    $scope.GetAprobacionSarglaftNotNull = function (value, index, array) {
        return value.AprobacionSarglaft == true;
    };

    $scope.GetAprobacionSarglaftNull = function (value, index, array) {
        return value.AprobacionSarglaft == null;
    };

    $scope.EnviarNotificacionSarlaft = function () {
        if ($filter("filter")($scope.PreContacto.OfertaAceptada.CompradoresVendedores, function (elem) { return elem.Comprador == true }, true).length == 0) {
            alertify.error("No se han registrado los compradores");
            return;
        }
        alertify.confirm("¿Desea enviar la notificación para la realización de validación en sarlaft?", function () {
            $scope.MostrarProgress(true);
            let _item = {
                DirIp: $scope.Usuario.Ip,
                Usuario: $scope.Usuario.UsuarioID,
                InmuebleProcesoProcesoOfertaID: $scope.PreContacto.OfertaAceptada.InmuebleProcesoProcesoOfertaID,
                Token: $scope.Usuario.Token
            };
            Services.Async(
                $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesProcesosNotificacionSagrlaf/",
                _item,
                function (response) {
                    alertify.success(response.rows[0].Descripcion);
                    $scope.Sincronizar(function () {
                        $scope.MostrarProgress(false);
                    });
                }
            );
        });
    };

    $scope.AbrirModalActividad = function (item) {
        if ($scope.TiposActividades.length == 1) {
            alertify.error("Debe configurar los tipos de actividades.");
            return;
        }
        if (!item) {
            $scope.Actividad = {
                CalendarioActividadID: null,
                CalendarioActividadOrigenID: 2,
                UsuarioID: $scope.Usuario.UsuarioID,
                InmuebleProcesoProcesoID: $scope.PreContacto.InmuebleCompra.InmuebleProcesoProcesoID,
                TipoCalendarioActividadID: null,
                Email: $scope.PreContacto.ClienteEmail,
                Celular: $scope.PreContacto.ClienteCelular,
                Telefono: $scope.PreContacto.ClienteTelefono,
                ModificacionEspecial: true,
                Completada: false,
                Notificacion: true,
                CodigoOrigen: $scope.PreContacto.ProcesoID
            };
            $scope.TituloActividad = "Agendar actividad"
        } else {
            $scope.Actividad = angular.copy(item);
            if ($scope.Actividad.UsuarioID == null)
                $scope.Actividad.UsuarioID = $scope.Usuario.UsuarioID;
            $scope.TituloActividad = "Actividad " + item.TipoCalendarioActividadNombre;
        }
        $scope.Actividad.DirIP = $scope.Usuario.Ip;
        $scope.Actividad.Usuario = $scope.Usuario.UsuarioID;
        $scope.Actividad.Token = $scope.Usuario.Token;
        
        angular.element("#modalAcitivadCalendario").modal("show");
    };

    $scope.ChangeTipoActividad = function (item) {
        let tipo = $filter("filter")($scope.TiposActividades, function (elem) { return elem.TipoCalendarioActividadID == $scope.Actividad.TipoCalendarioActividadID; }, true);
        if (tipo.length > 0) {
            $scope.Actividad.Entregable = tipo[0].Entregable;
            $scope.Actividad.TipoCalendarioActividadID = tipo[0].TipoCalendarioActividadID;
            $scope.Actividad.TipoCalendarioActividadNombre = tipo[0].Nombre;
        } else {
            $scope.Actividad.Entregable = false;
            $scope.Actividad.TipoCalendarioActividadID = null;
            $scope.Actividad.TipoCalendarioActividadNombre = "Descripción de la actividad";
        }
        if ($scope.Actividad.Entregable == true) {
            $scope.Actividad.Direccion = null;
            $scope.Actividad.Telefono = null;
            $scope.Actividad.Celular = null;
        }
        if ($scope.Actividad.TipoCalendarioActividadID == $scope.PreContacto.ConfiguracionGBI.PromesaCompraventaTipoCalendarioActividadID)
            $scope.Actividad.Descripcion = "Actividad para la firma de promesa de venta del inmueble N°." + $scope.PreContacto.InmuebleCompra.InmuebleConsecutivo + " ubicado en la dirección " + $scope.PreContacto.InmuebleCompra.InmuebleDireccion;
        if ($scope.Actividad.TipoCalendarioActividadID == $scope.PreContacto.ConfiguracionGBI.DesembolsoTipoCalendarioActividadID)
            $scope.Actividad.Descripcion = "Actividad para el desembolso del inmueble N°." + $scope.PreContacto.InmuebleCompra.InmuebleConsecutivo + " ubicado en la dirección " + $scope.PreContacto.InmuebleCompra.InmuebleDireccion;
        if ($scope.Actividad.TipoCalendarioActividadID == $scope.PreContacto.ConfiguracionGBI.EscrituracionTipoCalendarioActividadID)
            $scope.Actividad.Descripcion = "Actividad para la firma de escritura del inmueble N°." + $scope.PreContacto.InmuebleCompra.InmuebleConsecutivo + " ubicado en la dirección " + $scope.PreContacto.InmuebleCompra.InmuebleDireccion;
    };

    $scope.ChangeFechaInicio = function () {
        $scope.Actividad.FechaVencimiento = moment($scope.Actividad.FechaInicio, "DD/MM/YYYY HH:mm").add(60, 'minutes').format("DD/MM/YYYY HH:mm");
    };

    $scope.GuardarActividad = function () {
        if ($scope.ValidarCamposActividad()) {
            alertify.confirm("¿Desea guardar los cambios de la actividad?", function () {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseSIS + ($scope.Actividad.CalendarioActividadID == null ? "CalendariosActividades/CalendariosActividadesInsertar/" : "CalendariosActividades/CalendariosActividadesActualizar/"),
                    $scope.Actividad,
                    function (response) {
                        alertify.success(response.rows[0].Descripcion);
                        $scope.Sincronizar(function () {
                            angular.element("#modalAcitivadCalendario").modal("hide");
                            $scope.MostrarProgress(false);
                        });
                    }
                );
            });
        }
    };

    $scope.ShowActividad = function (item) {
        let _tipo = null;
        if (item.TipoCalendarioActividadID == $scope.PreContacto.ConfiguracionGBI.PromesaCompraventaTipoCalendarioActividadID)
            _tipo = 1;
        if (item.TipoCalendarioActividadID == $scope.PreContacto.ConfiguracionGBI.DesembolsoTipoCalendarioActividadID)
            _tipo = 2;
        if (item.TipoCalendarioActividadID == $scope.PreContacto.ConfiguracionGBI.EscrituracionTipoCalendarioActividadID)
            _tipo = 3;
        if (_tipo == 1 || _tipo == 3)
            return true;
        if (($scope.PreContacto.OfertaAceptada.FormaPagoCompraInmuebleID == 1 || $scope.PreContacto.OfertaAceptada.FormaPagoCompraInmuebleID == 2) && _tipo == 2 && item.RequiereActividadDesembolso == true)
            return true;
        else
            return false;
    };
    
    $scope.ValidarCamposActividad = function () {
        if ($scope.Actividad.TipoCalendarioActividadID == undefined || $scope.Actividad.TipoCalendarioActividadID == null) {
            alertify.error("El tipo de la actividad es requerido.");
            return false;
        } else if ($scope.Actividad.FechaInicio == undefined || $scope.Actividad.FechaInicio == null || $scope.Actividad.FechaInicio == "") {
            alertify.error("La fecha de inicio es requerido.");
            return false;
        } else if ($scope.Actividad.UsuarioID == undefined || $scope.Actividad.UsuarioID == null || $scope.Actividad.UsuarioID == "") {
            alertify.error("El asesor comercial es requerido.");
            return false;
        } else if ($scope.Actividad.FechaVencimiento == undefined || $scope.Actividad.FechaVencimiento == null || $scope.Actividad.FechaVencimiento == "") {
            alertify.error("El fecha de vencimiento es requerido.");
            return false;
        }
        return true;
    };

    $scope.AbrirModalFinalizarActividad = function (item) {
        $scope.TituloActividad = "Finalización " + item.TipoCalendarioActividadNombre;
        $scope.Actividad = angular.copy(item);
        $scope.Actividad.DirIP = $scope.Usuario.Ip;
        $scope.Actividad.Usuario = $scope.Usuario.UsuarioID;
        $scope.Actividad.Token = $scope.Usuario.Token;
        angular.element("#modalFinalizarAcitivadCalendario").modal("show");
    };

    $scope.ConfigInputPromesaFinalizacion = {
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
            $scope.RutaPromesaVentaFinalizacion = "cdn://" + responseFile.CodigoUnico;            
        }
    };

    $scope.GuardarPromesaVentaFinalizacion = function () {
        if ($scope.RutaPromesaVentaFinalizacion == undefined || $scope.RutaPromesaVentaFinalizacion == null) {
            alertify.error("La promesa de venta es obligatoria.");
            return;
        }
        alertify.confirm("¿Desea guardar la promesa de venta?", function () {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesProcesosPromesaVenta",
                { RutaPromesaVenta: $scope.RutaPromesaVentaFinalizacion, InmuebleProcesoProcesoID: $scope.PreContacto.InmuebleCompra.InmuebleProcesoProcesoID},
                function (response) {
                    alertify.success(response.rows[0].Descripcion);
                    if ($scope.RutaPromesaVentaFinalizacion != undefined)
                        $scope.CommitCDN([$scope.RutaPromesaVentaFinalizacion.replaceAll("cdn://", "")]);
                    $scope.Sincronizar(function () {
                        angular.element("#modalPromesaVentaFinalizacion").modal("hide");
                        $scope.MostrarProgress(false);
                    });
                }
            );
        });
    };

    $scope.FinalizarActividad = function () {
       
        if ($scope.Actividad.ObservacionesCierre == null || $scope.Actividad.ObservacionesCierre == undefined) {
            alertify.error("Las observaciones de finalización es obligatoria.");
            return;
        }
        alertify.confirm("¿Desea finalizar la actividad " + $scope.Actividad.Asunto + "?", function () {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseSIS + "CalendariosActividades/CalendariosActividadesCerrar/",
                $scope.Actividad,
                function (response) {
                    alertify.success(response.rows[0].Descripcion);
                    if ($scope.Actividad.RutaPromesaVenta != undefined)
                        $scope.CommitCDN([$scope.Actividad.RutaPromesaVenta.replaceAll("cdn://", "")]);
                    $scope.Sincronizar(function () {
                        angular.element("#modalFinalizarAcitivadCalendario").modal("hide");
                        $scope.MostrarProgress(false);
                    });
                }
            );
        });
    };  

    
    
    $scope.InviabilizarInmueble = function (item) {
        if ($scope.InmuebleInviable.CausalInviabilidadProcesoID == null || $scope.InmuebleInviable.CausalInviabilidadProcesoID == undefined) {
            alertify.error("La causal de inviabilidad es obligatoria");
            return;
        }
        if ($scope.InmuebleInviable.ObservacionesInviabilidad == null || $scope.InmuebleInviable.ObservacionesInviabilidad == undefined) {
            alertify.error("La observaciones es obligatoria");
            return;
        }
        alertify.confirm("¿El cliente ya no le interesa el inmueble?", function () {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesProcesosActualizar/",
                $scope.InmuebleInviable,
                function (response) {
                    $scope.MostrarProgress(false);
                    angular.element("#ModalInviabilizarInmueble").modal("hide");
                    $scope.PreContacto.InmueblesProcesos = response.rows[0].data;
                }
            );
        });
    };

    $scope.ConstruirPopoverInmueble = function (_event, item) {
        if ($scope.elem != null)
            $scope.elem.popover("dispose");
        let _html = null;
        if (item == undefined)
            _html = 'No hay datos adicionales';
        else
            _html = '<div class="text-center">' +
                '<label class="control-label control-label-sm font-11">Inmueble N°' + item.InmuebleConsecutivo + '</label>' +
                '<button type="button" class="close pull-right" onclick="CerrarPopover(this)"><i class="fal fa-times"></i></button>' +
                '</div>' +
                '<div class="form-group font-11 mb-0">' +
                '<label class="control-label control-label-sm mb-1 font-10">Dirección: </label> ' + item.InmuebleDireccion +
                '</div>' +
                '<div class="form-group font-11 mb-0">' +
                '<label class="control-label control-label-sm mb-1 font-10">Baños: </label> ' + (item.Banos == null ? 0 : item.Banos) +
                '</div>' +
                '<div class="form-group font-11 mb-0">' +
                '<label class="control-label control-label-sm mb-1 font-10">Habitaciones: </label> ' + (item.Habitaciones == null ? 0 : item.Habitaciones) +
                '</div>' +
                '<div class="form-group font-11 mb-0">' +
                '<label class="control-label control-label-sm mb-1 font-10">Parqueaderos: </label> ' + (item.Parqueaderos == null ? 0 : item.Parqueaderos) +
                '</div>' +
                '<div class="form-group font-11 mb-0">' +
                '<label class="control-label control-label-sm mb-1 font-10">Tipo: </label> ' + (item.TipoInmueble == null ? "N/A" : item.TipoInmueble) +
                '</div>' +
                '<div class="form-group font-11 mb-0">' +
                '<label class="control-label control-label-sm mb-1 font-10">Visitas agendadas: </label> ' + item.CountActividades +
                '</div>' +
                '<div class="form-group font-11 mb-0">' +
                '<label class="control-label control-label-sm mb-1 font-10">Cupones generados: </label> ' + item.CountPreFacturas +
                '</div>';
        $scope.elem = $(_event.currentTarget).popover({
            container: 'body',
            html: true,
            placement: 'auto',
            sanitize: false,
            content: _html,
            boundary: 'viewport',
            trigger: 'click'
        });
        $scope.elem.popover("show");
    };  

    $scope.ConstruirPopoverProcesosInmuebles = function (_event, item) {
        if ($scope.elem != null)
            $scope.elem.popover("dispose");
        let _html = null;
        if (item == undefined)
            _html = 'No hay datos adicionales';
        else {
            _html = '<label class="control-label control-label-sm">Estado del inmueble en otros procesos comerciales</label>' +
                '<button type="button" class="close pull-right" onclick="CerrarPopover(this)"><i class="fal fa-times"></i></button>' +
                '<table class="table table-sm mb-0">' +
                '<thead style="background-color: #f0f3f3">' +
                '<tr>' +
                '<th>Contacto</th>' +
                '<th>Celular</th>' +
                '<th>Email</th>' +
                '<th>Asesor</th>' +
                '<th>Estado</th>' +
                '</tr>' +
                '</thead>' +
                '<tbody>';
            for (let i = 0; i < item.ProcesosAsociados.length; i++) {
                let elem = item.ProcesosAsociados[i];
                _html += '<tr ng-repeat="elem in item.ProcesosAsociados">' +
                    '<td>' + (elem.NombreCompleto == null ? '' : elem.NombreCompleto) + '</td>' +
                    '<td>' + (elem.Celular == null ? '' : elem.Celular) + '</td>' +
                    '<td>' + (elem.Email == null ? '' : elem.Email) + '</td>' +
                    '<td>' + (elem.AsesorNombreCompleto == null ? '' : elem.AsesorNombreCompleto) + '</td>' +
                    '<td>' + (elem.EstadoInmuebleProcesoProcesoNombre == null ? '' : elem.EstadoInmuebleProcesoProcesoNombre) + '</td>' +
                    '</tr>';
            }
            _html += '</tbody></table>';
        }

        $scope.elem = $(_event.currentTarget).popover({
            container: 'body',
            html: true,
            placement: 'auto',
            sanitize: false,
            content: _html,
            boundary: 'viewport',
            trigger: 'click'
        });
        $scope.elem.popover("show");
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

    $scope.AbrirLinkPaxzu = function (_paxzu) {
        if ($scope.configuracionWS.UrlPreview != null)
            window.open($scope.configuracionWS.UrlPreview + _paxzu);
    };

    $scope.SetField = function (field, obj) {
        $scope[field] = obj;
        let _item = $filter("filter")($scope.PreContacto.ActividadesCalendario, function (elem) { return elem.TipoCalendarioActividadID == $scope.PreContacto.ConfiguracionGBI.PromesaCompraventaTipoCalendarioActividadID }, true);
        if (_item.length > 0 && $scope.PreContacto.ConfiguracionGBI.PromesaCompraventaTipoCalendarioActividadID != null)
            $scope.ActividadPromesa = angular.copy(_item[0]);
        else
            $scope.ActividadPromesa = {};
        _item = $filter("filter")($scope.PreContacto.ActividadesCalendario, function (elem) { return elem.TipoCalendarioActividadID == $scope.PreContacto.ConfiguracionGBI.DesembolsoTipoCalendarioActividadID }, true);
        if (_item.length > 0 && $scope.PreContacto.ConfiguracionGBI.DesembolsoTipoCalendarioActividadID != null)
            $scope.ActividadDesembolso = angular.copy(_item[0]);
        else
            $scope.ActividadDesembolso = {};
        _item = $filter("filter")($scope.PreContacto.ActividadesCalendario, function (elem) { return elem.TipoCalendarioActividadID == $scope.PreContacto.ConfiguracionGBI.EscrituracionTipoCalendarioActividadID }, true);
        if (_item.length > 0 && $scope.PreContacto.ConfiguracionGBI.EscrituracionTipoCalendarioActividadID != null)
            $scope.ActividadEscrituracion = angular.copy(_item[0]);
        else
            $scope.ActividadEscrituracion = {};
    };

    window.Scope = $scope;
}]);
function CerrarPopover(_this) {
    angular.element(_this).closest(".popover").remove();
};