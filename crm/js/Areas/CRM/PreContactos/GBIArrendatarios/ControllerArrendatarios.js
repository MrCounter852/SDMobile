ERP.controller("ControllerArrendatarios", ['$scope', '$timeout', '$q', 'Services', '$filter', 'alertify', '$window', function ($scope, $timeout, $q, Services, $filter, alertify, $window) {
    $scope.MailModel = {};
    $scope.ModoView = 1;
    $scope.LocalConfigInmuebles = "Config_Inmuebles_" + $scope.Usuario.EmpresaID + "_" + $scope.Usuario.UsuarioID;
    $scope.TiposFacturacionCorretaje = [{ TipoFacturacion: 1, Nombre: "A todos los propietarios" }, { TipoFacturacion: 2, Nombre: "A un propietario" }];
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
        Fotos: false,
        UbicacionLlaves: false,
        TipoOferta: false
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

    $scope.Init = function () {
        $scope.MostrarProgress(true);
        $scope.ConsultarCombos(function () {
            $scope.MostrarProgress(false);
        });
    };

    $scope.ConsultarCombos = function (OnSuccess) {
        Services.Async(
            $scope.serviceBaseGBI + "TiposOfertas/TiposOfertasConsultar",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ TipoOfertaID: null, Nombre: "Todos" });
                $scope.TiposOfertas = response.rows;
            }
        );
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
            $scope.serviceBaseGBI + "ConfiguracionesInventarios/ConfiguracionesInventariosConsultar/",
            { Page: 0, Rows: 0, Activo: true, Token: $scope.Usuario.Token },
            function (response) {
                $scope.ConfiguracionesInventarios = response.rows;
                $scope.ConfiguracionesInventarios.unshift({ ConfiguracionInventarioID: null, TipoInmuebleNombre: " -- Seleccione -- " });
            }
        );
        Services.Async(
            $scope.serviceBaseGBI + "Configuraciones/ConfiguracionesConsultar/",
            { Token: $scope.Usuario.Token },
            function (response) {
                if (response.length > 0) {
                    $scope.Configuracion = response[0];
                    $scope.configuracionML = JSON.parse($filter('filter')($scope.Configuracion.ConfiguracionesPortalesInmobiliarios, function (elem) { return elem.PortalInmobiliarioID == 1 }, true)[0].DatosAcceso);
                    $scope.configuracionFR = JSON.parse($filter('filter')($scope.Configuracion.ConfiguracionesPortalesInmobiliarios, function (elem) { return elem.PortalInmobiliarioID == 3 }, true)[0].DatosAcceso);                    
                    $scope.configuracionWS = JSON.parse($filter('filter')($scope.Configuracion.ConfiguracionesPortalesInmobiliarios, function (elem) { return elem.PortalInmobiliarioID == 4 }, true)[0].DatosAcceso);                    
                    $scope.configuracionCC = JSON.parse($filter('filter')($scope.Configuracion.ConfiguracionesPortalesInmobiliarios, function (elem) { return elem.PortalInmobiliarioID == 5 }, true)[0].DatosAcceso);
                    $scope.configuracionMC = JSON.parse($filter('filter')($scope.Configuracion.ConfiguracionesPortalesInmobiliarios, function (elem) { return elem.PortalInmobiliarioID == 2 }, true)[0].DatosAcceso);
                } else {
                    $scope.Configuracion = {};
                    $scope.configuracionML = {};
                    $scope.configuracionFR = {};
                    $scope.configuracionWS = {};
                    $scope.configuracionCC = {};
                    $scope.configuracionMC = {};
                }
                if (OnSuccess)
                    OnSuccess();
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
            TipoOfertaID: 1,
            TipoPreContactoID: 4,
            EstadoInmuebleID: "1,2",
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
            if ($scope.PreContacto.PortalInmobiliarioID != null) {
                if ($scope.PreContacto.PortalInmobiliarioID == 1)
                    $scope.searchInventario.MercadoLibre = $scope.PreContacto.CodigoPortal;
                else if ($scope.PreContacto.PortalInmobiliarioID == 2)
                    $scope.searchInventario.MetroCuadrado = $scope.PreContacto.CodigoPortal;
                else
                    $scope.searchInventario.FincaRaiz = $scope.PreContacto.CodigoPortal;
            }
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
    $scope.ConsultarInmueblesInventarios = function () {
        $scope.Inventario.InmuebleInventarioID = null
        Services.Async(
            $scope.serviceBaseGBI + "InmueblesInventarios/InmueblesInventariosConsultar/",
            { Rows: 0, Page: 0, InmuebleID: $scope.Inventario.InmuebleID},
            function (response) {
                $scope.InventariosInmuebles = response.rows;
                $scope.InventariosInmuebles.unshift({ InmuebleInventarioID: null, Nombre: "Ninguno" });
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
                return $itemScope.item.EstadoProcesoInmuebleID == 1 && $itemScope.item.Reservado == false;
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
                return $itemScope.item.EstadoProcesoInmuebleID == 4 && $itemScope.item.Reservado == true;
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
                    TipoCalendarioActividadID: $scope.Configuracion.VisitaComercialTipoCalendarioActividadID,
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
                return $itemScope.item.EstadoProcesoInmuebleID == 1 || ($itemScope.item.EstadoProcesoInmuebleID == 4 && $itemScope.item.Reservado == true);
            }
        },
        {
            text: '<i class="fal fa-envelope-open-dollar orange"></i>&nbsp;&nbsp;Generar cupon de separación',
            click: function ($itemScope) {
                $scope.CupoPago = angular.extend({}, $scope.PreContacto, $itemScope.item);
                $scope.CupoPago.DirIP = $scope.Usuario.Ip;                
                $scope.CupoPago.Usuario = $scope.Usuario.UsuarioID;
                $scope.CupoPago.Token = $scope.Usuario.Token;
                $scope.CupoPago.PSE = true;
                $scope.CupoPago.EnviarCuponPago = true;
                $scope.CupoPago.FechaCreacion = moment().format("DD/MM/YYYY");
                $scope.CupoPago.FechaVencimiento = moment().format("DD/MM/YYYY");
                $scope.Titulo = "Generar cupon de pago";
                $scope.MostrarHeaderPrincipal(false);
                $scope.ModoView = 3;
                $scope.MostrarProgress(false);
            },
            enabled: function ($itemScope) {
                return $itemScope.item.EstadoProcesoInmuebleID == 1 || ($itemScope.item.EstadoProcesoInmuebleID == 4 && $itemScope.item.Reservado == true);
            }
        },
        {
            text: function ($itemScope) { return $itemScope.item.Corretaje == false ? '<i class="fal fa-ballot-check blue"></i>&nbsp;&nbsp;Iniciar arrendamiento' : '<i class="fal fa-ballot-check blue"></i>&nbsp;&nbsp;Iniciar proceso de corretaje' },
            click: function ($itemScope) {
                alertify.confirm($itemScope.item.Corretaje == false ? "¿Desea inciar el proceso de arrendamiento del inmueble?" : "¿Desea inciar el proceso de corretaje del inmueble?", function () {
                    let _elem = angular.copy($itemScope.item);
                    _elem.DirIP = $scope.Usuario.Ip;
                    _elem.Usuario = $scope.Usuario.UsuarioID;
                    _elem.Token = $scope.Usuario.Token;                    
                    Services.Async(
                        $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesProcesosIniciarArrendamiento/",
                        _elem,
                        function (response) {
                            $scope.PreContacto.InmueblesProcesos = response.rows[0].data;
                            $scope.PreContacto.Inmueble = $filter("filter")($scope.PreContacto.InmueblesProcesos, function (elem) { return elem.InmuebleEnGestion == true }, true)[0];
                        }
                    );
                });                
            },
            displayed: function ($itemScope) {
                return !$scope.ShowCargueDocumentos();
            },
            enabled: function ($itemScope) {
                return $itemScope.item.Interesado == true && ($itemScope.item.EstadoProcesoInmuebleID == 1 || ($itemScope.item.EstadoProcesoInmuebleID == 4 && $itemScope.item.Reservado));
            }
        },        
        {
            text: function ($itemScope) { return $itemScope.item.Corretaje == false ? '<i class="fal fa-trash-undo-alt red"></i>&nbsp;&nbsp;Reversar proceso arrendamiento' : '<i class="fal fa-trash-undo-alt red"></i>&nbsp;&nbsp;Reversar proceso de corretaje' },
            click: function ($itemScope) {
                alertify.confirm($itemScope.item.Corretaje == false ? "¿Desea reversar el proceso de arrendamiento del inmueble?" : "¿Desea reversar el proceso de corretaje del inmueble?", function () {
                    $scope.MostrarProgress(true);
                    let _elem = angular.copy($itemScope.item);
                    _elem.DirIP = $scope.Usuario.Ip;
                    _elem.Usuario = $scope.Usuario.UsuarioID;
                    _elem.Token = $scope.Usuario.Token;
                    Services.Async(
                        $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesProcesosReversarArrendamiento/",
                        _elem,
                        function (response) {
                            $scope.PreContacto.InmueblesProcesos = response.rows[0].data;
                            $scope.Sincronizar(function () {                                
                                $scope.MostrarProgress(false);
                            });
                        }
                    );
                });
            },
            displayed: function ($itemScope) {
                return ($filter("filter")($scope.PreContacto.InmueblesProcesos, function (elem) { return elem.EstadoInmuebleProcesoProcesoID == 5; }, true).length > 0 ? true : false) && ($filter("filter")($scope.PreContacto.Contratos, function (elem) { return elem.Anulado == false }, true).length > 0 ? false : true);
            },
            enabled: function ($itemScope) {
                return $itemScope.item.Interesado && (($itemScope.item.EstadoProcesoInmuebleID == 1 || $itemScope.item.EstadoProcesoInmuebleID == 6) || ($itemScope.item.EstadoProcesoInmuebleID == 4 && $itemScope.item.Reservado));
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

    $scope.FilterInmueblesProcesos = function (value, index, array) {
        return (value.EstadoProcesoInmuebleID == 1 || value.EstadoProcesoInmuebleID == 4 || value.EstadoProcesoInmuebleID == 5)
    };

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

    $scope.ShowCargueDocumentos = function () {
        return $filter("filter")($scope.PreContacto.InmueblesProcesos, function (elem) { return elem.EstadoInmuebleProcesoProcesoID >= 5; }, true).length > 0 ? true : false;
    };   

    $scope.CountDocumentos = function (value, index) {
        return value.Ruta != null;        
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

    $scope.ddlSearchPaisesArrendatario = {
        onSelect: function (item) {
            $scope.Documento.PaisCodigoISO = (item.CodigoISO == null ? "" : item.CodigoISO).toLowerCase();
            $scope.Documento.ClientePaisCodigoISO = $scope.Documento.PaisCodigoISO;
            if ($scope.Documento.PaisCodigoISO != 'co')
                $scope.Documento.ClienteCiudadID = null;
        }
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
        if (($scope.CupoPago.ClientePaisCodigoISO == null ? "" : $scope.CupoPago.ClientePaisCodigoISO).toLowerCase() == 'co') {
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

    $scope.ModificarInventarioInmueble = function (elem) {
        if (elem.InmuebleInventarioID != null) {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseGBI + "InmueblesInventarios/InmueblesInventariosDetalladoConsultar/",
                { InmuebleInventarioID: elem.InmuebleInventarioID },
                function (response) {
                    angular.forEach($scope.Inventario.ContratosInventariosItems, function (elem) {
                        elem.Eliminar = true;
                        angular.forEach(elem.__children__, function (elem2) {
                            elem2.Eliminar = true;
                        });
                    });
                    angular.forEach($scope.Inventario.ContratosInventariosFotos, function (elem) {
                        elem.Eliminar = true;
                    });
                    angular.forEach(response.data.InmueblesInventariosItems, function (elem) {
                        $scope.Inventario.ContratosInventariosItems.push(elem);
                    });
                    $scope.Inventario.ConfiguracionInventarioID = response.data.ConfiguracionInventarioID;
                    $scope.Inventario.Video = response.data.Video;
                    $scope.Inventario.Observaciones = response.data.Observaciones;
                    angular.forEach($scope.Inventario.ContratosInventariosItems, function (elem) {
                        if (!elem.Eliminar)
                            elem.Eliminar = false;
                        angular.forEach(elem.__children__, function (elem2) {
                            if (!elem2.Eliminar) {
                                elem2.ID = $scope.Guid();
                                elem2.Eliminar = false;
                                elem2.EntregaEstado = elem2.ReciboEstado
                                elem2.EntregaObservaciones = elem2.ReciboObservaciones
                            }
                        });
                    });
                    $scope.MostrarProgress(false);
                }
            );
        }
        else
            $scope.Inventario = {
                DirIP: $scope.Usuario.Ip,
                Usuario: $scope.Usuario.UsuarioID,
                ContratoID: null,
                ContratoInventarioID: null,
                ConfiguracionInventarioID: null,
                UsuarioID: $scope.Usuario.UsuarioID,
                Video: null,
                Observaciones: null,
                ContratosInventariosFotos: [],
                ContratosInventariosItems: [],
                Token: $scope.Usuario.Token
            };
    };

    $scope.GenerarCuponPago = function () {
        if ($scope.ValidarCupoPago()) {
            alertify.confirm("¿Desea generar el cupon de pago?", function () {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseFAC + "FacturasInmuebles/GenerarCuponPagoSeparacionInmuebles/",
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
                _html += '<tr>' +
                                '<td>' + (elem.NombreCompleto == null ? '' : elem.NombreCompleto) + '</td>' +
                                '<td>' + (elem.Celular == null ? '' : elem.Celular) + '</td>' +
                                '<td>' + (elem.Email == null ? '' : elem.Email) + '</td>' +
                                '<td>' + (elem.AsesorNombreCompleto  == null ? '' : elem.AsesorNombreCompleto) + '</td>' +
                                '<td>' + (elem.EstadoInmuebleProcesoProcesoNombre == null ? '' : elem.EstadoInmuebleProcesoProcesoNombre) + '</td>' +
                            '</tr>';
            }
            _html += '</tbody></table>';
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
        }
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

    $scope.AbrirCargarDocumentos = function () {
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesProcesosDocumentosConsultar/",
            { InmuebleProcesoProcesoID: $scope.PreContacto.Inmueble.InmuebleProcesoProcesoID, Token: $scope.Usuario.Token },
            function (response) {
                $scope.Documento = angular.extend({}, response.data);
                $scope.Documento.DirIP = $scope.Usuario.Ip;                
                $scope.Documento.Usuario = $scope.Usuario.UsuarioID;
                $scope.Documento.Token = $scope.Usuario.Token;
                $scope.Documento.DespublicarInmuebles = true;
                if ($scope.Documento.ClienteTipoPersonaID == null)
                    $scope.Documento.ClienteTipoPersonaID = $filter("filter")($scope.TiposPersonas, function (elem) { return elem.DefaultPersonas == true }, true)[0].TipoPersonaID;                
                angular.forEach($scope.Documento.ConfiguracionesDocumentosContratos, function (elem) {
                    elem.Eliminar = false;
                });
                angular.forEach($scope.Documento.ProcesosDocumentos, function (elem) {
                    elem.Eliminar = false;                    
                });
                $scope.ChangeTipoPersona($scope.Documento);
                angular.forEach($scope.Documento.ProcesosCodeudores, function (elem) {
                    elem.Eliminar = false;
                    $scope.ChangeTipoPersona(elem, "TipoPersonaID");
                    angular.forEach(elem.ProcesosDocumentos, function (elem2) {
                        elem2.Eliminar = false;
                    });
                });
                if ($scope.PreContacto.Inmueble.Corretaje == false)
                    $scope.Titulo = "Solicitud de contrato";
                else
                    $scope.Titulo = "Documentación del corretaje";
                $scope.MostrarHeaderPrincipal(false);
                $scope.ModoView = 4;
                $scope.MostrarProgress(false);
            }
        );       
    };

    $scope.searchAseguradoras = function (term, modelID) {
        var deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseGBI + "Aseguradoras/AseguradorasConsultar/",
            { Rows: 30, Page: 1, FullSearch: term, AseguradoraID: modelID, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ AseguradoraID: null, NombreCompleto: "SIN SEGURO" });
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.ddlSearchAseguradoras = {
        autoExpand: true,
        onSelect: function (elem) {
            if ($scope.Documento.ArrendamientoAseguradoraID == null) {
                $scope.Documento.ArrendamientoNoPoliza = null;
                $scope.Documento.ArrendamientoNoSolicitudPoliza = null;
            }
        }
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
            /*if (_file.size > 2000000) {
                alertify.error("El archivo no puede superar los 2MB.");
                return false;
            }*/
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

    $scope.VerArchivo = function (elem) {
        if (elem.Ruta == undefined && elem.Base64 == undefined) {
            alertify.error("No se ha cargado un archivo");
        } else if (elem.MimeType != undefined && elem.Ruta == null) {
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

    $scope.AgregarDeudorSolidario = function () {
        let _TipoPersona = $filter("filter")($scope.TiposPersonas, function (elem) { return elem.DefaultPersonas == true }, true)[0];
        $scope.Codeudor = {
            InmuebleProcesoProcesoCodeudorID: null,
            TipoDocumentoID: null,
            Documento: null,
            Nombres: null,
            Nombres2: null,
            Apellidos: null,
            Apellidos2: null,
            TipoPersonaID: _TipoPersona.TipoPersonaID,
            Celular: null,
            Email: null,            
            Eliminar: false
        };
        $scope.ChangeTipoPersona($scope.Codeudor, "TipoPersonaID");
        $scope.Codeudor.ProcesosDocumentos = $filter('filter')($scope.Documento.ConfiguracionesDocumentosContratos, function (elem) { return elem.GrupoPersonaID == 3 && (elem.TipoPersonaID == $scope.Codeudor.TipoPersonaID || elem.TipoPersonaID == null); }, true);
        $scope.Documento.ProcesosCodeudores.push(angular.copy($scope.Codeudor));
    };

    $scope.QuitarCodeudor = function (item, index) {
        alertify.confirm("¿Desea quitar el deudor solidario " + (item.Nombres == null ? (index + 1) : item.Nombres) + (item.Apellidos == null ? "" : " " + item.Apellidos) + "?", function () {
            if (item.InmuebleProcesoProcesoCodeudorID == null)
                $scope.Documento.ProcesosCodeudores.splice(index, 1);
            else
                item.Eliminar = true;
        });
    };

    $scope.BuscarTerceroArrendatario = function (documento) {
        $scope.BuscarTercero(documento, null, null, null, function () {
            $scope.Documento.PaisCodigoISO = $scope.Documento.ClientePaisCodigoISO;
            $scope.ChangeTipoPersonaDocumentos(documento, 'ClienteTipoPersonaID', 2);
        });
    };

    $scope.ChangeTipoPersonaDocumentos = function (_model, _fieldTipoPersonaID, _grupoPersonaID) {
        let _tipoPersonaID = _model[_fieldTipoPersonaID];
        if (_tipoPersonaID != null) {
            let _arrayDocumentos = $filter('filter')($scope.Documento.ConfiguracionesDocumentosContratos, function (elem) { return elem.GrupoPersonaID == _grupoPersonaID && (elem.TipoPersonaID == _tipoPersonaID || elem.TipoPersonaID == null); }, true);
            if (_model.ProcesoID == undefined) {
                if ($filter("filter")(_model.ProcesosDocumentos, function (elem) { return elem.TipoPersonaID == _tipoPersonaID; }, true).length == 0) {
                    for (let i = 0; i < _model.ProcesosDocumentos.length; i++) {
                        if (_model.ProcesosDocumentos[i].InmuebleProcesoProcesoDocumentoID == null) {
                            _model.ProcesosDocumentos.splice(i, 1);
                            i--;
                        } else
                            _model.ProcesosDocumentos[i].Eliminar = true;
                    }
                    for (let i = 0; i < _arrayDocumentos.length; i++) 
                        _model.ProcesosDocumentos.push(_arrayDocumentos[i]);                    
                }
            } else {
                if ($filter("filter")($scope.Documento.ProcesosDocumentos, function (elem) { return elem.GrupoPersonaID == 2 && elem.TipoPersonaID == _tipoPersonaID; }, true).length == 0) {
                    for (let i = 0; i < $scope.Documento.ProcesosDocumentos.length; i++) {
                        if ($scope.Documento.ProcesosDocumentos[i].GrupoPersonaID == 2) {
                            if ($scope.Documento.ProcesosDocumentos[i].InmuebleProcesoProcesoDocumentoID == null) {
                                $scope.Documento.ProcesosDocumentos.splice(i, 1);
                                i--;
                            } else
                                $scope.Documento.ProcesosDocumentos[i].Eliminar = true;
                        }
                    }
                    for (let i = 0; i < _arrayDocumentos.length; i++)
                        $scope.Documento.ProcesosDocumentos.push(_arrayDocumentos[i]);
                }
            }
        }
    };

    $scope.ValidarDocumentos = function () {
        if ($scope.PreContacto.Inmueble.Corretaje == false) {
            for (let i = 0; i < $scope.Documento.ProcesosDocumentos.length; i++) {
                let _elem = $scope.Documento.ProcesosDocumentos[i];
                if (_elem.GrupoPersonaID == 1) {
                    if ((_elem.Ruta == undefined || _elem.Ruta == null || _elem.Ruta == "") && _elem.Requerido == true) {
                        alertify.error("El archivo " + _elem.Nombre + " es requerido.");
                        return false;
                    }
                }
            }
            if ($scope.Documento.ArrendamientoFechaInicio == undefined || $scope.Documento.ArrendamientoFechaInicio == null || $scope.Documento.ArrendamientoFechaInicio == "") {
                alertify.error("La fecha de inicio es obligatoria.");
                return false;
            }
            if ($scope.Documento.ArrendamientoDuracion == undefined || $scope.Documento.ArrendamientoDuracion == null || $scope.Documento.ArrendamientoDuracion == 0) {
                alertify.error("La duración del contrato es obligatoria.");
                return false;
            }
            if ($scope.Documento.ArrendamientoValorCanon == undefined || $scope.Documento.ArrendamientoValorCanon == null) {
                alertify.error("El valor del canon es obligatorio.");
                return false;
            }
            if ($scope.Documento.ArrendamientoAseguradoraID != null) {
                if ($scope.Documento.ArrendamientoNoPoliza == undefined || $scope.Documento.ArrendamientoNoPoliza == null) {
                    alertify.error("Debe ingresar el No de poliza del arrendatario");
                    return false;
                }
                if ($scope.Documento.ArrendamientoNoSolicitudPoliza == undefined || $scope.Documento.ArrendamientoNoSolicitudPoliza == null) {
                    alertify.error("Debe ingresar No solicitud de poliza del arrendatario");
                    return false;
                }
            }
            if ($scope.Documento.ClienteTipoDocumentoID == undefined || $scope.Documento.ClienteTipoDocumentoID == null) {
                alertify.error("Debe seleccionar un tipo de documento del arrendatario");
                return false;
            }
            if ($scope.Documento.ClienteDocumento == undefined || $scope.Documento.ClienteDocumento == null || $scope.Documento.ClienteDocumento == "") {
                alertify.error("Debe ingresar un numero de documentos del arrendatario");
                return false;
            }
            if ($scope.Documento.ClienteTipoPersonaID == undefined || $scope.Documento.ClienteTipoPersonaID == null) {
                alertify.error("El tipo de persona del arrendatario es obligatorio.");
                return false;
            }
            if ($scope.Documento.ClienteNombres == undefined || $scope.Documento.ClienteNombres == null || $scope.Documento.ClienteNombres == "") {
                alertify.error("El nombre del arrendatario es obligatorio.");
                return false;
            }
            let _empresa = $filter('filter')($scope.TiposPersonas, function (elem) { return elem.TipoPersonaID == $scope.Documento.ClienteTipoPersonaID }, true)[0].Empresa;
            if (_empresa == false) {
                if ($scope.Documento.ClienteApellidos == undefined || $scope.Documento.ClienteApellidos == null || $scope.Documento.ClienteApellidos == "") {
                    alertify.error("El apellido del arrendatario es obligatorio.");
                    return false;
                }
            }
            if ($scope.Documento.ClienteDireccion == undefined || $scope.Documento.ClienteDireccion == null || $scope.Documento.ClienteDireccion == "") {
                alertify.error("Debe ingresar la dirección del arrendatario es obligatorio");
                return false;
            }
            if ($scope.Documento.ClienteCelular == undefined || $scope.Documento.ClienteCelular == null || $scope.Documento.ClienteCelular == "") {
                alertify.error("Debe ingresar el celular del arrendatario es obligatorio");
                return false;
            }
            if ($scope.Documento.ClienteEmailFacturacionElectronica == undefined || $scope.Documento.ClienteEmailFacturacionElectronica == null || $scope.Documento.ClienteEmailFacturacionElectronica == "") {
                alertify.error("Debe ingresar el email de facturacion electronica del arrendatario es obligatorio");
                return false;
            }
            if ($scope.Documento.ClienteEmail == undefined || $scope.Documento.ClienteEmail == null || $scope.Documento.ClienteEmail == "") {
                alertify.error("Debe ingresar el email del arrendatario es obligatorio");
                return false;
            }
            if ($scope.Documento.ClientePaisID == undefined || $scope.Documento.ClientePaisID == null) {
                alertify.error("El pais del arrendatario es obligatoria.");
                return false;
            }
            if (($scope.Documento.PaisCodigoISO == null ? "" : $scope.Documento.PaisCodigoISO).toLowerCase() == 'co') {
                if ($scope.Documento.ClienteCiudadID == undefined || $scope.Documento.ClienteCiudadID == null) {
                    alertify.error("La ciudad del arrendatario es obligatoria.");
                    return false;
                }
            } else {
                $scope.Documento.ClienteCiudadID = null;
            }
            for (let i = 0; i < $scope.Documento.ProcesosDocumentos.length; i++) {
                let _elem = $scope.Documento.ProcesosDocumentos[i];
                if (_elem.GrupoPersonaID == 2) {
                    if ((_elem.Ruta == undefined || _elem.Ruta == null || _elem.Ruta == "") && _elem.Requerido == true) {
                        alertify.error("El archivo " + _elem.Nombre + " del arrendatario es requerido.");
                        return false;
                    }
                }
            }
            for (let i = 0; i < $scope.Documento.ProcesosCodeudores.length; i++) {
                let _codeudor = $scope.Documento.ProcesosCodeudores[i];
                if (_codeudor.Eliminar == false) {
                    if (_codeudor.TipoDocumentoID == undefined || _codeudor.TipoDocumentoID == null) {
                        alertify.error("Debe seleccionar un tipo de documento es obligatorio");
                        return false;
                    }
                    if (_codeudor.Documento == undefined || _codeudor.Documento == null || _codeudor.Documento == "") {
                        alertify.error("Debe ingresar un numero de documentos del DEUDOR SOLIDARIO " + (i + 1));
                        return false;
                    }
                    if (_codeudor.TipoPersonaID == undefined || _codeudor.TipoPersonaID == null) {
                        alertify.error("El tipo de persona del DEUDOR SOLIDARIO " + (i + 1) + " es obligatorio.");
                        return false;
                    }
                    if (_codeudor.Nombres == undefined || _codeudor.Nombres == null || _codeudor.Nombres == "") {
                        alertify.error("El nombre del DEUDOR SOLIDARIO " + (i + 1) + " es obligatorio.");
                        return false;
                    }
                    let _empresa = $filter('filter')($scope.TiposPersonas, function (elem) { return elem.TipoPersonaID == _codeudor.TipoPersonaID }, true)[0].Empresa;
                    if (_empresa == false) {
                        if (_codeudor.Apellidos == undefined || _codeudor.Apellidos == null || _codeudor.Apellidos == "") {
                            alertify.error("El apellido del DEUDOR SOLIDARIO " + (i + 1) + " es obligatorio.");
                            return false;
                        }
                    }
                    if (_codeudor.Email == undefined || _codeudor.Email == null || _codeudor.Email == "") {
                        alertify.error("Debe ingresar el email del DEUDOR SOLIDARIO " + (i + 1) + " es obligatorio");
                        return false;
                    }
                    if (_codeudor.Direccion == undefined || _codeudor.Direccion == null || _codeudor.Direccion == "") {
                        alertify.error("Debe ingresar la dirección del DEUDOR SOLIDARIO " + (i + 1) + " es obligatorio");
                        return false;
                    }
                    if (_codeudor.Celular == undefined || _codeudor.Celular == null || _codeudor.Celular == "") {
                        alertify.error("Debe ingresar el celular del DEUDOR SOLIDARIO " + (i + 1) + " es obligatorio");
                        return false;
                    }
                    for (let j = 0; j < _codeudor.ProcesosDocumentos.length; j++) {
                        let _elem = _codeudor.ProcesosDocumentos[j];
                        if (_elem.GrupoPersonaID == 3) {
                            if ((_elem.Ruta == undefined || _elem.Ruta == null || _elem.Ruta == "") && _elem.Requerido == true) {
                                alertify.error("El archivo " + _elem.Nombre + " del DEUDOR SOLIDARIO " + (i + 1) + " es requerido.");
                                return false;
                            }
                        }
                    }
                }
            }
            return true;
        } else
            return true;
    };

    $scope.GuardarProcesosDocumentos = function () {
        if ($scope.ValidarDocumentos()) {
            alertify.confirm("¿Desea guardar los cambios sobre los documentos?", function () {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesProcesosDocumentosActualizar/",
                    $scope.Documento,
                    function (response) {
                        alertify.success(response.rows[0].Descripcion);
                        let _arrayFiles = [], _arrayDeleteFiles = [];
                        angular.forEach($scope.Documento.ProcesosDocumentos, function (elem) {
                            if (elem.Eliminar == false && elem.Ruta != null)
                                _arrayFiles.push((elem.Ruta == null ? "" : elem.Ruta).replaceAll("cdn://", ""));
                            if (elem.RutaVieja != null && elem.Eliminar == false)
                                _arrayDeleteFiles.push({ CodigoUnico: (elem.RutaVieja == null ? "" : elem.RutaVieja).replaceAll("cdn://", "") });
                            if (elem.Eliminar == true && elem.Ruta != null)
                                _arrayDeleteFiles.push({ CodigoUnico: (elem.Ruta == null ? "" : elem.Ruta).replaceAll("cdn://", "") });
                        });
                        angular.forEach($scope.Documento.ProcesosCodeudores, function (codeudor) {
                            angular.forEach(codeudor.ProcesosDocumentos, function (elem) {
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
                        $scope.Documento = angular.extend({}, response.rows[0].data);
                        $scope.Documento.DirIP = $scope.Usuario.Ip;
                        $scope.Documento.Usuario = $scope.Usuario.UsuarioID;
                        $scope.Documento.Token = $scope.Usuario.Token;
                        if ($scope.Documento.ClienteTipoPersonaID == null)
                            $scope.Documento.ClienteTipoPersonaID = $filter("filter")($scope.TiposPersonas, function (elem) { return elem.DefaultPersonas == true }, true)[0].TipoPersonaID;
                        $scope.ChangeTipoPersona($scope.Documento);
                        angular.forEach($scope.Documento.ConfiguracionesDocumentosContratos, function (elem) {
                            elem.Eliminar = false;
                        });
                        angular.forEach($scope.Documento.ProcesosDocumentos, function (elem) {
                            elem.Eliminar = false;
                        });
                        angular.forEach($scope.Documento.ProcesosCodeudores, function (elem) {
                            elem.Eliminar = false;
                            $scope.ChangeTipoPersona(elem, "TipoPersonaID");
                            angular.forEach(elem.ProcesosDocumentos, function (elem2) {
                                elem2.Eliminar = false;
                            });
                        });
                        $scope.Sincronizar(function () {                            
                            $scope.PreContacto.ShowDocumentos = true;
                            $scope.MostrarProgress(false);
                        });
                    }
                );
            });
        }
    };

    $scope.EnviarElaboracionContrato = function () {
        alertify.confirm("¿Desea enviar el proceso a elaboración de contrato?", function () {
            $scope.PreContacto.Inmueble.DirIP = $scope.Usuario.Ip;
            $scope.PreContacto.Inmueble.Usuario = $scope.Usuario.UsuarioID;
            $scope.PreContacto.Inmueble.Token = $scope.Usuario.Token;
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesProcesosEnviarOperaciones/",
                $scope.PreContacto.Inmueble,
                function (response) {
                    alertify.success(response.rows[0].Descripcion);               
                    $scope.Sincronizar(function () {                        
                        $scope.MostrarProgress(false);
                    });
                }
            );
        });
    };

    $scope.OnCloseVentanaInmueble = function (IsEdicion) {
        $scope.MostrarProgress(true);
        $scope.Sincronizar(function () {            
            $scope.MostrarProgress(false);
        });
    };

    $scope.VerFichaInmueble = function (elem) {
        $scope.viewer.Open(window.location.origin + "/GBI/InmueblesGBI/Visualizar?UniqueID=" + elem.UniqueID);
    }; 

    $scope.AbrirModalMailFactura = function (elem) {
        $scope.MailModel.Asunto = "Factura N°." + elem.Prefijo + elem.Consecutivo + " " + elem.NombreCompleto;
        $scope.MailModel.Destinatarios = elem.Email;
        $scope.MailModel.Adjuntos = [{
            Ruta: $scope.serviceBaseFAC + "PDFs/DocumentoB?TipoDocumentoID=1&UniqueID=" + elem.UniqueID + "&Attachment=true",
            Nombre: "Factura_N°_" + elem.Prefijo + elem.Consecutivo + ".pdf",
            NombreArchivo: "Factura_N°_" + elem.Prefijo + elem.Consecutivo + ".pdf",
            Tipo: 2,
            Token: $scope.Usuario.Token
        }];
        $scope.MailModel.Open();
    };

    $scope.DescargarDocumentos = function (item) {
        if (item.Ruta != null)
            window.open(item.Ruta.replaceAll("false", "true"));
        else
            window.open(item.RutaVirtual.replaceAll("false", "true"));
    };

    $scope.AbrirGenerarInventario = function () {
        $scope.Inventario = {
            DirIP: $scope.Usuario.Ip,
            Usuario: $scope.Usuario.UsuarioID,
            ContratoID: null,
            ContratoInventarioID: null,
            InmuebleInventarioID: null,
            ConfiguracionInventarioID: null,
            UsuarioID: $scope.Usuario.UsuarioID,
            Video: null,
            Observaciones: null,
            ContratosInventariosFotos: [],
            ContratosInventariosItems: [],
            Token: $scope.Usuario.Token
        };
        if ($scope.PreContacto.Contratos.length > 0) {
            $scope.Inventario.ContratoID = $scope.PreContacto.Contratos[0].ContratoID;
            $scope.Inventario.InmuebleID = $scope.PreContacto.Contratos[0].InmuebleID;
            $scope.ConsultarInmueblesInventarios()
        }
        $scope.Titulo = "Generar inventario de entrega";
        $scope.MostrarHeaderPrincipal(false);
        $scope.ModoView = 5;
    };

    $scope.SetField = function (field, obj) {
        $scope[field] = obj;
        $scope.PreContacto.Inmueble = $filter("filter")($scope.PreContacto.InmueblesProcesos, function (elem) { return elem.InmuebleEnGestion == true }, true)[0];        
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
                ContratoInventarioFotoID: null,
                Nombre: _file.name,
                Orden: $scope.Inventario.ContratosInventariosFotos.length + 1,
                Ruta: "cdn://" + response.CodigoUnico,
                Eliminar: false
            };
            $scope.Inventario.ContratosInventariosFotos.push(angular.copy(_foto));
        }
    };

    $scope.EliminarPhoto = function (_item, _index) {
        alertify.confirm("¿Desea eliminar la foto del inventario?", function () {
            if (_item.ContratoInventarioFotoID == null) {
                $scope.EliminarArchivoCDN([{ CodigoUnico: _item.Ruta.replaceAll("cdn://", "") }], function (response) {
                    $scope.Inventario.ContratosInventariosFotos.splice(_index, 1);
                });
            } else
                _item.Eliminar = true;
        });
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
                        ContratoInventarioFotoID: null,
                        Nombre: $scope.Imagen.Nombre,
                        Orden: $scope.Inventario.ContratosInventariosFotos.length + 1,
                        Ruta: "cdn://" + response.data[0].CodigoUnico,
                        Eliminar: false
                    };
                    let _array = angular.copy($scope.Inventario.ContratosInventariosFotos);
                    _array.splice($scope.FotoInmuebleIndex, 0, angular.copy(_foto));
                    $scope.Inventario.ContratosInventariosFotos = _array;
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

    $scope.ChangeConfiguracionesInventarios = function () {
        if ($scope.Inventario.ConfiguracionInventarioID != null) {
            $scope.MostrarProgress(true);            
            angular.forEach($scope.Inventario.ContratosInventariosItems, function (elem) {
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
                            elem2.EntregaEstado = null;
                            elem2.ID = $scope.Guid();
                        });
                        $scope.Inventario.ContratosInventariosItems.push(elem);
                    });
                    $scope.MostrarProgress(false);
                }
            );
        } else {            
            angular.forEach($scope.Inventario.ContratosInventariosItems, function (elem) {
                elem.Eliminar = true;
                angular.forEach(elem.__children__, function (elem2) {
                    elem2.Eliminar = true;
                });
            });
        }
    };

    $scope.FinishRenderPhotos = function () {
        baguetteBox.run('.tz-gallery');
    };

    $scope.DuplicarSinDatos = function (elem, index) {
        let _elem = angular.copy(elem);
        _elem.ContratoInventarioItemID = null;
        _elem.Nombre = _elem.Nombre + " (Duplicado)";
        _elem.DependeID = null;
        _elem.Eliminar = false;
        angular.forEach(_elem.__children__, function (item) {
            item.ContratoInventarioItemID = null;
            item.Cantidad = null;
            item.TipoMaterial = null;
            item.DependeID = null;
            item.EntregaEstado = null;
            item.ID = $scope.Guid();
            item.EntregaObservaciones = null;
            item.Eliminar = false; 
        });
        $scope.Inventario.ContratosInventariosItems.splice(index + 1, 0, _elem);
    };

    $scope.DuplicarConDatos = function (elem, index) {
        let _elem = angular.copy(elem);
        _elem.ContratoInventarioItemID = null;
        _elem.Nombre = _elem.Nombre + " (Duplicado)";
        _elem.DependeID = null;
        _elem.Eliminar = false;
        angular.forEach(_elem.__children__, function (item) {
            item.ContratoInventarioItemID = null;            
            item.DependeID = null;            
            item.ID = $scope.Guid();            
            item.Eliminar = false;
        });
        $scope.Inventario.ContratosInventariosItems.splice(index + 1, 0, _elem);
    };

    $scope.QuitarConcepto = function (elem, index) {
        if (elem.ContratoInventarioItemID == null)
            $scope.Inventario.ContratosInventariosItems.splice(index, 1);
        else {
            elem.Eliminar = true;
            angular.forEach(elem.__children__, function (elem2) {
                elem2.Eliminar = true;
            });
         }
    };

    $scope.EliminarAtributo = function (elem, index, item) {
        if (elem.ContratoInventarioItemID == null)
            item.__children__.splice(index, 1);
        else 
            elem.Eliminar = true;
        if ($filter("filter")(item.__children__, function (obj) { return obj.Eliminar == false }, true).length == 0) 
            item.Eliminar = true;
    };

    $scope.AgregarNuevoAtributo = function (elem, index) {
        let _elem = {
            ContratoInventarioItemID: null,
            Cantidad: null,
            Nombre: "Nuevo atributo",
            TipoMaterial: null,
            EntregaEstado: null,
            ID: $scope.Guid(),
            EntregaObservaciones: null,
            DependeID: null,
            Eliminar: false,
            __children__: [],
        };       
        elem.__children__.push(_elem);
    };

    $scope.DuplicarSinDatosAtributo = function (atri, index, elem) {
        let _elem = angular.copy(atri);
        _elem.ContratoInventarioItemID = null;
        _elem.Cantidad = null;
        _elem.Nombre = _elem.Nombre + " duplicado";
        _elem.TipoMaterial = null;
        _elem.EntregaEstado = null;
        _elem.ID = $scope.Guid();
        _elem.EntregaObservaciones = null;        
        _elem.DependeID = null;
        _elem.Eliminar = false;
        _elem.__children__ = [];
        elem.__children__.splice(index + 1, 0, _elem);
    };

    $scope.DuplicarConDatosAtributo = function (atri, index, elem) {
        let _elem = angular.copy(atri);
        _elem.ContratoInventarioItemID = null;        
        _elem.Nombre = _elem.Nombre + " duplicado";        
        _elem.ID = $scope.Guid();        
        _elem.DependeID = null;
        _elem.Eliminar = false;
        _elem.__children__ = [];
        elem.__children__.splice(index + 1, 0, _elem);
    };

    $scope.ValidarInventario = function () {
        if ($scope.Inventario.ContratoID == undefined || $scope.Inventario.ContratoID == null) {
            alertify.error("Debe seleccionar un contrato");
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
                    $scope.serviceBaseGBI + "ContratosInventarios/" + ($scope.Inventario.ContratoInventarioID == null ? "ContratosInventariosInsertar" : "ContratosInventariosActualizar"),
                    $scope.Inventario,
                    function (response) {                        
                        alertify.success(response.rows[0].Descripcion);
                        let _arrayFiles = [], _arrayDeleteFiles = [];
                        angular.forEach($scope.Inventario.ContratosInventariosFotos, function (elem) {
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
                            $scope.PreContacto.ShowContratos = true;
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
            $scope.serviceBaseGBI + "ContratosInventarios/ContratosInventariosDetalladoConsultar/",
            { ContratoInventarioID: elem.ContratoInventarioID, Token: $scope.Usuario.Token },
            function (response) {
                $scope.Inventario = response.data;
                $scope.Inventario.DirIP = $scope.Usuario.Ip;
                $scope.Inventario.Usuario = $scope.Usuario.UsuarioID;
                $scope.Inventario.Token = $scope.Usuario.Token;
                $scope.Inventario.InmuebleInventarioID = null;
                $scope.Inventario.InmuebleID = elem.InmuebleID
                angular.forEach($scope.Inventario.ContratosInventariosFotos, function (elem) {
                    elem.Eliminar = false;                    
                });
                angular.forEach($scope.Inventario.ContratosInventariosItems, function (elem) {
                    elem.Eliminar = false;
                    angular.forEach(elem.__children__, function (elem2) {
                        elem2.ID = $scope.Guid();
                        elem2.Eliminar = false;
                    });
                });
                $scope.ConsultarInmueblesInventarios()
                $scope.Titulo = "Inventario de entrega";
                $scope.MostrarHeaderPrincipal(false);
                $scope.ModoView = 5;        
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
            /*
            if (_file.size > 2000000) {
                alertify.error("El archivo no puede superar los 2MB.");
                return false;
            }
            */
            return true;
        },
        UploadFileCDN: function (response, _file, _data, _model) {
            $scope.Contrato.File = _file.File;
            $scope.Contrato.MimeType = _file.type;
            $scope.Contrato.NombreArchivo = _file.name;
            $scope.Contrato.Ruta = "cdn://" + response.CodigoUnico;
        }
    };

    $scope.ConfigInputArchivosActaEntrega = {
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
            /*
            if (_file.size > 2000000) {
                alertify.error("El archivo no puede superar los 2MB.");
                return false;
            }
            */
            return true;
        },
        UploadFileCDN: function (response, _file, _data, _model) {
            $scope.Contrato.File = _file.File;
            $scope.Contrato.MimeType = _file.type;
            $scope.Contrato.NombreArchivo = _file.name;
            $scope.Contrato.Ruta = "cdn://" + response.CodigoUnico;
        }
    };

    $scope.CargarInventarioEntrega = function (item) {
        $scope.Contrato = angular.copy(item);
        $scope.Contrato.TipoDocumento = 5;
        $scope.Titulo = "Cargue de inventario de entrega del inmueble";
        $scope.MostrarHeaderPrincipal(false);
        $scope.ModoView = 6;
    };

    $scope.GuardarInventarioEntrega = function () {
        if ($scope.Contrato.Ruta == null || $scope.Contrato.Ruta == undefined) {
            alertify.error("El archivo del inventario es requerido");
            return;
        }
        alertify.confirm("¿Desea guardar los cambios del inventario de entrega?", function () {
            $scope.MostrarProgress(true);          
            Services.Async(
                $scope.serviceBaseGBI + "Contratos/RutasDocumentosContratosActualizar",
                $scope.Contrato,
                function (response) {
                    alertify.success(response.rows[0].Descripcion);
                    let _arrayFiles = [];
                    _arrayFiles.push($scope.Contrato.Ruta.replaceAll("cdn://", ""));                                      
                    $scope.CommitCDN(_arrayFiles);                    
                    $scope.Sincronizar(function () {
                        $scope.AtrasModoView();
                        $scope.PreContacto.ShowContratos = true;
                        $scope.MostrarProgress(false);
                    });
                }
            );
        });
    };

    $scope.QuitarInventarioEntrega = function (item) {
        if (item.RutaInventarioEntrega == null || item.RutaInventarioEntrega == undefined) {
            alertify.error("El archivo del inventario es requerido");
            return;
        }
        alertify.confirm("¿Desea quitar el inventario de entrega cargado?", function () {
            $scope.MostrarProgress(true);
            $scope.EliminarArchivoCDN([{ CodigoUnico: item.RutaInventarioEntrega.replaceAll("cdn://", "") }], function (response) {
                item.TipoDocumento = 5;
                item.Ruta = null;
                Services.Async(
                    $scope.serviceBaseGBI + "Contratos/RutasDocumentosContratosActualizar",
                    item,
                    function (response) {
                        alertify.success(response.rows[0].Descripcion);
                        $scope.Sincronizar(function () {
                            $scope.AtrasModoView();
                            $scope.PreContacto.ShowContratos = true;
                            $scope.MostrarProgress(false);
                        });
                    }
                );
            });
        });
    };

    $scope.CargarActaEntrega = function (item) {
        $scope.Contrato = angular.copy(item);
        $scope.Contrato.TipoDocumento = 1;
        $scope.Titulo = "Cargue de acta entrega del inmueble";
        $scope.MostrarHeaderPrincipal(false);
        $scope.ModoView = 7;
    };

    $scope.GuardarActaEntrega = function () {
        if ($scope.Contrato.Ruta == null || $scope.Contrato.Ruta == undefined) {
            alertify.error("El archivo del acta del inmueble es requerido");
            return;
        }
        alertify.confirm("¿Desea guardar los cambios de la acta?", function () {
            $scope.MostrarProgress(true);            
            Services.Async(
                $scope.serviceBaseGBI + "Contratos/RutasDocumentosContratosActualizar",
                $scope.Contrato,
                function (response) {
                    alertify.success(response.rows[0].Descripcion);
                    let _arrayFiles = [];
                    _arrayFiles.push($scope.Contrato.Ruta.replaceAll("cdn://", ""));
                    $scope.CommitCDN(_arrayFiles);
                    $scope.Sincronizar(function () {
                        $scope.AtrasModoView();
                        $scope.PreContacto.ShowContratos = true;
                        $scope.MostrarProgress(false);
                    });
                }
            );
        });
    };

    $scope.QuitarActaEntrega = function (item) {
        if (item.RutaActaInmueble == null || item.RutaActaInmueble == undefined) {
            alertify.error("El archivo del acta es requerido");
            return;
        }
        alertify.confirm("¿Desea quitar el acta de entrega del inmueble cargado?", function () {
            $scope.MostrarProgress(true);
            $scope.EliminarArchivoCDN([{ CodigoUnico: item.RutaActaInmueble.replaceAll("cdn://", "") }], function (response) {
                item.TipoDocumento = 1;
                item.Ruta = null;
                Services.Async(
                    $scope.serviceBaseGBI + "Contratos/RutasDocumentosContratosActualizar",
                    item,
                    function (response) {
                        alertify.success(response.rows[0].Descripcion);
                        $scope.Sincronizar(function () {
                            $scope.AtrasModoView();
                            $scope.PreContacto.ShowContratos = true;
                            $scope.MostrarProgress(false);
                        });
                    }
                );
            });
        });
    };

    $scope.DescargarActaEntregaCargada = function (item) {
        $scope.viewer.Open(item.RutaActaInmueble);
    };

    $scope.DescargarActaEntrega = function (item) {
        $scope.viewer.Open($scope.serviceBaseGBI + "PDFs/DocumentoB?TipoDocumentoID=7&UniqueID=" + item.UniqueID);
    };

    $scope.DescargarInventarioEntregaCargado = function (item) {
        $scope.viewer.Open(item.RutaInventarioEntrega);
    };

    $scope.DescargarInventarioEntrega = function (item) {
        $scope.viewer.Open($scope.serviceBaseGBI + "PDFs/DocumentoB?TipoDocumentoID=11&UniqueID=" + item.InventarioUniqueID);
    };

    $scope.FirmarActaEntrega = function (elem) {
        if (elem.ActaEntrega.Activo == true) {
            alertify.error("El acta de entrega del inmueble ya se encuentra en firma electronica");
            return;
        }        
        alertify.confirm("¿Esta seguro que desea enviar el ACTA DE ENTREGA N°." + elem.Consecutivo + " a firmar?", function () {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseGBI + "Contratos/EnviarActaEntregaSignio",
                elem,
                function (response) {
                    alertify.success(response.rows[0].Descripcion);
                    $scope.Sincronizar(function () {
                        $scope.PreContacto.ShowContratos = true;
                        $scope.MostrarProgress(false);
                    });
                }
            );
        });
    };

    $scope.QuitarFirmarActaEntrega = function (elem) {        
        alertify.confirm("¿Esta seguro que desea eliminar la firma del acta de entrega N°." + elem.Consecutivo + " a firmar?", function () {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseSIS + "Signio/EliminarDocumentoSignio",
                { OrigenTransaccionSignioID: 10, CodigoOrigen: elem.ContratoID, TransaccionID: elem.ActaEntrega.TransaccionID, DevolverSobre: true },                
                function (response) {                    
                    alertify.success(response.rows[0].Descripcion);
                    $scope.Sincronizar(function () {                        
                        $scope.PreContacto.ShowContratos = true;
                        $scope.MostrarProgress(false);
                    });
                }
            );
        });
    };

    $scope.ChangeTipoFacturacion = function () {
        if ($scope.Corretaje.TipoFacturacion == 2) {
            Services.Async(
                $scope.serviceBaseGBI + "Inmuebles/InmueblesPropietariosConsultar",
                { InmuebleID: $scope.PreContacto.Inmueble.InmuebleID, Activo: true },
                function (response) {
                    $scope.InmueblePropietariosCorretaje = response.rows;
                    if ($scope.InmueblePropietariosCorretaje.length == 0)
                        $scope.InmueblePropietariosCorretaje.unshift({ AbreviaturaDocumento: null, NombreCompleto: "No hay propietarios" });
                    if ($scope.InmueblePropietariosCorretaje.length > 0)
                        $scope.Corretaje.PropietarioTerceroID = $scope.InmueblePropietariosCorretaje[0].TerceroID;
                    angular.forEach($scope.InmueblePropietariosCorretaje, function (elem) {
                        elem.Descripcion = elem.NombreCompleto + (elem.AbreviaturaDocumento == null ? "" : (" - " + elem.AbreviaturaDocumento));
                    });
                }
            );
        } else {
            $scope.InmueblePropietariosCorretaje = [];
        }
    };

    $scope.AbrirModalPreFacturaCorretaje = function () {        
        $scope.Corretaje = {
            TipoFacturacion: 1,
            ProcesoID: $scope.PreContacto.ProcesoID,
            InmuebleID: $scope.PreContacto.Inmueble.InmuebleID,
            CobrarPublicidad: true,
            PropietarioTerceroID: null
        };
        $("#modalPreFacturaCorretaje").modal("show");
    };

    $scope.GenerarPreFacturaCorretaje = function () {
        if ($scope.Corretaje.TipoFacturacion == 2) {
            if ($scope.Corretaje.PropietarioTerceroID == null || $scope.Corretaje.PropietarioTerceroID == undefined) {
                alertify.error("El propietario es obligatorio");
                return;
            }
        }
        alertify.confirm("¿Desea generar los cupones de pago de corretaje?", function () {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseFAC + "FacturasInmuebles/PreFacturarCorretajeArriendo",
                $scope.Corretaje,
                function (response) {
                    alertify.success(response.rows[0].Descripcion);
                    $("#modalPreFacturaCorretaje").modal("hide");
                    $scope.Sincronizar(function () {
                        $scope.PreContacto.ShowFacturas = true;
                        $scope.MostrarProgress(false);
                    });
                }
            );
        });
    };

    $scope.Guid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    
    window.Scope = $scope;
}]);
function CerrarPopover(_this) {
    angular.element(_this).closest(".popover").remove();
};