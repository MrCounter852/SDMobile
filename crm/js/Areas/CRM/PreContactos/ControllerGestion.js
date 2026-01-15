var ERP = angular.module("ERP", ['ngTable', 'AxelSoft', 'DateTimePicker', 'ui.utils.masks', 'NgContextMenu', 'EmailBox', 'DocumentoBox', 'FileViewer', 'summernote', 'Mail', 'Direcciones', 'Bodegas', 'StorageMap', 'DetailModal', 'ui.toggle', 'mwl.calendar', 'ui.bootstrap', 'as.sortable', 'Address', 'cfp.hotkeys', 'Seguimientos']);
ERP.config(function ($controllerProvider, $provide, $compileProvider, $filterProvider) {
    let providers = {
        $controllerProvider: $controllerProvider,
        $compileProvider: $compileProvider,
        $filterProvider: $filterProvider,
        $provide: $provide // other things
    };
    ERP._controller = ERP.controller;
    ERP._service = ERP.service;
    ERP._factory = ERP.factory;
    ERP._value = ERP.value;
    ERP._constant = ERP.constant;
    ERP._provider = ERP.provider;
    ERP._decorator = ERP.decorator;
    ERP._directive = ERP.directive;
    ERP.registerModules = function (registerModules) {
        let i, ii, k, invokeQueue, moduleName, moduleFn, invokeArgs, provider;
        if (registerModules) {
            for (k = registerModules.length - 1; k >= 0; k--) {
                let runBlocks = [];
                moduleName = registerModules[k];
                moduleFn = angular.module(moduleName);
                runBlocks = runBlocks.concat(moduleFn._runBlocks);
                try {
                    for (invokeQueue = moduleFn._invokeQueue, i = 0, ii = invokeQueue.length; i < ii; i++) {
                        invokeArgs = invokeQueue[i];

                        if (providers.hasOwnProperty(invokeArgs[0])) {
                            provider = providers[invokeArgs[0]];
                        } else {
                            return $log.error("unsupported provider " + invokeArgs[0]);
                        }
                        provider[invokeArgs[1]].apply(provider, invokeArgs[2]);
                    }
                } catch (e) {
                    if (e.message) {
                        e.message += ' from ' + moduleName;
                    }
                    $log.error(e.message);
                    throw e;
                }
                registerModules.pop();
                angular.forEach(runBlocks, function (fn) {
                    ERP.service(fn[0], fn[1]);
                });
            }
        }
    };
    ERP.controller = function (name, constructor) {
        $controllerProvider.register(name, constructor);
        return this;
    };
    ERP.service = function (name, constructor) {
        $provide.service(name, constructor);
        return this;
    };
    ERP.factory = function (name, factory) {
        $provide.factory(name, factory);
        return this;
    };
    ERP.value = function (name, value) {
        $provide.value(name, value);
        return this;
    };
    ERP.constant = function (name, value) {
        $provide.constant(name, value);
        return this;
    };
    ERP.provider = function (name, value) {
        $provide.provider(name, value);
        return this;
    };
    ERP.decorator = function (name, value) {
        $provide.decorator(name, value);
        return this;
    };
    ERP.directive = function (name, factory) {
        $compileProvider.directive(name, factory);
        return this;
    };
});
ERP.filter('tel', function () {
    return function (tel) {
        if (!tel) { return ''; }
        var value = tel.toString().trim().replace(/^\+/, '');
        if (value.match(/[^0-9]/)) {
            return tel;
        }
        var country, city, number;
        switch (value.length) {
            case 10: // +1PPP####### -> C (PPP) ###-####
                country = 1;
                city = value.slice(0, 3);
                number = value.slice(3);
                break;
            case 11: // +CPPP####### -> CCC (PP) ###-####
                country = value[0];
                city = value.slice(1, 4);
                number = value.slice(4);
                break;
            case 12: // +CCCPP####### -> CCC (PP) ###-####
                country = value.slice(0, 3);
                city = value.slice(3, 5);
                number = value.slice(5);
                break;
            default:
                return tel;
        }
        if (country == 1) {
            country = "";
        }
        number = number.slice(0, 3) + '-' + number.slice(3);
        return (country + " (" + city + ") " + number).trim();
    };
});
ERP.directive("sediEditable", function () {
    return {
        scope: {
            text: "=ngModel"
        },
        transclude: true,
        restrict: 'AEC', // restrict directive to use as attribute
        link: function (scope, element, attrs, ctrl) {
            element.text(scope.text);

            scope.$watch('text', function (newValue, oldValue) {
                if (newValue != oldValue) {
                    if (newValue != element.text())
                        element.text(newValue);
                }
            });

            element.on("keyup", function (event) {
                scope.text = element.text();
            });
        }
    };
});
ERP.controller("ControllerGestion", ['$scope', '$timeout', '$q', 'Services', '$filter', '$compile', 'alertify', 'calendarConfig', 'hotkeys', 'Storage', function ($scope, $timeout, $q, Services, $filter, $compile, alertify, calendarConfig, hotkeys, Storage) {
    $scope.Colores = [{ ID: "null", Nombre: "Todos" }, { ID: "#ffc4c9", Nombre: "Color 1" }, { ID: "#ffc107", Nombre: "Color 2" }, { ID: "#d4edda", Nombre: "Color 3" }, { ID: "#e0a5ea", Nombre: "Color 4" }];
    $scope.EstadosGenerales = [{ ID: null, Nombre: "Todos" }, { ID: "V", Nombre: "A tiempo" }, { ID: "A", Nombre: "Proximo a vencer" }, { ID: "R", Nombre: "Vencido" }];
    $scope.PreContactosExistentes = [];    
    $scope.TiposActividades = [];
    $scope.Seguimientos = [];
    $scope.CalendariosActividades = [];
    $scope.ActividadesFechas = [];
    $scope.ModoProcesos = "tabla";
    $scope.IsFiltros = true;
    $scope.FiltroSucursal = false;
    $scope.FiltroAsesor = false;
    $scope.Configuracion = {
        FechaLogisticaCentroGestion: false,
        FechaPosibleServicioCentroGestion: false
    };
    $scope.address = {
        Token: $scope.Usuario.Token,
    };
    
    $scope.ConfigSeguimiento = {
        Usuario: $scope.Usuario,
        ShowAddComment: true,
        NotFound_height: 185,
        OverFlow_height: 558,
        ShowNotFound: false,        
        SetSeguimientos: function (_seguimientos) {
            $scope.Seguimientos = _seguimientos;
        }
    };

    $scope.Modo = 1;
    $scope.AnteriorModo = null;
    $scope.MailModel = {};
    $scope.ViewsCRM = null;
    $scope.VersionCRM = parseInt(Math.random() * 9999);
    $scope.ViewsInventario = '/js/Areas/CRM/PreContactos/Inventario/View.html?v=' + $scope.VersionCRM;
    $scope.ViewsTableCRM = '/js/Areas/CRM/PreContactos/Standard/Tabla.html?v=' + $scope.VersionCRM;

    hotkeys.add({
        combo: 'ctrl+b',
        callback: function () {
            $scope.MostrarFiltros();
        }
    });

    $scope.Search = {
        Page: 1,
        Rows: 30,
        OrigenPreContactoID: null,
        EstadoGeneral: null,
        TipoAvaluoID: null,
        AsesorID: $scope.Usuario.AsesorID,
        Asesor: $scope.Usuario.AsesorID == null ? null : $scope.Usuario.NombreCompleto,
        EstadoProcesoID: "1,4",
        EstadoProcesoNombre: "Nuevo y En gestión",
        SucursalID: $scope.Usuario.SucursalID,
        SucursalNombre: $scope.Usuario.NombreSucursal,
        Color: "null",
        FullSearch: undefined,
        FechaInicial: null, //moment().subtract(6, 'months').format("DD/MM/YYYY"),
        Token: $scope.Usuario.Token
    };

    $scope.CopySearch = angular.copy($scope.Search);

    $scope.AtrasModo = function () {
        if ($scope.AnteriorModo == null) {
            if ($scope.Modo == 4) {
                $('.nav-pills-icon li a[data-target="#tablaPreContactos"]').tab('show');
                $scope.ModoProcesos = "tabla";
            }
            $scope.Modo = 1;
            $scope.ViewsCRM = null;
            $scope.CerrarModalInventario();
        } else {
            $scope.Modo = $scope.AnteriorModo;
            $scope.AnteriorModo = null;
        }
    };

    $scope.MostrarFiltros = function () {
        if ($scope.IsFiltros)
            $scope.IsFiltros = false;
        else
            $scope.IsFiltros = true;
    };

    $scope.GlobalSearch = function () {
        $scope.Search.Page = 1;
        if ($scope.TimeOutFilter)
            $timeout.cancel($scope.TimeOutFilter);
        $scope.TimeOutFilter = $timeout(function () {
            $scope.Consultar();
            $scope.LineaTiempoConsultar();
        }, 1000);
    };

    $scope.Init = function () {
        $scope.ConsultarCombos();
        if ($scope.QueryString.ProcesoID != undefined) {
            $scope.MostrarProgress(true);
            $scope.AbrirCentroGestion({
                ProcesoID: $scope.QueryString.ProcesoID
            }, function () {
                if ($scope.QueryString.NotificacionActividad != undefined)
                    $scope.VisualizarActividadesSeguimientos($scope.PreContacto);
            });
        } else if ($scope.QueryString.CalendarioActividadID != undefined) {
            $scope.MostrarProgress(true);
            $scope.AbrirMiCalendario();
            Services.Async(
                $scope.serviceBaseSIS + "CalendariosActividades/CalendariosActividadesConsultar/",
                { Page: 0, Rows: 0, CalendarioActividadID: $scope.QueryString.CalendarioActividadID },
                function (response) {
                    $scope.Actividad = response.rows[0];
                    $scope.Actividad.HabilitarFinalizar = true;
                    angular.element("#modalActividad").modal("show");
                    $scope.MostrarProgress(false);
                }
            );
        }
        let _PermisosEspeciales = Storage.Session.Get(window.location.host + "_" + window.location.pathname + "_" + $scope.Usuario.EmpresaID + "_" + $scope.Usuario.UsuarioID);
        if (_PermisosEspeciales == null) {
            Services.Async(
                $scope.serviceBaseSIS + "UsuariosPermisosEspeciales/PermisoEspecialAcceso/",
                { UsuarioID: $scope.Usuario.UsuarioID, Ruta: window.location.pathname, ModuloID: 8, Token: $scope.Usuario.Token },
                function (response) {
                    $scope.Configuracion = {
                        FechaLogisticaCentroGestion: response.rows[0].FechaLogisticaCentroGestion,
                        FechaPosibleServicioCentroGestion: response.rows[0].FechaPosibleServicioCentroGestion
                    };
                    $scope.Usuario.EdicionLineaTiempo = $filter("filter")(response.rows, function (elem) { return elem.PermisoEspecialMenuID == 11 }, true)[0].Acceso;
                    $scope.Usuario.EdicionEstadoProceso = $filter("filter")(response.rows, function (elem) { return elem.PermisoEspecialMenuID == 10 }, true)[0].Acceso;
                    $scope.Usuario.PermiteEdicionActividades = $filter("filter")(response.rows, function (elem) { return elem.PermisoEspecialMenuID == 9 }, true)[0].Acceso;
                    $scope.Usuario.EliminacionInmuebles = $filter("filter")(response.rows, function (elem) { return elem.PermisoEspecialMenuID == 8 }, true)[0].Acceso;
                    $scope.Usuario.EliminacionLeads = $filter("filter")(response.rows, function (elem) { return elem.PermisoEspecialMenuID == 7 }, true)[0].Acceso;
                    $scope.Usuario.PermitePublicacionPortales = $filter("filter")(response.rows, function (elem) { return elem.PermisoEspecialMenuID == 6 }, true)[0].Acceso;
                    $scope.Usuario.PermiteEliminarActividades = $filter("filter")(response.rows, function (elem) { return elem.PermisoEspecialMenuID == 5 }, true)[0].Acceso;
                    $scope.Usuario.PermiteEdicionInmueble = $filter("filter")(response.rows, function (elem) { return elem.PermisoEspecialMenuID == 4 }, true)[0].Acceso;
                    $scope.Usuario.Asignable = $filter("filter")(response.rows, function (elem) { return elem.PermisoEspecialMenuID == 3 }, true)[0].Acceso;
                    $scope.Usuario.FiltroAsesor = $filter("filter")(response.rows, function (elem) { return elem.PermisoEspecialMenuID == 2 }, true)[0].Acceso;
                    $scope.Usuario.FiltroSucursal = $filter("filter")(response.rows, function (elem) { return elem.PermisoEspecialMenuID == 1 }, true)[0].Acceso;
                    $scope.Usuario.PermiteCargarInventario = $filter("filter")(response.rows, function (elem) { return elem.PermisoEspecialMenuID == 15 }, true)[0].Acceso;
                    $scope.Usuario.PermiteQuitarInventario = $filter("filter")(response.rows, function (elem) { return elem.PermisoEspecialMenuID == 14 }, true)[0].Acceso;
                    $scope.Usuario.PermiteQuitarFirmaActa = $filter("filter")(response.rows, function (elem) { return elem.PermisoEspecialMenuID == 13 }, true)[0].Acceso;
                    $scope.Usuario.PermiteEditarOrdenServicio = $filter("filter")(response.rows, function (elem) { return elem.PermisoEspecialMenuID == 16 }, true)[0].Acceso;
                    Storage.Session.Set(window.location.host + "_" + window.location.pathname + "_" + $scope.Usuario.EmpresaID + "_" + $scope.Usuario.UsuarioID, response.rows);
                }
            );
        } else {
            $scope.Configuracion = {
                FechaLogisticaCentroGestion: _PermisosEspeciales[0].FechaLogisticaCentroGestion,
                FechaPosibleServicioCentroGestion: _PermisosEspeciales[0].FechaPosibleServicioCentroGestion
            };
            $scope.Usuario.EdicionLineaTiempo = $filter("filter")(_PermisosEspeciales, function (elem) { return elem.PermisoEspecialMenuID == 11 }, true)[0].Acceso;
            $scope.Usuario.EdicionEstadoProceso = $filter("filter")(_PermisosEspeciales, function (elem) { return elem.PermisoEspecialMenuID == 10 }, true)[0].Acceso;
            $scope.Usuario.PermiteEdicionActividades = $filter("filter")(_PermisosEspeciales, function (elem) { return elem.PermisoEspecialMenuID == 9 }, true)[0].Acceso;
            $scope.Usuario.EliminacionInmuebles = $filter("filter")(_PermisosEspeciales, function (elem) { return elem.PermisoEspecialMenuID == 8 }, true)[0].Acceso;
            $scope.Usuario.EliminacionLeads = $filter("filter")(_PermisosEspeciales, function (elem) { return elem.PermisoEspecialMenuID == 7 }, true)[0].Acceso;
            $scope.Usuario.PermitePublicacionPortales = $filter("filter")(_PermisosEspeciales, function (elem) { return elem.PermisoEspecialMenuID == 6 }, true)[0].Acceso;
            $scope.Usuario.PermiteEliminarActividades = $filter("filter")(_PermisosEspeciales, function (elem) { return elem.PermisoEspecialMenuID == 5 }, true)[0].Acceso;
            $scope.Usuario.PermiteEdicionInmueble = $filter("filter")(_PermisosEspeciales, function (elem) { return elem.PermisoEspecialMenuID == 4 }, true)[0].Acceso;
            $scope.Usuario.Asignable = $filter("filter")(_PermisosEspeciales, function (elem) { return elem.PermisoEspecialMenuID == 3 }, true)[0].Acceso;
            $scope.Usuario.FiltroAsesor = $filter("filter")(_PermisosEspeciales, function (elem) { return elem.PermisoEspecialMenuID == 2 }, true)[0].Acceso;
            $scope.Usuario.FiltroSucursal = $filter("filter")(_PermisosEspeciales, function (elem) { return elem.PermisoEspecialMenuID == 1 }, true)[0].Acceso;
            $scope.Usuario.PermiteCargarInventario = $filter("filter")(_PermisosEspeciales, function (elem) { return elem.PermisoEspecialMenuID == 15 }, true)[0].Acceso;
            $scope.Usuario.PermiteQuitarInventario = $filter("filter")(_PermisosEspeciales, function (elem) { return elem.PermisoEspecialMenuID == 14 }, true)[0].Acceso;
            $scope.Usuario.PermiteQuitarFirmaActa = $filter("filter")(_PermisosEspeciales, function (elem) { return elem.PermisoEspecialMenuID == 13 }, true)[0].Acceso;
            $scope.Usuario.PermiteEditarOrdenServicio = $filter("filter")(_PermisosEspeciales, function (elem) { return elem.PermisoEspecialMenuID == 16 }, true)[0].Acceso;
        }
        $scope.OrigenesPreContactosSucursalesConsultar();
    };

    $scope.OrigenesPreContactosSucursalesConsultar = function () {
        let _PermisosEspecialesOrigenes = Storage.Session.Get("Origenes_" + window.location.host + "_" + window.location.pathname + "_" + $scope.Usuario.EmpresaID + "_" + $scope.Usuario.UsuarioID);
        if (_PermisosEspecialesOrigenes == null) {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseCRM + "OrigenesPreContactosSucursales/OrigenesPreContactosSucursalesConsultar/",
                { SucursalID: $scope.Search.SucursalID, Token: $scope.Usuario.Token },
                function (response) {
                    Storage.Session.Set("Origenes_" + window.location.host + "_" + window.location.pathname + "_" + $scope.Usuario.EmpresaID + "_" + $scope.Usuario.UsuarioID, response.rows);
                    $scope.FilterOrigenesPreContactos = angular.copy(response.rows);
                    $scope.OrigenesPreContactos = angular.copy(response.rows);
                    if ($scope.FilterOrigenesPreContactos.length > 0) {
                        let _item = $scope.FilterOrigenesPreContactos[0];
                        if ($scope.FilterOrigenesPreContactos.length > 1) {
                            $scope.Search.OrigenPreContactoID = _item.OrigenPreContactoID;
                            $scope.FilterOrigenesPreContactos.unshift({ OrigenPreContactoID: null, Nombre: "Todos" });
                        } else
                            $scope.Search.OrigenPreContactoID = _item.OrigenPreContactoID;
                        $scope.CambiarOrigenPreContacto();
                        $scope.CopySearch = angular.copy($scope.Search);
                    }
                    $scope.MostrarProgress(false);
                    $scope.CargarViewTabla();
                    $scope.Consultar();
                    $scope.LineaTiempoConsultar();
                    $scope.MiCalendarioConsultar();
                    $scope.ConsultarActividades();
                }
            );
        } else {
            $scope.FilterOrigenesPreContactos = angular.copy(_PermisosEspecialesOrigenes);
            $scope.OrigenesPreContactos = angular.copy(_PermisosEspecialesOrigenes);
            $scope.OrigenesPreContactos.unshift({ OrigenPreContactoID: null, Nombre: " -- Seleccione -- " });
            if ($scope.FilterOrigenesPreContactos.length > 0) {
                let _item = $scope.FilterOrigenesPreContactos[0];
                if ($scope.FilterOrigenesPreContactos.length > 1) {
                    $scope.Search.OrigenPreContactoID = _item.OrigenPreContactoID;
                    $scope.FilterOrigenesPreContactos.unshift({ OrigenPreContactoID: null, Nombre: "Todos" });
                } else
                    $scope.Search.OrigenPreContactoID = _item.OrigenPreContactoID;
                $scope.CambiarOrigenPreContacto();
                $scope.CopySearch = angular.copy($scope.Search);
            }
            $scope.CargarViewTabla();
            $scope.Consultar();
            $scope.LineaTiempoConsultar();
            $scope.MiCalendarioConsultar();
            $scope.ConsultarActividades();
        }
    };

    $scope.CambiarOrigenPreContacto = function () {
        $scope.Search.Page = 1;
        $scope.CopySearch.OrigenPreContactoID = $scope.Search.OrigenPreContactoID;
        if ($scope.Search.OrigenPreContactoID != null) {
            Services.Async(
                $scope.serviceBaseCRM + "CamposPreContactos/ConfiguracionCamposPrecontactosConsultar/",
                { OrigenPreContactoID: $scope.Search.OrigenPreContactoID, Token: $scope.Usuario.Token },
                function (response) {
                    $scope.LabelColumna1 = null;
                    $scope.LabelColumna2 = null;
                    $scope.LabelColumna3 = null;
                    $scope.CamposPreContactos = response.data;
                    if ($scope.CamposPreContactos.length > 0) {
                        $scope.ConstruirColumns();
                        $scope.ConstruirCampos($scope.CamposPreContactos, "#Campos", "PreContacto", "col-xs-12 col-sm-6 col-md-3 col-lg-3");
                        $scope.ConstruirCampos($scope.CamposPreContactos, "#CamposFilter", "Search", "col-xs-12 col-sm-6 col-md-6 col-lg-6");
                        $scope.ConstruirCamposFilter($scope.CamposPreContactos, "#thLabelColumna1", "Search", 1);
                        $scope.ConstruirCamposFilter($scope.CamposPreContactos, "#thLabelColumna2", "Search", 2);
                        $scope.ConstruirCamposFilter($scope.CamposPreContactos, "#thLabelColumna3", "Search", 3);
                    }
                    $scope.CargarViewTabla();
                    $scope.Consultar();
                    $scope.LineaTiempoConsultar();                    
                }
            );
        } else {
            $scope.LabelColumna1 = null;
            $scope.LabelColumna2 = null;
            $scope.LabelColumna3 = null;
            $scope.CargarViewTabla();
            $scope.Consultar();
            $scope.LineaTiempoConsultar();            
        }
    };

    $scope.CargarViewTabla = function () {
        if ($scope.Search.OrigenPreContactoID == 2)
            $scope.ViewsTableCRM = '/js/Areas/CRM/PreContactos/GBIPropietarios/Tabla.html?v=' + $scope.VersionCRM;
        else if ($scope.Search.OrigenPreContactoID == 4)
            $scope.ViewsTableCRM = '/js/Areas/CRM/PreContactos/GBIArrendatarios/Tabla.html?v=' + $scope.VersionCRM;
        else if ($scope.Search.OrigenPreContactoID == 5)
            $scope.ViewsTableCRM = '/js/Areas/CRM/PreContactos/GBIVentas/Tabla.html?v=' + $scope.VersionCRM;
        else if ($scope.Search.OrigenPreContactoID == 7)
            $scope.ViewsTableCRM = '/js/Areas/CRM/PreContactos/AvaluosLinea/Tabla.html?v=' + $scope.VersionCRM;
        else
            $scope.ViewsTableCRM = '/js/Areas/CRM/PreContactos/Standard/Tabla.html?v=' + $scope.VersionCRM;
    };

    $scope.Consultar = function () {
        $scope.MostrarProgress(true);
        let _filtros = angular.copy($scope.Search);
        _filtros.SortColumn = $scope.SortColumn;
        _filtros.SortDirection = $scope.SortDirection;
        let _urlApi = $scope.serviceBaseCRM + "PreContactos/PreContactosPorOrigenConsultar/";
        if ($scope.Search.OrigenPreContactoID == 2)
            _urlApi = $scope.serviceBaseCRM + "Inmuebles/ProcesosPropietariosConsultar/";
        if ($scope.Search.OrigenPreContactoID == 4)
            _urlApi = $scope.serviceBaseCRM + "Inmuebles/ProcesosArrendatariosConsultar/";
        if ($scope.Search.OrigenPreContactoID == 5)
            _urlApi = $scope.serviceBaseCRM + "Inmuebles/ProcesosVentasGBIConsultar/";
        if ($scope.Search.OrigenPreContactoID == 7)
            _urlApi = $scope.serviceBaseCRM + "PreContactos/PreContactosAvaluosConsultar/";
        Services.Async(
            _urlApi,
            _filtros,
            function (response) {
                $scope.PreContactos = response.rows;
                $scope.TablaFiltrada();
                $scope.MostrarProgress(false);
            }
        );
    };

    $scope.LineaTiempoConsultar = function () {
        if ($scope.Search.OrigenPreContactoID != null) {
            $scope.MostrarProgress(true);
            let _filtros = angular.copy($scope.Search);
            _filtros.EstadoProcesoID = null;
            _filtros.Rows = 15;
            Services.Async(
                $scope.serviceBaseCRM + "PreContactos/LineasTiemposConsultar/",
                _filtros,
                function (response) {
                    $scope.PreContactosLineaTiempo = response.data;
                    $scope.MostrarProgress(false);
                }
            );
        }
    };

    $scope.searchEstadosProcesos = function (term, modelID, model, options) {
        var deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseCRM + "PreContactos/EstadosProcesosConsultar/",
            { EstadoProcesoID: modelID, Nombre: term, Token: $scope.Usuario.Token },
            function (response) {
                for (let i = 0; i < response.rows.length; i++) {
                    if (response.rows[i].EstadoProcesoID == 7) {
                        response.rows.splice(i, 1)
                        break;
                    }
                }
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.ddlSearchEstadosProcesos = {
        ShowFilter: false,
        setArray: function (_array) {
            let item = _array.find(x => x.EstadoProcesoID == 10);
            if (item) {
                if ($scope.Search.OrigenPreContactoID == 2)
                    item.Nombre = "Captado";
                else if ($scope.Search.OrigenPreContactoID == 4)
                    item.Nombre = "Arrendado";
                else
                    item.Nombre = "Vendido";
            }
        }
    };

    $scope.searchEstadosProcesosFilter = function (term, modelID, model, options) {
        var deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseCRM + "PreContactos/EstadosProcesosConsultar/",
            { EstadoProcesoID: modelID, Nombre: term, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ EstadoProcesoID: "1,4", Nombre: "Nuevo y En gestión" });
                response.rows.unshift({ EstadoProcesoID: null, Nombre: "Todos" });
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.ddlSearchEstadosProcesosFilter = {
        ShowFilter: false,
        displayText: "Nuevo y En gestión",
        setArray: function (_array) {
            let item = _array.find(x => x.EstadoProcesoID == 10);
            if (item) {
                if ($scope.Search.OrigenPreContactoID == 2)
                    item.Nombre = "Captado";
                else if ($scope.Search.OrigenPreContactoID == 4)
                    item.Nombre = "Arrendado";
                else
                    item.Nombre = "Vendido";
            }
        }
    };

    $scope.searchProcesosLineasTiempos = function (term, modelID, model, options) {
        var deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseCRM + "ProcesosLineasTiempos/ProcesosLineasTiemposEstadosConsultar/",
            { Token: $scope.Usuario.Token, OrigenPreContactoID: $scope.PreContacto.OrigenPreContactoID },
            function (response) {                
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.ddlSearchProcesosLineasTiempos = {
        ShowFilter: false,
        ForceAsync: true
    };

    $scope.searchSucursalesUsuarios = function (term, modelID, model, options) {
        var deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseSIS + "Usuarios/SucursalesUsuariosConsultar/",
            { SucursalID: modelID, UsuarioID: $scope.Usuario.UsuarioID, Nombre: term, Token: $scope.Usuario.Token, Activo: modelID ? null : true },
            function (response) {
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.ddlSearchSucursalesUsuarios = {
        ShowFilter: false,
        onSelect: function (elem) {
            $scope.OrigenesPreContactosSucursalesConsultar();
        }
    };

    $scope.ConsultarCombos = function () {      
        Services.Async(
            $scope.serviceBaseSIS + "TiposCalendariosActividades/TiposCalendariosActividadesConsultar/",
            { Page: 0, Rows: 0, Token: $scope.Usuario.Token },
            function (response) {
                $scope.TiposActividades = angular.copy(response.rows);
                $scope.TiposActividades.unshift({ TipoCalendarioActividadID: null, Nombre: " -- Seleccione -- " });
                $scope.CalendarioTiposActividades = angular.copy(response.rows);
                $scope.CalendarioTiposActividades.unshift({ TipoCalendarioActividadID: null, Nombre: "Todas" });
            }
        );        
        Services.Async(
            $scope.serviceBaseSIS + "TipoDocumentos/TipoDocumentosConsultar/",
            { Rows: 0, Page: 0, Activo: true, Token: $scope.Usuario.Token },
            function (response) {
                $scope.TiposDocumentos = response.rows;
                $scope.TiposDocumentos.unshift({ TipoDocumentoID: null, Nombre: " -- Seleccione -- ", Numerico: true });
            }
        );
        Services.Async(
            $scope.serviceBaseSIS + "TipoPersonas/TipoPersonasConsultar/",
            { Rows: 0, Page: 0, Activo: true, Token: $scope.Usuario.Token },
            function (response) {
                $scope.TiposPersonas = response.rows;
                $scope.TiposPersonas.unshift({ TipoPersonaID: null, Nombre: " -- Seleccione -- " });
            }
        );
        Services.Async(
            $scope.serviceBaseGBI + "TiposAvaluos/TiposAvaluosConsultar",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                $scope.TiposAvaluos = response.rows;
                $scope.TiposAvaluosFilter = angular.copy(response.rows);
                $scope.TiposAvaluos.unshift({ TipoAvaluoID: null, Nombre: " -- Seleccione -- " });
                $scope.TiposAvaluosFilter.unshift({ TipoAvaluoID: null, Nombre: "Todas" });
            }
        );
        Services.Async(
            $scope.serviceBaseSIS + "ResponsabilidadesTributarias/ResponsabilidadesTributariasConsultar/",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ ResponsabilidadTributariaID: null, Descripcion: " -- Seleccione -- " });
                $scope.Responsabilidades = response.rows;
            }
        );
        Services.Async(
            $scope.serviceBaseGBI + "InmueblesPortales/PortalesInmobiliariosConsultar/",
            { Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ PortalInmobiliarioID: null, Nombre: " -- Seleccione -- " });
                $scope.PortalesInmobiliarios = response.rows;
            }
        );       
        Services.Async(
            $scope.serviceBaseSTRG + "Complejos/ComplejosConsultar/",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ ComplejoID: null, Nombre: " -- Seleccione -- " });
                $scope.Complejos = response.rows;
            }
        );
        if ($scope.GBI) {
            Services.Async(
                $scope.serviceBaseGBI + "CausalesInviabilidadProcesos/CausalesInviabilidadProcesosConsultar/",
                { Rows: 0, Page: 0, Token: $scope.Usuario.Token, Activo: true },
                function (response) {
                    response.rows.unshift({ CausalInviabilidadProcesoID: null, Nombre: " -- Seleccione -- " });
                    $scope.CausalesInviabilidadProcesos = response.rows;
                }
            );
        }
    };

    $scope.GlobalOrder = function (field, _event) {
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
        $scope.SortColumn = field;
        $scope.SortDirection = _order;
        $scope.Consultar();
    };

    $scope.ConstruirColumns = function () {
        if ($scope.CamposPreContactos.length > 0) {
            for (let i = 0; i < $scope.CamposPreContactos.length; i++) {
                if ($scope.CamposPreContactos[i].CampoPersonalizadoID == 1)
                    $scope.LabelColumna1 = $scope.CamposPreContactos[i].LabelCampo;
                else if ($scope.CamposPreContactos[i].CampoPersonalizadoID == 2)
                    $scope.LabelColumna2 = $scope.CamposPreContactos[i].LabelCampo;
                else if ($scope.CamposPreContactos[i].CampoPersonalizadoID == 3)
                    $scope.LabelColumna3 = $scope.CamposPreContactos[i].LabelCampo;
            }
        }
    };

    $scope.ConstruirCamposFilter = function (_array, ElemID, Field, CampoPersonalizadoID) {
        let _html = '';
        for (let i = 0; i < _array.length; i++) {
            if (_array[i].CampoPersonalizadoID == CampoPersonalizadoID) {
                if (_array[i].TipoDatoID == 1) {
                    _html += '<div class="' + Field + '">' +
                        '<date-time-picker class="form-control input-xs" ng-model="' + Field + '.' + _array[i].ModelCampo + '" format="DD/MM/YYYY" required placeholder="dd/mm/yyyy" ng-change="GlobalSearch()"></date-time-picker>' +
                        '</div>';
                } else if (_array[i].TipoDatoID == 2) {
                    _html += '<div class="' + Field + '">' +
                        '<input type="text" class="form-control input-xs text-right" placeholder="' + _array[i].LabelCampo + '" ng-model="' + Field + '.' + _array[i].ModelCampo + '" required maxlength="100" ui-number-mask="0" ng-change="GlobalSearch()"/>' +
                        '</div>'
                } else if (_array[i].TipoDatoID == 3) {
                    _html += '<div class="' + Field + '">' +
                        '<input type="text" class="form-control input-xs text-right" placeholder="' + _array[i].LabelCampo + '" ng-model="' + Field + '.' + _array[i].ModelCampo + '" required maxlength="100" ui-number-mask="2" ng-change="GlobalSearch()"/>' +
                        '</div>'
                } else if (_array[i].TipoDatoID == 4) {
                    _html += '<div class="' + Field + '">' +
                        '<input type="text" class="form-control input-xs" placeholder="' + _array[i].LabelCampo + '" ng-model="' + Field + '.' + _array[i].ModelCampo + '" required maxlength="5000" ng-change="GlobalSearch()"/>' +
                        '</div>'
                } else if (_array[i].TipoDatoID == 5) {
                    _html += '<div class="' + Field + '">' +
                        '<textarea rows="1" class="form-control input-xs" placeholder="' + _array[i].LabelCampo + '" ng-model="' + Field + '.' + _array[i].ModelCampo + '" required maxlength="5000" ng-change="GlobalSearch()"></textarea>' +
                        '</div>'
                } else if (_array[i].TipoDatoID == 6) {
                    _html += '<div class="' + Field + '">' +
                        '<select class="form-control input-xs pd-0" ng-model="' + Field + '.' + _array[i].ModelCampo + '" ng-change="Consultar()">' +
                        '<option label="Todos" value="">Todos</option>';
                    for (let j = 0; j < _array[i].ArrayLista.length; j++) {
                        _html += '<option label="' + _array[i].ArrayLista[j].Descripcion + '" value="{{' + _array[i].ArrayLista[j].CampoPreContactoValorID + '}}">' + _array[i].ArrayLista[j].Descripcion + '</option>';
                    }
                    _html += '</select>' +
                        '</div>';
                } else if (_array[i].TipoDatoID == 7) {
                    _html += '<div class="' + Field + '">' +
                        '<select class="form-control input-xs pd-0" ng-model="' + Field + '.' + _array[i].ModelCampo + '" ng-change="Consultar()">' +
                        '<option label="Todos" value="">Todos</option>' +
                        '<option label="Si" value="{{ true }}">Si</option>' +
                        '<option label="No" value="{{ false }}">No</option>' +
                        '</select>' +
                        '</div>';
                } else {
                    _html += '<div class="' + Field + '">' +
                        '<div custom-select="item.ID as item.Nombre for item in searchCamposEspeciales($searchTerm)" class="custom-select-sm" ng-model="' + Field + '.' + _array[i].ModelCampo + '" ng-model-object="' + _array[i].CampoPreContactoID + '"></div>' +
                        '</div>';
                }
                break;
            }
        }
        angular.element(ElemID).append($compile(_html)($scope));
    };

    $scope.HtmlToText = function (text) {
        return text ? String(text).replace(/<[^>]+>/gm, '').replaceAll("&nbsp;", " ") : '';
    };

    $scope.ConstruirCampos = function (_array, ElemID, Field, Class) {
        angular.element("." + Field).remove();
        let _html = '';
        for (let i = 0; i < _array.length; i++) {
            if (_array[i].TipoDatoID == 1) {
                _html += '<div class="' + Class + ' ' + Field + '">' +
                    '<label class="control-label control-label-sm mb-0">' + _array[i].LabelCampo + '</label>' +
                    '<div class="form-group has-feedback mb-3">' +
                    '<date-time-picker class="form-control input-sm" ng-model="' + Field + '.' + _array[i].ModelCampo + '" format="DD/MM/YYYY" placeholder="dd/mm/yyyy"></date-time-picker>' +
                    '<span class="glyphicon glyphicon-calendar form-control-feedback"></span>' +
                    '</div>' +
                    '</div>';
            } else if (_array[i].TipoDatoID == 2) {
                _html += '<div class="' + Class + ' ' + Field + '">' +
                    '<label class="control-label control-label-sm mb-0">' + _array[i].LabelCampo + '</label>' +
                    '<div class="form-group mb-3">' +
                    '<input type="text" class="form-control input-sm text-right" placeholder="' + _array[i].LabelCampo + '" ng-model="' + Field + '.' + _array[i].ModelCampo + '" maxlength="100" ui-number-mask="0"/>' +
                    '</div>' +
                    '</div>'
            } else if (_array[i].TipoDatoID == 3) {
                _html += '<div class="' + Class + ' ' + Field + '">' +
                    '<label class="control-label control-label-sm mb-0">' + _array[i].LabelCampo + '</label>' +
                    '<div class="form-group mb-3">' +
                    '<input type="text" class="form-control input-sm text-right" placeholder="' + _array[i].LabelCampo + '" ng-model="' + Field + '.' + _array[i].ModelCampo + '" maxlength="100" ui-number-mask="2"/>' +
                    '</div>' +
                    '</div>'
            } else if (_array[i].TipoDatoID == 4) {
                _html += '<div class="' + Class + ' ' + Field + '">' +
                    '<label class="control-label control-label-sm mb-0">' + _array[i].LabelCampo + '</label>' +
                    '<div class="form-group has-feedback mb-3" >' +
                    '<input type="text" class="form-control input-sm" placeholder="' + _array[i].LabelCampo + '" ng-model="' + Field + '.' + _array[i].ModelCampo + '" maxlength="5000" />' +
                    '<span class="glyphicon glyphicon-edit form-control-feedback"></span>' +
                    '</div>' +
                    '</div>'
            } else if (_array[i].TipoDatoID == 5) {
                _html += '<div class="col-xs-12 col-sm-6 col-md-6 col-lg-6 ' + Field + '">' +
                    '<label class="control-label control-label-sm mb-0">' + _array[i].LabelCampo + '</label>' +
                    '<div class="form-group mb-3" >' +
                    '<textarea rows="1" class="form-control input-sm" placeholder="' + _array[i].LabelCampo + '" ng-model="' + Field + '.' + _array[i].ModelCampo + '" maxlength="5000"></textarea>' +
                    '</div>' +
                    '</div>'
            } else if (_array[i].TipoDatoID == 6) {
                _html += '<div class="' + Class + ' ' + Field + '">' +
                    '<label class="control-label control-label-sm mb-0">' + _array[i].LabelCampo + '</label>' +
                    '<div class="form-group mb-3" >' +
                    '<select class="form-control input-sm" ng-model="' + Field + '.' + _array[i].ModelCampo + '">' +
                    '<option label=" -- Seleccione -- " value="{{null}}"> -- Seleccione -- </option>';
                for (let j = 0; j < _array[i].ArrayLista.length; j++) {
                    _html += '<option label="' + _array[i].ArrayLista[j].Descripcion + '" value="{{' + _array[i].ArrayLista[j].CampoPreContactoValorID + '}}">' + _array[i].ArrayLista[j].Descripcion + '</option>';
                }
                _html += '</select>' +
                    '</div>' +
                    '</div>';
            } else if (_array[i].TipoDatoID == 7) {
                _html += '<div class="' + Class + ' ' + Field + '">' +
                    '<div class="form-group" >' +
                    '<div class="form-check form-check-left">' +
                    '<input type="checkbox" class="form-check-input" id="checked_' + _array[i].ModelCampo + '" ng-model="' + Field + '.' + _array[i].ModelCampo + '">' +
                    '<label class="form-check-label control-label control-label-sm" for="checked_' + _array[i].ModelCampo + '" style="font-weight: 700;">' + _array[i].LabelCampo + '</label>' +
                    '</div>' +
                    '</div>' +
                    '</div>';
            } else {
                _html += '<div class="' + Class + ' ' + Field + '">' +
                    '<label class="control-label control-label-sm mb-0">' + _array[i].LabelCampo + '</label>' +
                    '<div class="form-group mb-3">' +
                    '<div custom-select="item.ID as item.Nombre for item in searchCamposEspeciales($searchTerm)" class="custom-select-sm" ng-model="' + Field + '.' + _array[i].ModelCampo + '" ng-model-object="' + _array[i].CampoPreContactoID + '"></div>' +
                    '</div>' +
                    '</div>';
            }
        }
        let NewHtml = $compile(_html)($scope);
        angular.element(ElemID).after(NewHtml);
    };

    $scope.AbrirWhatsAppWeb = function (item) {
        if (item.Celular != null && item.Celular != "" && item.Celular != undefined) {
            let celular = item.Celular.replaceAll(" ");
            celular = celular.replaceAll(",");
            celular = celular.replaceAll(".");
            window.open("https://api.whatsapp.com/send?phone=57" + celular);
        }
    };

    $scope.TablaFiltrada = function () {
        if (!angular.equals($scope.Search, $scope.CopySearch))
            $scope.Filtrado = true;
        else
            $scope.Filtrado = false;
    };

    $scope.Anterior = function () {
        if ($scope.Search.Page > 1) {
            $scope.Search.Page--;
            $scope.Consultar();
        }
    };

    $scope.Siguiente = function () {
        if (($scope.Search.Page * $scope.Search.Rows) < $scope.PreContactos[0].TotalRows) {
            $scope.Search.Page++;
            $scope.Consultar();
        }
    };

    $scope.AbrirModalAgregar = function () {
        $('.tooltip').remove();
        $scope.PreContacto = {
            DirIP: $scope.Usuario.Ip,
            Usuario: $scope.Usuario.UsuarioID,
            UsuarioID: $scope.Usuario.UsuarioID,
            ProcesoID: null,
            PreContatoID: null,
            ClienteTipoPersonaID: null,
            ClienteTipoDocumentoID: null,
            ClienteResponsabilidadTributariaID: null,
            ShowTipoPersona: true,
            GenerarNuevoPreContacto: false,
            PortalInmobiliarioID: null,
            Campo1: null,
            Campo2: null,
            Campo3: null,
            Campo4: null,
            Campo5: null,
            Campo6: null,
            Campo7: null,
            Campo8: null,
            Campo9: null,
            Campo10: null,
            Campo11: null,
            AsesorID: $scope.Usuario.AsesorID,
            AsesorNombreCompleto: $scope.Usuario.AsesorID == null ? null : $scope.Usuario.NombreCompleto,
            EstadoProcesoID: 1,
            Token: $scope.Usuario.Token,
            FormaComoNosConocioDetalleID: null,
            FormaContactoID: null,
            FormaComoNosConocioID: null,
            OrigenPreContactoID: $scope.Search.OrigenPreContactoID,
            TipoOfertaID: null,
            CondicionInmuebleID: null,
            TipoInmuebleID: null,
            LocalidadID: null,
            AntiguedadInmuebleID: null,
            Estrato1: false,
            Estrato2: false,
            Estrato3: false,
            Estrato4: false,
            Estrato5: false,
            Estrato6: false,
            TipoAvaluoID: null,
            ProcesosServiciosIniciales: [],
            ProcesosInmobiliariaLocalidades: [],
            SucursalID: $scope.Usuario.SucursalID
        };
        if ($scope.PreContacto.OrigenPreContactoID == 5)
            $scope.PreContacto.TipoOfertaID = 5
        $scope.Servicio = {
            ProcesoServicioInicialID: null,
            TipoProductoID: null,
            Eliminar: false
        };
        $scope.CopyServicio = angular.copy($scope.Servicio);
        $scope.ValidarCelular(document.getElementById("txtCelular"));
        $scope.ConsultarCombosOrigenes();
        $scope.Titulo = "Nuevo contacto";
        $scope.PreContactosExistentes = [];
        $scope.Modo = 2;
    };   

    $scope.AbrirModalEditar = function (item, modo, OnSuccess) {
        $('.tooltip').remove();
        $scope.MostrarProgress(true);        
        $scope.AnteriorModo = modo;
        Services.Async(
            $scope.serviceBaseCRM + "PreContactos/PreContatoDetalladoConsultar/",
            { ProcesoID: item.ProcesoID, Token: $scope.Usuario.Token },
            function (response) {
                $scope.PreContacto = angular.extend({}, item, response.data);
                $scope.PreContacto.DirIP = $scope.Usuario.Ip;
                $scope.PreContacto.Usuario = $scope.Usuario.UsuarioID;
                $scope.PreContacto.Token = $scope.Usuario.Token;
                $scope.Servicio = {
                    ProcesoServicioInicialID: null,
                    TipoProductoID: null,
                    Eliminar: false
                };
                if ($scope.PreContacto.ClienteTipoPersonaID != null)
                    $scope.ChangeTipoPersona($scope.PreContacto);
                else
                    $scope.PreContacto.ShowTipoPersona = true;
                $scope.CopyServicio = angular.copy($scope.Servicio);
                if ($scope.PreContacto.Observaciones != null)
                    $scope.PreContacto.Observaciones = $scope.HtmlToText($scope.PreContacto.Observaciones);
                $scope.ConsultarCombosOrigenes();
                $scope.Titulo = "Contacto " + $scope.PreContacto.NombreCompleto;
                angular.forEach($scope.PreContacto.ProcesosServiciosIniciales, function (elem) {
                    elem.Eliminar = false;
                });
                angular.forEach($scope.PreContacto.ProcesosInmobiliariaLocalidades, function (elem) {
                    elem.Eliminar = false;
                });                
                // Aplicar la validación
                $scope.ValidarCelular(document.getElementById("txtCelular"));
                $scope.Modo = 2;
                $scope.MostrarProgress(false);
                if (OnSuccess)
                    OnSuccess();
            }
        );
    };

    $scope.BuscarTercero = function (_model, fieldTipoDocumento, fieldDocumento, fieldTipoPersona, OnSuccess, modeloCRM) {
        if (fieldTipoDocumento == undefined)
            fieldTipoDocumento = "ClienteTipoDocumentoID";
        if (fieldDocumento == undefined)
            fieldDocumento = "ClienteDocumento";
        if (_model[fieldTipoDocumento] == undefined || _model[fieldTipoDocumento] == null) {
            alertify.error("El tipo de documento es obligatorio.");
            return;
        }
        if (_model[fieldDocumento] == undefined || _model[fieldDocumento] == null || _model[fieldDocumento] == "") {
            alertify.error("El documento es obligatorio.");
            return;
        }
        if (modeloCRM == undefined)
            modeloCRM = true;
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseSIS + "Terceros/TerceroDetalladoConsultar/",
            { Token: $scope.Usuario.Token, TipoDocumentoID: _model[fieldTipoDocumento], Documento: _model[fieldDocumento] },
            function (response) {
                if (response.data.TerceroID) {
                    let _tercero = response.data;
                    if (modeloCRM) {
                        _model.ClienteTipoPersonaID = _tercero.TipoPersonaID;
                        _model.ClienteResponsabilidadTributariaID = _tercero.ResponsabilidadTributariaID;
                        _model.ClienteNombres = _tercero.Nombres;
                        _model.ClienteNombres2 = _tercero.Nombres2;
                        _model.ClienteApellidos = _tercero.Apellidos;
                        _model.ClienteApellidos2 = _tercero.Apellidos2;
                        _model.ClienteTelefono = _tercero.Telefono;
                        _model.ClienteCelular = _tercero.Celular;
                        _model.ClienteEmail = _tercero.Email;
                        _model.ClienteDireccion = _tercero.Direccion;
                        _model.ClienteEmailFacturacionElectronica = _tercero.EmailFacturacionElectronica;
                        _model.ClientePaisID = _tercero.PaisID;
                        _model.ClienteCiudadID = _tercero.CiudadID;
                        _model.ClientePaisCodigoISO = _tercero.PaisCodigoISO;
                        $scope.ChangeTipoPersona(_model, fieldTipoPersona);
                    } else {
                        _model.TipoPersonaID = _tercero.TipoPersonaID;
                        _model.ResponsabilidadTributariaID = _tercero.ResponsabilidadTributariaID;
                        _model.Nombres = _tercero.Nombres;
                        _model.Nombres2 = _tercero.Nombres2;
                        _model.Apellidos = _tercero.Apellidos;
                        _model.Apellidos2 = _tercero.Apellidos2;
                        _model.Telefono = _tercero.Telefono;
                        _model.Celular = _tercero.Celular;
                        _model.Email = _tercero.Email;
                        _model.Direccion = _tercero.Direccion;
                        _model.EmailFacturacionElectronica = _tercero.EmailFacturacionElectronica;
                        _model.PaisID = _tercero.PaisID;
                        _model.CiudadID = _tercero.CiudadID;
                        _model.PaisCodigoISO = _tercero.PaisCodigoISO;
                        $scope.ChangeTipoPersona(_model, fieldTipoPersona);
                    }
                    if (OnSuccess)
                        OnSuccess(_model);
                    $scope.MostrarProgress(false);
                } else {
                    $scope.MostrarProgress(false);
                }
                _model.ValidacionDocumento = true;
            }
        );
    };

    $scope.ChangeTipoPersona = function (_model, _fieldTipoPersonaID) {
        if (_fieldTipoPersonaID == undefined)
            _fieldTipoPersonaID = "ClienteTipoPersonaID";
        if ($filter('filter')($scope.TiposPersonas, function (elem) { return elem.TipoPersonaID == _model[_fieldTipoPersonaID] }, true)[0].Empresa == false)
            _model.ShowTipoPersona = true;
        else {
            _model.ClienteApellidos = null;
            _model.ShowTipoPersona = false;
        }
    };

    $scope.searchCamposEspeciales = function (term, modelID, object) {
        var deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseCRM + "CamposPreContactos/CamposEspecialesPreContactosConsultar/",
            { Rows: 20, Page: 1, ID: modelID, Token: $scope.Usuario.Token, CampoPreContactoID: object, FullSearch: term },
            function (response) {
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.searchFormasFormasContactos = function (term, modelID) {
        var deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseCRM + "FormasFormasContactos/FormasContactosConsultar/",
            { Rows: 20, Page: 1, FormaContactoID: modelID, SucursalID: $scope.Usuario.SucursalID, Token: $scope.Usuario.Token, Nombre: term, Activo: true },
            function (response) {
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.searchFormasFormasContactosFilter = function (term) {
        var deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseCRM + "FormasFormasContactos/FormasContactosConsultar/",
            { Rows: 20, Page: 1, SucursalID: $scope.Usuario.SucursalID, Token: $scope.Usuario.Token, Nombre: term, Activo: true },
            function (response) {
                response.rows.unshift({ FormaContactoID: null, Nombre: "Todos" });
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.searchFormasComoNosConocio = function (term, modelID) {
        var deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseCRM + "FormasComoNosConocio/FormasComoNosConocioConsultar/",
            { Rows: 20, Page: 1, Activo: true, FormaComoNosConocioID: modelID, SucursalID: $scope.Usuario.SucursalID, Token: $scope.Usuario.Token, Descripcion: term },
            function (response) {
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.ddlSearchFormasComoNosConocio = {
        onSelect: function (item) {
            $scope.PreContacto.FormaComoNosConocioDetalleID = undefined;
        }
    };

    $scope.searchFormasComoNosConocioDetalles = function (term, modelID) {
        var deferred = $q.defer();
        if ($scope.PreContacto == undefined || $scope.PreContacto == null)
            deferred.resolve([]);
        else if ($scope.PreContacto.FormaComoNosConocioID == undefined || $scope.PreContacto.FormaComoNosConocioID == null)
            deferred.resolve([]);
        else
            Services.Async(
                $scope.serviceBaseCRM + "FormasComoNosConocioDetalles/FormasComoNosConocioDetallesConsultar/",
                { Rows: 15, Page: 1, Activo: true, Token: $scope.Usuario.Token, Nombre: modelID ? null : term, FormaComoNosConocioDetalleID: modelID, FormaComoNosConocioID: modelID ? null : $scope.PreContacto.FormaComoNosConocioID },
                function (response) {
                    deferred.resolve(response.rows);
                }
            );
        return deferred.promise;
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

    $scope.searchAsesoresUsuarios = function (term, modelID) {
        let deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseCRM + "Asesores/AsesoresConsultar/",
            { Rows: 20, Page: 1, Activo: modelID ? null : true, UsuarioID: modelID, SucursalID: modelID ? null : $scope.Usuario.SucursalID, Token: $scope.Usuario.Token, NombreCompleto: term },
            function (response) {
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.searchTiposProductos = function (term, modelID, model, options) {
        var deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseSIS + "TiposProductos/TiposProductosConsultar/",
            { Rows: options.Rows, Page: options.Page, Token: $scope.Usuario.Token, SucursalID: $scope.Usuario.SucursalID, Nombre: term },
            function (response) {
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.ddlSearchTiposProductos = {
        Rows: 20,
        SyncScroll: true,
        onSelect: function (item) {
            $scope.Servicio.Nombre = item.Nombre;
        }
    };

    $scope.SearchCausalesInviabilidad = function (term, modelID, model, options) {
        var deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseCRM + "CausalesInviabilidad/CausalesInviabilidadConsultar/",
            { Rows: options.Rows, Page: options.Page, Nombre: term, Activo: true, SucursalID: $scope.Usuario.SucursalID, Token: $scope.Usuario.Token },
            function (response) {
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.ddlSearchCausalesInviabilidad = {
        Rows: 20,
        SyncScroll: true
    };

    $scope.searchFilterAsesores = function (term, modelID) {
        let deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseCRM + "Asesores/AsesoresConsultar/",
            { Rows: 20, Page: 1, Activo: true, AsesorID: modelID, SucursalID: modelID ? null : $scope.Usuario.SucursalID, Token: $scope.Usuario.Token, NombreCompleto: term },
            function (response) {
                if (modelID == undefined)
                    response.rows.unshift({ AsesorID: null, NombreCompleto: "Todos" });
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.AddServicios = function () {
        if ($scope.Servicio.TipoProductoID == undefined || $scope.Servicio.TipoProductoID == null) {
            alertify.error("Error seleccione un servicio");
            return false;
        } else if ($filter('filter')($scope.PreContacto.ProcesosServiciosIniciales, function (elem) { return elem.TipoProductoID == $scope.Servicio.TipoProductoID && elem.Eliminar == false; }, true).length > 0) {
            alertify.error("El servicio ya esta registrado");
            return false;
        } else {
            $scope.PreContacto.ProcesosServiciosIniciales.push(angular.copy($scope.Servicio));
            $scope.Servicio = angular.copy($scope.CopyServicio);
        }
    };

    $scope.RemoveServicios = function (item, index) {
        if ($scope.PreContacto.PreContactoID == null)
            $scope.PreContacto.ProcesosServiciosIniciales.splice(index, 1);
        else
            item.Eliminar = true;
    };

    $scope.SearchInmueblesDisponibles = function (term, modelID) {
        let deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseCRM + "Inmuebles/InmueblesDisponiblesConsultar/",
            { Rows: 20, Page: 1, TipoOfertaID: modelID ? null : $scope.PreContacto.OrigenPreContactoID == 5 ? 2 : 1, InmuebleID: modelID, SucursalID: modelID ? null : $scope.Usuario.SucursalID, FullSearch: term },
            function (response) {
                angular.forEach(response.rows, function (elem) {
                    elem.Descripcion = "Inmueble Nro." + elem.Consecutivo + ", " + elem.TipoInmuebleNombre + " - " + elem.Direccion;
                });
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.ddlSearchInmueblesDisponibles = {
        templeate: '<div class="content-inmueble flex flex-wrap-start" style="gap: 1px 10px; max-width: 400px;">' +
            '<div><b class="blue">Inmueble Nro.</b> {{ item.Consecutivo }}</div><div><b class="blue">Tipo inmueble: </b> {{ item.TipoInmuebleNombre }}</div><div><b class="blue">{{ item.TipoOfertaID == 1 ? "Canon" : "Venta" }}</b> {{ item.TipoOfertaID == 1 ? item.ValorCanon : item.ValorVenta | number : 0 }}</div>' +
            '<b ng-if="item.Direccion">{{ item.Direccion }}</b>' +
            '<div ng-if="item.Habitaciones"><b class="blue">Habitaciones: </b> {{ item.Habitaciones }}</div><div ng-if="item.Banos"><b class="blue">Baños: </b> {{ item.Banos }}</div><div ng-if="item.Parqueaderos"><b class="blue">Parqueaderos: </b> {{ item.Parqueaderos }}</div>' +
            '<label class="control-label control-label-sm mb-0 label-sedi1" style="padding: 0px 5px " ng-class="item.EstadoInmuebleNombre == \'Corretaje\' ? \'label-info\' : (item.EstadoInmuebleNombre == \'Rentando\' ? \'label-primary\' : (item.EstadoProcesoInmuebleID == 1 ? \'label-success\' : (item.EstadoProcesoInmuebleID == 2 || item.EstadoProcesoInmuebleID == 3 ? \'label-danger\' : \'label-warning\')))">{{ item.EstadoInmuebleNombre }}</label>' +
            '</div>',
        onSelect: function (elem) {
            if ($scope.PreContacto.ProcesoID == null) {
                $scope.PreContacto.TipoOfertaID = elem.TipoOfertaID;
                $scope.PreContacto.CondicionInmuebleID = elem.CondicionInmuebleID;
                $scope.PreContacto.TipoInmuebleID = elem.TipoInmuebleID;
                $scope.PreContacto.Cantidadhabitaciones = elem.Habitaciones;
                $scope.PreContacto.CantidadGarajes = elem.Parqueaderos;
                $scope.PreContacto.CantidadBanos = elem.Banos;
            }
        }
    };

    $scope.searchCalendariosActividadesCierresDetalles = function (term, modelID) {
        let deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseSIS + "CalendariosActividadesCierresDetalles/CalendariosActividadesCierresDetallesConsultar",
            { Page: 0, Rows: 0, CalendarioActividadCierreDetalleID: modelID, Nombre: term, SucursalID: modelID ? null : $scope.Usuario.SucursalID },
            function (response) {
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.ddlSearchCalendariosActividadesCierresDetalles = {
        ShowFilter: false
    };

    $scope.ValidarCampos = function () {
        if ($scope.PreContacto.Nombres == undefined || $scope.PreContacto.Nombres == null || $scope.PreContacto.Nombres == "") {
            alertify.error("Los nombres son obligatorios.");
            return false;
        }
        if ($scope.PreContacto.Apellidos == undefined || $scope.PreContacto.Apellidos == null || $scope.PreContacto.Apellidos == "") {
            alertify.error("Los apellidos son obligatorios.");
            return false;
        }
        if ($scope.PreContacto.Apellidos == undefined || $scope.PreContacto.Apellidos == null || $scope.PreContacto.Apellidos == "") {
            alertify.error("Los apellidos son obligatorios.");
            return false;
        }
        if ($scope.PreContacto.Celular == undefined || $scope.PreContacto.Celular == "") {
            alertify.error("El celular son requeridos");
            return false;
        }
        if ($scope.PreContacto.Celular != undefined && $scope.PreContacto.Celular.toString().length > 20) {
            alertify.error("El celular no puede tener de mas de 20 caracteres");
            return false;
        }
        if ($scope.PreContacto.FormaContactoID == undefined || $scope.PreContacto.FormaContactoID == null) {
            alertify.error("La forma de contacto es obligatorio.");
            return false;
        }
        if ($scope.PreContacto.FormaComoNosConocioID == undefined || $scope.PreContacto.FormaComoNosConocioID == null) {
            alertify.error("La forma de como nos conocieron es obligatorio.");
            return false;
        }
        if ($scope.PreContacto.AsesorID == undefined || $scope.PreContacto.AsesorID == null) {
            alertify.error("El asesor es obligatorio.");
            return false;
        }
        if ($scope.PreContacto.OrigenPreContactoID == undefined || $scope.PreContacto.OrigenPreContactoID == null) {
            alertify.error("El tipo de contacto es obligatorio.");
            return false;
        }
        if ($scope.PreContacto.OrigenPreContactoID == 2) {
            if ($scope.PreContacto.TipoOfertaID == undefined || $scope.PreContacto.TipoOfertaID == null) {
                alertify.error("El tipo de oferta es obligatoria.");
                return false;
            }
            if ($scope.PreContacto.TipoInmuebleID == undefined || $scope.PreContacto.TipoInmuebleID == null) {
                alertify.error("El tipo de inmueble es obligatorio.");
                return false;
            }
            if ($scope.PreContacto.InmuebleDireccion == undefined || $scope.PreContacto.InmuebleDireccion == null) {
                alertify.error("La dirección del inmueble es obligatoria.");
                return false;
            }
        }
        if ($scope.PreContacto.OrigenPreContactoID == 4) {
            if ($scope.PreContacto.TipoOfertaID == undefined || $scope.PreContacto.TipoOfertaID == null) {
                alertify.error("El tipo de oferta es obligatoria.");
                return false;
            }
            if ($scope.PreContacto.TipoInmuebleID == undefined || $scope.PreContacto.TipoInmuebleID == null) {
                alertify.error("El tipo de inmueble es obligatorio.");
                return false;
            }
        }
        if ($scope.PreContacto.OrigenPreContactoID == 5) {
            if ($scope.PreContacto.TipoInmuebleID == undefined || $scope.PreContacto.TipoInmuebleID == null) {
                alertify.error("El tipo de inmueble es obligatorio.");
                return false;
            }
        }
        return true;
    };
    /*
    $scope.BuscarInmuebleCodigo = function () {
        if ($scope.PreContacto.PortalInmobiliarioID == undefined || $scope.PreContacto.PortalInmobiliarioID == null) {
            alertify.error("El portal del codigo es requerido");
            return false;
        }
        if ($scope.PreContacto.CodigoPortal == undefined || $scope.PreContacto.CodigoPortal == null) {
            let _item = $filter("filter")($scope.PortalesInmobiliarios, function (elem) { return elem.PortalInmobiliarioID == $scope.PreContacto.PortalInmobiliarioID }, true)[0];
            alertify.error("El codigo del inmueble en el portal " + _item.Nombre + " es requerido");
            return false;
        }
        let _filtros = {
            Page: 1,
            Rows: 10,
            EstadoInmuebleID: 1,
            Token: $scope.Usuario.Token
        };
        if ($scope.PreContacto.PortalInmobiliarioID == 1)
            _filtros.MercadoLibre = $scope.PreContacto.CodigoPortal;
        else if ($scope.PreContacto.PortalInmobiliarioID == 2)
            _filtros.MetroCuadrado = $scope.PreContacto.CodigoPortal;
        else 
            _filtros.FincaRaiz = $scope.PreContacto.CodigoPortal;
        Services.Async(
            $scope.serviceBaseGBI + "InmueblesProcesosProcesos/InmueblesDisponiblesConsultar/",
            _filtros,
            function (response) {
                if (response.rows.length > 0) {
                    $scope.PreContacto.TipoOfertaID = response.rows[0].TipoOfertaID;
                    $scope.PreContacto.CondicionInmuebleID = response.rows[0].CondicionInmuebleID;
                    $scope.PreContacto.TipoInmuebleID = response.rows[0].TipoInmuebleID;
                    $scope.PreContacto.AntiguedadInmuebleID = response.rows[0].AntiguedadInmuebleID;
                    $scope.PreContacto.Cantidadhabitaciones = response.rows[0].Habitaciones;
                    $scope.PreContacto.CantidadGarajes = response.rows[0].Parqueaderos;
                    $scope.PreContacto.CantidadBanos = response.rows[0].Banos;
                } else {
                    alertify.error("No se encontro un inmueble con el codigo ingresado");
                }
            }
        );
    };*/

    $scope.Insertar = function () {
        if ($scope.ValidarCampos()) {
            alertify.confirm("¿Desea guardar los cambios del contacto?", function () {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseCRM + "PreContactos/PreContactosInsertar/",
                    $scope.PreContacto,
                    function (response) {
                        $scope.MostrarProgress(false);
                        alertify.success(response.rows[0].Descripcion);
                        $scope.RedireccionarCentroDeGestionamiento(response.rows[0].Codigo);
                    }, function (response) {
                        if (response.data.rows[0].ReGenerarProceso) {
                            alertify.confirm(response.data.rows[0].Descripcion + " ¿Desea crearlo de todas formas?", function () {
                                $scope.MostrarProgress(true);
                                $scope.PreContacto.GenerarNuevoPreContacto = true;
                                Services.Async(
                                    $scope.serviceBaseCRM + "PreContactos/PreContactosInsertar/",
                                    $scope.PreContacto,
                                    function (response) {
                                        $scope.MostrarProgress(false);
                                        alertify.success(response.rows[0].Descripcion);
                                        $scope.RedireccionarCentroDeGestionamiento(response.rows[0].Codigo);
                                    }, function (response) {
                                        alertify.error(response.data.rows[0].Descripcion);
                                    }
                                );
                            });
                        } else
                            alertify.error(response.data.rows[0].Descripcion)
                    }
                );
            });
        }
    };

    $scope.RedireccionarCentroDeGestionamiento = function (_ProcesoID) {
        alertify.confirm("¿Desea ir al centro de gestionamiento o proceso comercial de este contacto?", function () {
            let _proceso = {
                ProcesoID: _ProcesoID,
                Token: $scope.Usuario.Token
            };
            $scope.AbrirCentroGestion(_proceso);
            $scope.Consultar();
            $scope.LineaTiempoConsultar();
        }, function () {
            $scope.AtrasModo();
            $scope.Consultar();
            $scope.LineaTiempoConsultar();
        });
    };

    $scope.Actualizar = function () {
        if ($scope.ValidarCampos()) {
            alertify.confirm("¿Desea guardar los cambios del contacto?", function () {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseCRM + "PreContactos/PreContactosActualizar/",
                    $scope.PreContacto,
                    function (response) {
                        $scope.MostrarProgress(false);
                        alertify.success(response.rows[0].Descripcion);
                        $scope.AtrasModo();
                        if ($scope.Modo == 1) {
                            $scope.Consultar();
                            $scope.LineaTiempoConsultar();
                        } else if ($scope.Modo == 3)
                            $scope.PreContactoConsultar();
                    }, function (response) {
                        alertify.error(response.data.rows[0].Descripcion);
                    }
                );
            });
        }
    };

    $scope.ViabilizarProceso = function (item) {
        $scope.PreContacto = angular.copy(item);
        alertify.confirm("¿Desea viabilizar al contacto " + $scope.PreContacto.NombreCompleto + "?", function () {
            $scope.PreContacto.DirIP = $scope.Usuario.Ip;
            $scope.PreContacto.Usuario = $scope.Usuario.UsuarioID;
            $scope.PreContacto.Token = $scope.Usuario.Token;
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseCRM + "PreContactos/HabilitarProceso/",
                $scope.PreContacto,
                function (response) {
                    $scope.MostrarProgress(false);
                    alertify.success(response.rows[0].Descripcion);
                    if ($scope.Modo == 1) {
                        $scope.Consultar();
                        $scope.LineaTiempoConsultar();
                    } else if ($scope.Modo == 3)
                        $scope.PreContactoConsultar();
                }
            );
        });
    };

    $scope.AbrirModalInviabilizar = function (item) {
        $scope.PreContacto = angular.copy(item);
        $scope.PreContacto.DirIP = $scope.Usuario.Ip;
        $scope.PreContacto.Usuario = $scope.Usuario.UsuarioID;
        $scope.PreContacto.Token = $scope.Usuario.Token;
        $("#modalInviavilizar").modal("show");
    };

    $scope.InviabilizarPrecontacto = function () {
        if ($scope.PreContacto.CausalInviabilidadID == undefined || $scope.PreContacto.CausalInviabilidadID == null) {
            alertify.error("Debe seleccionar una causa.");
            return;
        } else if ($scope.PreContacto.ObservacionesInviabilidad == undefined || $scope.PreContacto.ObservacionesInviabilidad == null || $scope.PreContacto.ObservacionesInviabilidad == "") {
            alertify.error("Debe ingresar alguna observación.");
            return;
        } else {
            alertify.confirm("¿Desea inviabilizar al contacto " + $scope.PreContacto.NombreCompleto + "?", function () {
                $scope.MostrarProgress(true);
                if ($scope.PreContacto.BusquedaFutura == undefined) $scope.PreContacto.BusquedaFutura = false
                Services.Async(
                    $scope.serviceBaseCRM + "PreContactos/PreContactosInviabilizar/",
                    $scope.PreContacto,
                    function (response) {
                        $scope.MostrarProgress(false);
                        alertify.success(response.rows[0].Descripcion);
                        if ($scope.Modo == 1) {
                            $scope.Consultar();
                            $scope.LineaTiempoConsultar();
                        } else if ($scope.Modo == 3)
                            $scope.PreContactoConsultar();
                        $("#modalInviavilizar").modal("hide");
                    }
                );
            });
        }
    };

    $scope.CambiarEstadoContacto = function () {
        alertify.confirm("¿Desea cambiar el estado del contacto " + $scope.PreContacto.NombreCompleto + "?", function () {
            $scope.MostrarProgress(true);            
            Services.Async(
                $scope.serviceBaseCRM + "PreContactos/CambiarEstadoDelProceso",
                $scope.PreContacto,
                function (response) {
                    $scope.MostrarProgress(false);
                    alertify.success(response.rows[0].Descripcion);
                    if ($scope.Modo == 1) {
                        $scope.Consultar();
                        $scope.LineaTiempoConsultar();
                    } else if ($scope.Modo == 3)
                        $scope.PreContactoConsultar();
                    $("#ModalCambiarEstado").modal("hide");
                }
            );
        });
    };

    $scope.AbrirModalFiltrar = function () {
        $("#modalFiltrar").modal("show");
    };

    $scope.CerrarModalFiltrar = function () {
        $("#modalFiltrar").modal("hide");
    };

    $scope.QuitarFiltros = function () {
        $scope.Search = angular.copy($scope.CopySearch);
        $scope.Consultar();
        $scope.LineaTiempoConsultar();
    };

    $scope.SearchInputPreContactosExistentes = function () {
        if ($scope.TimeOutFilter)
            $timeout.cancel($scope.TimeOutFilter);
        $scope.TimeOutFilter = $timeout(function () {
            $scope.ConsultarPreContactosExistentes();
        }, 400);
    };

    $scope.ValidarCelular = function (input) {
        // Evento para cuando se escribe o pega texto
        input.addEventListener('input', function (e) {
            // Obtener el valor actual
            let valor = this.value;

            // Permitir solo números y el símbolo +
            let nuevoValor = valor.replace(/[^0-9+]/g, '');

            // Asegurar que el + solo esté al inicio (si existe)
            if (nuevoValor.indexOf('+') > 0) {
                nuevoValor = nuevoValor.replace(/\+/g, '');
            }

            // Limitar a un solo +
            if ((nuevoValor.match(/\+/g) || []).length > 1) {
                nuevoValor = '+' + nuevoValor.replace(/\+/g, '');
            }

            // Actualizar el valor del campo
            this.value = nuevoValor;
        });

        // Evento para prevenir pegar texto no válido
        input.addEventListener('paste', function (e) {
            // Obtener el texto pegado
            let valor = e.clipboardData.getData('text');

            // Permitir solo números y el símbolo +
            let nuevoValor = valor.replace(/[^0-9+]/g, '');

            // Asegurar que el + solo esté al inicio (si existe)
            if (nuevoValor.indexOf('+') > 0) {
                nuevoValor = nuevoValor.replace(/\+/g, '');
            }

            // Limitar a un solo +
            if ((nuevoValor.match(/\+/g) || []).length > 1) {
                nuevoValor = '+' + nuevoValor.replace(/\+/g, '');
            }

            // Actualizar el valor del campo
            this.value = nuevoValor;
            $scope.PreContacto.Celular = nuevoValor;
            e.preventDefault();
            // Validar el texto pegado
            //if (!/^[0-9+]+$/.test(textoPegado)) {
              //  e.preventDefault();
            //}
        });
    };

    $scope.ConsultarPreContactosExistentes = function () {
        if (($scope.PreContacto.Nombres == "" || $scope.PreContacto.Nombres == null) && ($scope.PreContacto.Apellidos == "" || $scope.PreContacto.Apellidos == null) && ($scope.PreContacto.Email == "" || $scope.PreContacto.Email == null) && ($scope.PreContacto.Celular == "" || $scope.PreContacto.Celular == null)) {
            $scope.PreContactosExistentes = [];
        } else {
            Services.Async(
                $scope.serviceBaseCRM + "PreContactos/PreContactosExistentesConsultar/",
                {
                    Nombres: $scope.PreContacto.Nombres,
                    Apellidos: $scope.PreContacto.Apellidos,
                    Email: $scope.PreContacto.Email,
                    Celular: $scope.PreContacto.Celular,
                    SucursalID: $scope.Usuario.SucursalID,
                    Token: $scope.Usuario.Token
                },
                function (response) {
                    $scope.PreContactosExistentes = response.rows;
                    if (response.rows.length > 0)
                        angular.element("#panel-menu-contactos-existentes").removeClass("closed").addClass("opened");
                    else
                        angular.element("#panel-menu-contactos-existentes").removeClass("opened").addClass("closed");
                }
            );
        }
    };

    $scope.CargarPreContactoExistente = function (item) {
        $scope.preContactoSeleccionado = angular.copy(item);
        if ($scope.PreContacto == undefined) {
            $scope.PreContacto = {
                PreContactoID: null,                
                EstadoProcesoID: 1,
                SucursalID: $scope.Usuario.SucursalID,
                OrigenPreContactoID: $scope.Search.OrigenPreContactoID,
                Nombres: item.Nombres,
                Apellidos: item.Apellidos,
                Celular: item.Celular,
                Email: item.Email,                
                ProcesosServiciosIniciales: []
            };
        } else {
            if ($scope.PreContacto.ProcesosServiciosIniciales == undefined)
                $scope.PreContacto.ProcesosServiciosIniciales = [];            
            $scope.PreContacto.Nombres = item.Nombres;
            $scope.PreContacto.Apellidos = item.Apellidos;
            $scope.PreContacto.Celular = item.Celular;
            $scope.PreContacto.Email = item.Email;            
        }
    };

    $scope.ActividadesCompletadas = false;
    $scope.DisabledFiltroActividades = false;
    $scope.VisualizarActividadesSeguimientos = function (_item, OnSuccess, CalendarioActividadID, IsNuevaActiviadad) {
        $('.tooltip').remove();
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseCRM + "PreContactos/PreContactosConsultar/",
            { ProcesoID: _item.ProcesoID, Token: $scope.Usuario.Token },
            function (response) {
                $scope.PreContacto = angular.extend({}, _item, response.rows[0]);
                if ($scope.PreContacto.AgregarActividad == undefined)
                    $scope.PreContacto.AgregarActividad = false;
                if (IsNuevaActiviadad = true)
                    $scope.PreContacto.AgregarActividad = false;
                if ($scope.Actividad)
                    $scope.Actividad.BloquearNuevaActividad = false;
                $scope.DisabledFiltroActividades = false;                
                $scope.ConsultarSeguimientos();
                $scope.ConsultarActividadesCalendarios(function () {
                    $("#modalCalendario").modal("show");
                    $scope.MostrarProgress(false);
                    if (OnSuccess)
                        OnSuccess();
                }, CalendarioActividadID);
            }
        );
    };

    $scope.NuevaActividad = function (actividad) {
        if ($scope.TiposActividades.length == 1) {
            alertify.error("Debe configurar los tipos de actividades.");
            return;
        }
        if (actividad == undefined) {
            $scope.Actividad = {
                DirIP: $scope.Usuario.Ip,
                Usuario: $scope.Usuario.UsuarioID,
                CalendarioActividadID: null,
                CalendarioActividadOrigenID: 2,
                UsuarioID: $scope.Usuario.AsesorID != null ? $scope.Usuario.UsuarioID : null,
                ComplejoID: null,
                VisitanteNombreCompleto: null,
                VisitanteDocumento: null,
                Completada: false,
                Email: null,
                BloquearNuevaActividad: false,
                Notificacion: true,
                CodigoOrigen: $scope.PreContacto.ProcesoID,
                Token: $scope.Usuario.Token
            };
        } else {
            $scope.Actividad = angular.copy(actividad);
            $scope.Actividad.Notificacion = true;
            if ($scope.Actividad.UsuarioID == null && $scope.Usuario.AsesorID != null)
                $scope.Actividad.UsuarioID = $scope.Usuario.UsuarioID;
        }
        if ($scope.Actividad.TipoCalendarioActividadID == null)
            $scope.Actividad.TipoCalendarioActividadID = $scope.TiposActividades[1].TipoCalendarioActividadID;
        $scope.ChangeTipoActividad();
        $scope.CopyActividad = angular.copy($scope.Actividad);
        $scope.PreContacto.AgregarActividad = true;
    };

    $scope.AbrirModalEditarActividad = function (item) {
        $scope.MostrarProgress(true);
        $scope.Actividad = angular.copy(item);
        $scope.Actividad.DirIP = $scope.Usuario.Ip;
        $scope.Actividad.Usuario = $scope.Usuario.UsuarioID;
        $scope.Actividad.Token = $scope.Usuario.Token;        
        $scope.PreContacto.AgregarActividad = true;
        $scope.ChangeTipoActividad();
        $scope.MostrarProgress(false);
    };

    $scope.ChangeTipoActividad = function (item) {
        let tipo = $filter("filter")($scope.TiposActividades, function (elem) { return elem.TipoCalendarioActividadID == $scope.Actividad.TipoCalendarioActividadID; }, true);
        if (tipo.length > 0) {
            $scope.Actividad.Entregable = tipo[0].Entregable;
            $scope.Actividad.TipoCalendarioActividadID = tipo[0].TipoCalendarioActividadID;
            $scope.Actividad.TipoActividadID = tipo[0].TipoActividadID;
            $scope.Actividad.TipoCalendarioActividadNombre = tipo[0].Nombre;
            if ($scope.Actividad.TipoActividadID == 1)
                $scope.Actividad.Email = ($scope.Actividad.Email == null ? ($scope.PreContacto == null ? "" : $scope.PreContacto.Email) : ($scope.Actividad.Email + ($scope.Actividad.Email != null ? (";" + $scope.Actividad.Email) : "")));
        } else {
            $scope.Actividad.Entregable = false;
            $scope.Actividad.TipoCalendarioActividadID = null;
            $scope.Actividad.TipoActividadID = null;
            $scope.Actividad.TipoCalendarioActividadNombre = "Descripción de la actividad";
        }
        if ($scope.Actividad.Entregable == true) {
            $scope.Actividad.Direccion = null;
            $scope.Actividad.Telefono = null;
            $scope.Actividad.Celular = null;
        }
    };

    $scope.ChangeFechaInicio = function () {
        $scope.Actividad.FechaVencimiento = moment($scope.Actividad.FechaInicio, "DD/MM/YYYY HH:mm").add('minutes', 60).format("DD/MM/YYYY HH:mm");
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
                        $scope.PreContacto.AgregarActividad = false;
                        $scope.ConsultarActividadesCalendarios(function () {
                            if ($scope.CopyActividad)
                                $scope.Actividad = angular.copy($scope.CopyActividad);
                            $scope.MostrarProgress(false);
                        });
                    }
                );
            });
        }
    };

    $scope.AbrirModalAgregarActividad = function () {
        $('.tooltip').remove();
        if ($scope.TiposActividades.length == 1) {
            alertify.error("Debe configurar los tipos de actividades.");
            return;
        }
        $scope.Actividad = {
            CalendarioActividadID: null,
            CalendarioActividadOrigenID: null,
            UsuarioID: $scope.Usuario.UsuarioID,
            ComplejoID: null,
            VisitanteNombreCompleto: null,
            VisitanteDocumento: null,
            Completada: false,
            Email: null,
            Notificacion: true,
            HabilitarFinalizar: false,
            CodigoOrigen: null
        };
        $scope.Actividad.TipoCalendarioActividadID = $scope.TiposActividades[1].TipoCalendarioActividadID;
        $scope.ChangeTipoActividad();
        $scope.CopyActividad = angular.copy($scope.Actividad);
        angular.element("#modalActividad").modal("show");
    };

    $scope.GuardarActividadIndividual = function () {
        if ($scope.ValidarCamposActividad()) {
            alertify.confirm("¿Desea guardar los cambios de la actividad?", function () {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseSIS + ($scope.Actividad.CalendarioActividadID == null ? "CalendariosActividades/CalendariosActividadesInsertar/" : "CalendariosActividades/CalendariosActividadesActualizar/"),
                    $scope.Actividad,
                    function (response) {
                        alertify.success(response.rows[0].Descripcion);
                        angular.element("#modalActividad").modal("hide");
                        $scope.MostrarProgress(false);
                        $scope.ConsultarActividades();
                        $scope.MiCalendarioConsultar();
                    }
                );
            });
        }
    };

    $scope.FinalizarActividadIndividual = function () {
        if ($scope.Actividad.ObservacionesCierre == null || $scope.Actividad.ObservacionesCierre == undefined) {
            alertify.error("Las observaciones de finalización es obligatoria.");
            return;
        }
        if ($scope.Actividad.CantidadActividadesCierres > 0) {
            if ($scope.Actividad.CalendarioActividadCierreDetalleID == null || $scope.Actividad.CalendarioActividadCierreDetalleID == undefined) {
                alertify.error("El tipo de cierre es obligatorio.");
                return;
            }
        }
        alertify.confirm("¿Desea finalizar la actividad " + $scope.Actividad.Asunto + "?", function () {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseSIS + "CalendariosActividades/CalendariosActividadesCerrar/",
                $scope.Actividad,
                function (response) {
                    alertify.success(response.rows[0].Descripcion);
                    angular.element("#modalActividad").modal("hide");
                    $scope.MostrarProgress(false);
                    $scope.ConsultarActividades();
                    $scope.MiCalendarioConsultar();
                }
            );
        });
    };

    $scope.searchInmuebles = function (term) {
        var deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseGBI + "Inmuebles/InmueblesConsultar/",
            { Rows: 30, Page: 1, FullSearch: term, Token: $scope.Usuario.Token },
            function (response) {
                angular.forEach(response.rows, function (elem) {
                    elem.Nombre = "Inmueble <strong>N°-" + elem.Consecutivo + "</strong>" + (elem.TipoOfertaID == 1 ? ", Canon: " : ", Oferta: ") + (elem.TipoOfertaID == 1 ? elem.ValorCanon : elem.TipoOfertaNombre) + ", Dirección: " + elem.Direccion;
                });
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.searchCiudades = function (term, modelID, model, options) {
        let deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseSIS + "Ciudades/CiudadesComboConsultar/",
            { Rows: options.Rows, Page: options.Page, CiudadID: modelID, Nombre: term, Token: $scope.Usuario.Token },
            function (response) {
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.ddlSearchCiudades = {
        Rows: 20,
        autoExpand: true,
        fixedSelect: true,
        SyncScroll: true,
    };

    $scope.AbrirModalDireccion = function () {
        $scope.address.Title = "Dirección del contacto";
        $scope.address.SetDireccionBase($scope.PreContacto.DireccionBase);
        $scope.address.OnSelectAddress = function (_DireccionBase, _Direccion, _Latitud, _Longitud, _LocalidadNombre) {
            $scope.PreContacto.DireccionBase = $scope.address.getDireccionBase();
            $scope.PreContacto.Direccion = _Direccion;
        };
    };

    $scope.FilterOrigenesContactos = function (value, index, array) {
        if (value)
            return value.OrigenPreContactoID == 2 || value.OrigenPreContactoID == 4 || value.OrigenPreContactoID == 5;
        return false;
    };

    $scope.ConsultarActividadesCalendarios = function (OnSuccess, _CalendarioActividadID) {
        Services.Async(
            $scope.serviceBaseSIS + "CalendariosActividades/CalendariosActividadesConsultar/",
            {
                Page: 0,
                Rows: 0,
                CalendarioActividadID: _CalendarioActividadID,
                CalendarioActividadOrigenID: _CalendarioActividadID ? null : 2,
                CodigoOrigen: _CalendarioActividadID ? null : $scope.PreContacto.ProcesoID,
                Completada: _CalendarioActividadID ? null : $scope.ActividadesCompletadas,
                Token: $scope.Usuario.Token
            },
            function (response) {
                $scope.CalendariosActividades = response.rows;
                if (OnSuccess)
                    OnSuccess();
            }
        );
    };

    $scope.ReConsultarTodasActividades = function () {
        $scope.MostrarProgress(true);
        $scope.DisabledFiltroActividades = false;
        $scope.ConsultarActividadesCalendarios(function () {
            $scope.MostrarProgress(false);
        });
    };

    $scope.ValidarCamposActividad = function () {
        if ($scope.Actividad.TipoCalendarioActividadID == undefined || $scope.Actividad.TipoCalendarioActividadID == null) {
            alertify.error("El tipo de la actividad es requerido.");
            return false;
        } else if ($scope.Actividad.FechaInicio == undefined || $scope.Actividad.FechaInicio == null || $scope.Actividad.FechaInicio == "") {
            alertify.error("La fecha de inicio es requerido.");
            return false;
        } else if ($scope.Actividad.FechaVencimiento == undefined || $scope.Actividad.FechaVencimiento == null || $scope.Actividad.FechaVencimiento == "") {
            alertify.error("El fecha de vencimiento es requerido.");
            return false;
        }
        return true;
    };

    $scope.EliminarActividad = function (item) {
        alertify.confirm("¿Desea eliminar la actividad " + item.Asunto + "?", function () {
            $scope.MostrarProgress(true);
            item.DirIP = $scope.Usuario.Ip;
            item.Usuario = $scope.Usuario.UsuarioID;
            item.Token = $scope.Usuario.Token;
            Services.Async(
                $scope.serviceBaseSIS + "CalendariosActividades/CalendariosActividadesEliminar/",
                item,
                function (response) {
                    alertify.success(response.rows[0].Descripcion);
                    $scope.ConsultarActividadesCalendarios(function () {
                        $scope.MostrarProgress(false);
                    });
                }
            );
        });
    };

    $scope.CancelarCierreActividad = function (elem) {
        elem.HabilitarFinalizar = false;
    };

    $scope.FinalizarActividad = function (item) {
        if (item.ObservacionesCierre == null || item.ObservacionesCierre == undefined) {
            alertify.error("Las observaciones de finalización es obligatoria.");
            return;
        }
        if (item.CantidadActividadesCierres > 0) {
            if (item.CalendarioActividadCierreDetalleID == null || item.CalendarioActividadCierreDetalleID == undefined) {
                alertify.error("El tipo de cierre es obligatorio.");
                return;
            }
        }
        if (item.SigueInteresado == false) {
            if (item.CausalInviabilidadProcesoID == null || item.CausalInviabilidadProcesoID == undefined) {
                alertify.error("La causa de inviavilidad es requerida.");
                return;
            }
        }
        item.DirIP = $scope.Usuario.Ip;
        item.Token = $scope.Usuario.Token;
        item.Usuario = $scope.Usuario.UsuarioID;
        alertify.confirm("¿Desea finalizar la actividad " + item.Asunto + "?", function () {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseSIS + "CalendariosActividades/CalendariosActividadesCerrar/",
                item,
                function (response) {
                    alertify.success(response.rows[0].Descripcion);
                    $scope.ConsultarActividadesCalendarios(function () {
                        $scope.MostrarProgress(false);
                    });
                }
            );
        });
    };

    $scope.ConsultarSeguimientos = function (OnSuccess) {        
        $scope.ConfigSeguimiento.SetFieldConfig("OrigenID", $scope.PreContacto.ProcesoID);
        $scope.ConfigSeguimiento.SetFieldConfig("OrigenSeguimientoID", "CRM-PRO");
        $scope.ConfigSeguimiento.Load(true);
        if (OnSuccess)
            OnSuccess();
    };

    $scope.AbrirLink = function (link) {
        window.open(link);
    };

    $scope.AbrirEmail = function (email) {
        window.open('mailto:' + email);
    };

    $scope.AbrirCentroGestion = function (item, OnSuccess) {
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseCRM + "PreContactos/PreContatoDetalladoConsultar/",
            { ProcesoID: item.ProcesoID, Token: $scope.Usuario.Token },
            function (response) {
                $scope.PreContacto = angular.extend({}, item, response.data);
                $scope.PreContacto.DirIP = $scope.Usuario.Ip;
                $scope.PreContacto.Usuario = $scope.Usuario.UsuarioID;
                $scope.PreContacto.Token = $scope.Usuario.Token;
                if ($scope.PreContacto.OrigenPreContactoID == 1)
                    $scope.ViewsCRM = '/js/Areas/CRM/PreContactos/StorageFull/View.html?v=' + $scope.VersionCRM;
                else if ($scope.PreContacto.OrigenPreContactoID == 2)
                    $scope.ViewsCRM = '/js/Areas/CRM/PreContactos/GBIPropietarios/View.html?v=' + $scope.VersionCRM;
                else if ($scope.PreContacto.OrigenPreContactoID == 3)
                    $scope.ViewsCRM = '/js/Areas/CRM/PreContactos/Standard/View.html?v=' + $scope.VersionCRM;
                else if ($scope.PreContacto.OrigenPreContactoID == 4)
                    $scope.ViewsCRM = '/js/Areas/CRM/PreContactos/GBIArrendatarios/View.html?v=' + $scope.VersionCRM;
                else if ($scope.PreContacto.OrigenPreContactoID == 5)
                    $scope.ViewsCRM = '/js/Areas/CRM/PreContactos/GBIVentas/View.html?v=' + $scope.VersionCRM;
                else if ($scope.PreContacto.OrigenPreContactoID == 6)
                    $scope.ViewsCRM = '/js/Areas/CRM/PreContactos/Storage/View.html?v=' + $scope.VersionCRM;
                else if ($scope.PreContacto.OrigenPreContactoID == 7)
                    if ($scope.PreContacto.TipoAvaluoID == 1)
                        $scope.ViewsCRM = '/js/Areas/CRM/PreContactos/AvaluosLinea/View.html?v=' + $scope.VersionCRM;
                    else
                        $scope.ViewsCRM = '/js/Areas/CRM/PreContactos/AvaluosCertificados/View.html?v=' + $scope.VersionCRM;
                else
                    $scope.ViewsCRM = '/js/Areas/CRM/PreContactos/Standard/View.html?v=' + $scope.VersionCRM;
                $scope.TituloGestionamiento = "Centro de gestionamiento";
                $scope.Modo = 3;
                if (OnSuccess)
                    OnSuccess();
            }
        );
    };

    $scope.PreContactoConsultar = function (OnSuccess) {
        Services.Async(
            $scope.serviceBaseCRM + "PreContactos/PreContatoDetalladoConsultar/",
            { ProcesoID: $scope.PreContacto.ProcesoID, Token: $scope.Usuario.Token },
            function (response) {
                $scope.PreContacto = angular.extend({}, $scope.PreContacto, response.data);
                $scope.PreContacto.DirIP = $scope.Usuario.Ip;
                $scope.PreContacto.Usuario = $scope.Usuario.UsuarioID;
                $scope.PreContacto.Token = $scope.Usuario.Token;
                if (OnSuccess)
                    OnSuccess()
            },
            function (response) {
                if (OnSuccess)
                    OnSuccess()
            }
        );
    };

    $scope.ActividadesPorFechaConsultar = function (event, porDia) {
        if (angular.element(event.currentTarget).closest(".dropdown").hasClass("show") == false || porDia) {
            if ($scope.Actividad.FechaInicio != null && !porDia)
                $scope.Actividad.FechaCronograma = moment($scope.Actividad.FechaInicio, "DD/MM/YYYY HH:mm").format('DD/MM/YYYY')
            if ($scope.Actividad.FechaCronograma == null)
                $scope.Actividad.FechaCronograma = moment().format('DD/MM/YYYY');
            Services.Async(
                $scope.serviceBaseSIS + "CalendariosActividades/CalendariosActividadesConsultarPorFecha",
                { UsuarioID: $scope.Actividad.UsuarioID, Fecha: $scope.Actividad.FechaCronograma, Completada: false },
                function (response) {
                    $scope.ActividadesFechas = response.data
                },
            );
        }
    };

    $scope.ActividadesPorFechaDiaSiguiente = function (event) {
        $scope.Actividad.FechaCronograma = moment($scope.Actividad.FechaCronograma, "DD/MM/YYYY HH:mm").add(1, 'days').format('DD/MM/YYYY');
        $scope.ActividadesPorFechaConsultar(event, true);
    };

    $scope.ActividadesPorFechaDiaAnterior = function (event) {
        $scope.Actividad.FechaCronograma = moment($scope.Actividad.FechaCronograma, "DD/MM/YYYY HH:mm").subtract(1, 'days').format("DD/MM/YYYY");
        $scope.ActividadesPorFechaConsultar(event, true);
    };

    $scope.Menu = [
        {
            text: '<i class="fad fa-user-edit blue"></i>&nbsp;&nbsp;Editar contacto',
            click: function ($itemScope) {
                $scope.AbrirModalEditar($itemScope.item, 1);
            }
        },
        {
            text: '<i class="fad fa-user-headset green"></i>&nbsp;&nbsp;Ir al proceso comercial',
            click: function ($itemScope) {
                $scope.AbrirCentroGestion($itemScope.item);
            }
        },
        {
            text: '<i class="fad fa-calendar-plus green"></i>&nbsp;&nbsp;Actividades y Seguimientos',
            click: function ($itemScope) {
                $scope.VisualizarActividadesSeguimientos($itemScope.item, null, null, true);
            }
        },
        {
            text: '<i class="fad fa-clone blue"></i>&nbsp;&nbsp;Duplicar proceso comercial',
            click: function ($itemScope) {
                alertify.confirm("¿Desea duplicar el proceso comercial de " + $itemScope.item.NombreCompleto + "?", function () {
                    $scope.MostrarProgress(true);
                    let _elem = angular.copy($itemScope.item);
                    Services.Async(
                        $scope.serviceBaseCRM + "PreContactos/DuplicarProcesoComercial/",
                        _elem,
                        function (response) {
                            $scope.MostrarProgress(false);
                            alertify.success(response.rows[0].Descripcion);
                            if ($scope.Modo == 1) {
                                $scope.Consultar();
                                $scope.LineaTiempoConsultar();
                            } else if ($scope.Modo == 3)
                                $scope.PreContactoConsultar();
                        }
                    );
                });
            }
        },
        {
            text: '<i class="fad fa-exchange"></i>&nbsp;&nbsp;Cambiar estado contacto',
            click: function ($itemScope) {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseCRM + "PreContactos/PreContatoDetalladoConsultar/",
                    { ProcesoID: $itemScope.item.ProcesoID, Token: $scope.Usuario.Token },
                    function (response) {
                        $scope.PreContacto = response.data;
                        $("#ModalCambiarEstado").modal("show");
                        $scope.MostrarProgress(false);
                    }
                );
            },
            displayed: function ($itemScope) {
                return $scope.Usuario.EdicionEstadoProceso == true;
            }
        },
        {
            text: '<i class="fad fa-times-circle red"></i>&nbsp;&nbsp;Inviabilizar',
            click: function ($itemScope) {
                $scope.AbrirModalInviabilizar($itemScope.item);
            },
            displayed: function ($itemScope) {
                return $itemScope.item.EstadoProcesoID != 7;
            }
        },
        {
            text: '<i class="fad fa-check-circle green"></i>&nbsp;&nbsp;Viabilizar',
            click: function ($itemScope) {
                $scope.ViabilizarProceso($itemScope.item, 1);
            },
            displayed: function ($itemScope) {
                return $itemScope.item.EstadoProcesoID == 7;
            }
        },
        {
            text: '<i class="fad fa-trash-alt red"></i>&nbsp;&nbsp;Eliminar',
            click: function ($itemScope) {
                alertify.confirm("¿Desea eliminar el contacto " + $itemScope.item.NombreCompleto + "?", function () {
                    $scope.MostrarProgress(true);
                    let _elem = angular.copy($itemScope.item);
                    _elem.DirIP = $scope.Usuario.Ip;
                    _elem.Usuario = $scope.Usuario.UsuarioID;
                    _elem.Token = $scope.Usuario.Token;
                    Services.Async(
                        $scope.serviceBaseCRM + "PreContactos/PreContactosEliminar/",
                        _elem,
                        function (response) {
                            $scope.MostrarProgress(false);
                            alertify.success(response.rows[0].Descripcion);
                            if ($scope.Modo == 1) {
                                $scope.Consultar();
                                $scope.LineaTiempoConsultar();
                            } else if ($scope.Modo == 3)
                                $scope.PreContactoConsultar();
                        }
                    );
                });
            },
            displayed: function ($itemScope) {
                return $scope.Usuario.EliminacionLeads;
            }
        },
        {
            text: '<i class="fad fa-box-open blue"></i>&nbsp;&nbsp;Ver inventario',
            click: function ($itemScope) {
                $scope.AbrirModalInventario($itemScope.item);
            },
            displayed: function ($itemScope) {
                return $itemScope.item.OrigenPreContactoID == 1 || $itemScope.item.OrigenPreContactoID == 4 || $itemScope.item.OrigenPreContactoID == 5 || $itemScope.item.OrigenPreContactoID == 6;
            }
        },
        {
            text: '<i class="fad fa-tags" style="color: #bbb;"></i>&nbsp;&nbsp;Marcar registro',
            children: [
                {
                    text: '<div class="rectangulo" style="background-color:#ffc4c9; margin-left: 13px;"></div> <span>Color 1</span>',
                    click: function ($itemScope) {
                        $scope.CambiarColorProceso($itemScope.item, "#ffc4c9", function (response) {
                            $itemScope.item.Color = "#ffc4c9";
                        });
                    }
                },
                {
                    text: '<div class="rectangulo" style="background-color: #ffc107; color: black; margin-left: 13px;"></div> <span>Color 2</span>',
                    click: function ($itemScope) {
                        $scope.CambiarColorProceso($itemScope.item, "#ffc107", function (response) {
                            $itemScope.item.Color = "#ffc107";
                        });
                    }
                },
                {
                    text: '<div class="rectangulo" style="background-color: #d4edda; margin-left: 13px;"></div> <span>Color 3</span>',
                    click: function ($itemScope) {
                        $scope.CambiarColorProceso($itemScope.item, "#d4edda", function (response) {
                            $itemScope.item.Color = "#d4edda";
                        });
                    }
                },
                {
                    text: '<div class="rectangulo" style="background-color: #e0a5ea; margin-left: 13px;"></div> <span>Color 4</span>',
                    click: function ($itemScope) {
                        $scope.CambiarColorProceso($itemScope.item, "#e0a5ea", function (response) {
                            $itemScope.item.Color = "#e0a5ea";
                        });
                    }
                },
                {
                    text: '<div class="rectangulo" style="background-color: white;margin-left: 13px;"></div> <span>Ninguno</span>',
                    click: function ($itemScope) {
                        $scope.CambiarColorProceso($itemScope.item, null, function (response) {
                            $itemScope.item.Color = null;
                        });
                    }
                }
            ]
        },
        {
            text: function ($itemScope) {
                return $itemScope.item.LineaTiempoAutomatica ? '<i class="fal fa-external-link green"></i>&nbsp;&nbsp;Desbloquear proceso' : '<i class="fal fa-external-link-square red"></i>&nbsp;&nbsp;<span class="red">Bloquear proceso<span>'
            },
            click: function ($itemScope) {
                $scope.CambiarAutomaticaLineaTiempo($itemScope.item);
            },
            displayed: function ($itemScope) {
                return $scope.ModoProcesos == "pieLine";
            }
        },
        {
            hasTopDivider: true,
            text: '<i class="fad fa-calendar"></i>&nbsp;&nbsp;Mi calendario de actividades',
            click: function ($itemScope) {
                $scope.AbrirMiCalendario($itemScope.item);
            }
        },
        {
            text: '<i class="fad fa-file-excel green"></i>&nbsp;&nbsp;Exportar contactos a excel',
            click: function ($itemScope) {
                $scope.ExportarExcel();
            },
            displayed: function ($itemScope) {
                return $scope.ModoProcesos == "tabla";
            }
        }
    ];

    $scope.CambiarColorProceso = function (_item, _Color, OnSuccess) {
        Services.Async(
            $scope.serviceBaseCRM + "PreContactos/CambiarColorProceso/",
            {
                DirIP: $scope.Usuario.Ip,
                Usuario: $scope.Usuario.UsuarioID,
                ProcesoID: _item.ProcesoID,
                Color: _Color,
                Token: $scope.Usuario.Token
            },
            function (response) {
                if (OnSuccess)
                    OnSuccess(response);
            }
        );
    };

    $scope.CambiarAutomaticaLineaTiempo = function (item) {
        Services.Async(
            $scope.serviceBaseCRM + "PreContactos/LineasTiemposAutomaticas/",
            {
                DirIP: $scope.Usuario.Ip,
                Usuario: $scope.Usuario.UsuarioID,
                ProcesoID: item.ProcesoID,
                LineaTiempoAutomatica: item.LineaTiempoAutomatica ? false : true,
                Token: $scope.Usuario.Token
            },
            function (response) {
                item.LineaTiempoAutomatica = item.LineaTiempoAutomatica ? false : true;
            }
        );
    };

    $scope.MenuActividades = [
        {
            text: '<i class="fad fa-calendar-plus green"></i>&nbsp;&nbsp;Nueva actividad',
            click: function ($itemScope) {
                $scope.NuevaActividad();
            }
        },
        {
            text: '<i class="fad fa-calendar-edit blue"></i>&nbsp;&nbsp;Modificar actividad',
            click: function ($itemScope) {
                $scope.AbrirModalEditarActividad($itemScope.item);
            },
            displayed: function ($itemScope) {
                return $itemScope.item.Completada == false && $scope.Usuario.PermiteEdicionActividades == true;
            },
            enabled: function ($itemScope) {
                return $itemScope.item.ModificacionEspecial != true;
            }
        },
        {
            text: '<i class="fad fa-trash-alt red"></i>&nbsp;&nbsp;Eliminar actividad',
            click: function ($itemScope) {
                $scope.EliminarActividad($itemScope.item);
            },
            displayed: function ($itemScope) {
                return $scope.Usuario.PermiteEliminarActividades == true;
            },
            enabled: function ($itemScope) {
                return $itemScope.item.ModificacionEspecial != true;
            }
        },
        {
            text: '<i class="fad fa-check-circle green"></i>&nbsp;&nbsp;Finalizar actividad',
            click: function ($itemScope) {
                $itemScope.item.CausalInviabilidadProcesoID = null;
                $itemScope.item.SigueInteresado = true;
                $itemScope.item.HabilitarFinalizar = true;
            },
            displayed: function ($itemScope) {
                return $itemScope.item.Completada == false;
            },
            enabled: function ($itemScope) {
                return $itemScope.item.ModificacionEspecial != true;
            }
        }
    ];

    $scope.AbrirMenu = function (event) {
        let elem = angular.element(event.currentTarget).closest(".opciones-left");
        if (elem.hasClass("opened")) {
            elem.removeClass("opened").addClass("closed");
            angular.element("#Modo3").removeClass("auto-rigth");
        } else {
            elem.removeClass("closed").addClass("opened");
            angular.element("#Modo3").addClass("auto-rigth");
        }
    };

    $scope.ExportarExcel = function () {
        $scope.MostrarProgress(true);
        let _search = angular.copy($scope.Search);
        _search.Page = 0;
        _search.Rows = 0;
        let _urlApi = $scope.serviceBaseCRM + "PreContactos/PreContactosPorOrigenConsultar/";
        if (_search.OrigenPreContactoID == 2 || _search.OrigenPreContactoID == 4 || _search.OrigenPreContactoID == 5)
            _urlApi = $scope.serviceBaseCRM + "Inmuebles/InformeProcesosConsultar/";
        else if (_search.OrigenPreContactoID == 7)
            _urlApi = $scope.serviceBaseCRM + "PreContactos/PreContactosAvaluosConsultar/";
        Services.Async(
            _urlApi,
            _search,
            function (response) {
                let _columns = [];
                _columns.push({ Titulo: "ID", ColumnName: "ProcesoID" });
                if (_search.OrigenPreContactoID == 2) {
                    _columns.push({ Titulo: "Fecha registro", ColumnName: function (elem) { return elem.Fecha == null ? null : moment(elem.Fecha).format("DD/MM/YYYY hh:mm a"); } });
                    _columns.push({ Titulo: "Fecha cierre", ColumnName: function (elem) { return elem.FechaCierre == null ? null : moment(elem.FechaCierre).format("DD/MM/YYYY hh:mm a"); } });
                    _columns.push({ Titulo: "Contacto", ColumnName: "NombreCompleto" });
                    _columns.push({ Titulo: "Celular", ColumnName: "Celular" });
                    _columns.push({ Titulo: "Email", ColumnName: "Email" });
                    _columns.push({ Titulo: "Fecha", ColumnName: "Fecha" });
                    _columns.push({ Titulo: "Oferta", ColumnName: "TipoOfertaNombre" });
                    _columns.push({ Titulo: "Inmuebles", ColumnName: "Inmuebles" });
                    _columns.push({ Titulo: "Asesor", ColumnName: "AsesorNombreCompleto" });
                    _columns.push({
                        Titulo: "Estado", ColumnName: function (elem) {
                            let _estado = elem.EstadoProcesoNombre;
                            if (elem.EstadoProcesoID == 10) {
                                _estado = "Captado";
                            }
                            return _estado;
                        }
                    });
                    _columns.push({ Titulo: "Forma de contacto", ColumnName: "FormaContactoNombre" });
                    _columns.push({ Titulo: "Como nos conocio", ColumnName: "FormaComoNosConocioDescripcion" });
                    _columns.push({ Titulo: "Detalle como nos conocio", ColumnName: "FormaComoNosConocioDetalleNombre" });
                    _columns.push({
                        Titulo: "Contrato", ColumnName: function (elem) {
                            let _descripcionContrato = null;
                            if (elem.EstadoMandato != null)
                                _descripcionContrato = elem.EstadoMandato == 1 ? "Requiere mandato" : (elem.EstadoMandato == 2 ? "Pendiente de firma mandato" : "Aprobado mandato");
                            else if (elem.EstadoCorretaje != null)
                                _descripcionContrato = elem.EstadoCorretaje == 1 ? "Requiere corretaje" : (elem.EstadoCorretaje == 2 ? "Pendiente de firma corretaje" : "Aprobado corretaje");
                            else
                                _descripcionContrato = null;
                            return _descripcionContrato;
                        }
                    });
                    _columns.push({ Titulo: "Fecha de inviabilidad", ColumnName: "FechaInviabilidad" });
                    _columns.push({ Titulo: "Causal", ColumnName: "CausalInviabilidadNombre" });
                    _columns.push({ Titulo: "Observaciones de inviabilidad", ColumnName: "ObservacionesInviabilidad" });
                } else if (_search.OrigenPreContactoID == 4) {
                    _columns.push({ Titulo: "Fecha registro", ColumnName: function (elem) { return elem.Fecha == null ? null : moment(elem.Fecha).format("DD/MM/YYYY hh:mm a"); } });
                    _columns.push({ Titulo: "Fecha cierre", ColumnName: function (elem) { return elem.FechaCierre == null ? null : moment(elem.FechaCierre).format("DD/MM/YYYY hh:mm a"); } });
                    _columns.push({ Titulo: "Contacto", ColumnName: "NombreCompleto" });
                    _columns.push({ Titulo: "Arrendatario", ColumnName: "ClienteNombreCompleto" });
                    _columns.push({ Titulo: "Celular", ColumnName: "Celular" });
                    _columns.push({ Titulo: "Email", ColumnName: "Email" });
                    _columns.push({ Titulo: "Fecha", ColumnName: "Fecha" });
                    _columns.push({ Titulo: "Que busca", ColumnName: function (elem) { return elem.TipoInmuebleNombre == null ? null : elem.TipoInmuebleNombre + (elem.TipoOfertaNombre == null ? '' : (' en ' + elem.TipoOfertaNombre)) } });
                    _columns.push({ Titulo: "Inmuebles", ColumnName: "Inmuebles" });
                    _columns.push({ Titulo: "Asesor", ColumnName: "AsesorNombreCompleto" });
                    _columns.push({
                        Titulo: "Estado", ColumnName: function (elem) {
                            let _estado = elem.EstadoProcesoNombre;
                            if (elem.EstadoProcesoID == 10)
                                _estado = "Arrendado";
                            return _estado;
                        }
                    });
                    _columns.push({ Titulo: "Forma de contacto", ColumnName: "FormaContactoNombre" });
                    _columns.push({ Titulo: "Como nos conocio", ColumnName: "FormaComoNosConocioDescripcion" });
                    _columns.push({ Titulo: "Detalle como nos conocio", ColumnName: "FormaComoNosConocioDetalleNombre" });
                    _columns.push({ Titulo: "Fecha de inviabilidad", ColumnName: "FechaInviabilidad" });
                    _columns.push({ Titulo: "Causal", ColumnName: "CausalInviabilidadNombre" });
                    _columns.push({ Titulo: "Observaciones de inviabilidad", ColumnName: "ObservacionesInviabilidad" });
                } else if (_search.OrigenPreContactoID == 5) {
                    _columns.push({ Titulo: "Fecha registro", ColumnName: function (elem) { return elem.Fecha == null ? null : moment(elem.Fecha).format("DD/MM/YYYY hh:mm a"); } });
                    _columns.push({ Titulo: "Fecha cierre", ColumnName: function (elem) { return elem.FechaCierre == null ? null : moment(elem.FechaCierre).format("DD/MM/YYYY hh:mm a"); } });
                    _columns.push({ Titulo: "Contacto", ColumnName: "NombreCompleto" });
                    _columns.push({ Titulo: "Comprador", ColumnName: "ClienteNombreCompleto" });
                    _columns.push({ Titulo: "Celular", ColumnName: "Celular" });
                    _columns.push({ Titulo: "Email", ColumnName: "Email" });
                    _columns.push({ Titulo: "Fecha", ColumnName: "Fecha" });
                    _columns.push({ Titulo: "Que busca", ColumnName: function (elem) { return elem.TipoInmuebleNombre == null ? null : elem.TipoInmuebleNombre + ' en ' + elem.TipoOfertaNombre } });
                    _columns.push({ Titulo: "Inmuebles", ColumnName: "Inmuebles" });
                    _columns.push({ Titulo: "Asesor", ColumnName: "AsesorNombreCompleto" });
                    _columns.push({ Titulo: "Estado", ColumnName: "EstadoProcesoNombre" });
                    _columns.push({ Titulo: "Forma de contacto", ColumnName: "FormaContactoNombre" });
                    _columns.push({ Titulo: "Como nos conocio", ColumnName: "FormaComoNosConocioDescripcion" });
                    _columns.push({ Titulo: "Detalle como nos conocio", ColumnName: "FormaComoNosConocioDetalleNombre" });
                    _columns.push({ Titulo: "Fecha de inviabilidad", ColumnName: "FechaInviabilidad" });
                    _columns.push({ Titulo: "Causal", ColumnName: "CausalInviabilidadNombre" });
                    _columns.push({ Titulo: "Observaciones de inviabilidad", ColumnName: "ObservacionesInviabilidad" });
                } else if (_search.OrigenPreContactoID == 7) {
                    _columns.push({ Titulo: "Fecha registro", ColumnName: function (elem) { return elem.Fecha == null ? null : moment(elem.Fecha).format("DD/MM/YYYY hh:mm a"); } });
                    _columns.push({ Titulo: "Fecha cierre", ColumnName: function (elem) { return elem.FechaCierre == null ? null : moment(elem.FechaCierre).format("DD/MM/YYYY hh:mm a"); } });
                    _columns.push({ Titulo: "Contacto", ColumnName: "NombreCompleto" });
                    _columns.push({ Titulo: "Empresa", ColumnName: "ClienteNombreCompleto" });
                    _columns.push({ Titulo: "Celular", ColumnName: "Celular" });
                    _columns.push({ Titulo: "Email", ColumnName: "Email" });
                    _columns.push({ Titulo: "Asesor", ColumnName: "AsesorNombreCompleto" });
                    _columns.push({
                        Titulo: "Cotizaciones", ColumnName: function (elem) {
                            let _inmuebles = [];
                            if (typeof elem.Cotizaciones == "string")
                                _inmuebles = JSON.parse(elem.Cotizaciones);
                            let _inmueble = "";
                            for (let i = 0; i < _inmuebles.length; i++) 
                                _inmueble += "N°-" + _inmuebles[i].Consecutivo + ", ";                            

                            return _inmueble;
                        }
                    });
                    _columns.push({ Titulo: "Tipo de avaluo", ColumnName: "TipoAvaluoNombre" });                    
                    if ($scope.CamposPreContactos.length > 0) {
                        for (let i = 0; i < $scope.CamposPreContactos.length; i++)
                            _columns.push({ Titulo: $scope.CamposPreContactos[i].LabelCampo, ColumnName: "ValorCampo" + $scope.CamposPreContactos[i].CampoPersonalizadoID });
                    }
                    _columns.push({ Titulo: "Observaciones", ColumnName: "Observaciones" });
                    _columns.push({ Titulo: "Estado", ColumnName: "EstadoProcesoNombre" });
                    
                } else {
                    _columns.push({ Titulo: "Fecha registro", ColumnName: function (elem) { return elem.Fecha == null ? null : moment(elem.Fecha).format("DD/MM/YYYY hh:mm a"); } });
                    _columns.push({ Titulo: "Fecha cierre", ColumnName: function (elem) { return elem.FechaCierre == null ? null : moment(elem.FechaCierre).format("DD/MM/YYYY hh:mm a"); } });
                    _columns.push({ Titulo: "Contacto", ColumnName: "NombreCompleto" });
                    _columns.push({ Titulo: "Empresa", ColumnName: "ClienteNombreCompleto" });
                    _columns.push({ Titulo: "Celular", ColumnName: "Celular" });
                    _columns.push({ Titulo: "Email", ColumnName: "Email" });
                    _columns.push({ Titulo: "Asesor", ColumnName: "AsesorNombreCompleto" });                    
                    if ($scope.CamposPreContactos.length > 0) {
                        for (let i = 0; i < $scope.CamposPreContactos.length; i++)
                            _columns.push({ Titulo: $scope.CamposPreContactos[i].LabelCampo, ColumnName: "ValorCampo" + $scope.CamposPreContactos[i].CampoPersonalizadoID });
                    }
                    _columns.push({ Titulo: "Observaciones", ColumnName: "Observaciones" });
                    _columns.push({ Titulo: "Estado", ColumnName: "EstadoProcesoNombre" });                    
                    if ($scope.Configuracion.FechaLogisticaCentroGestion == true)
                        _columns.push({ Titulo: "Fecha logistica", ColumnName: "FechaLogistica" });                    
                }

                let options = {
                    columns: _columns,
                    dateNF: "dd/MM/yyyy",
                    cellStylesHeader: {
                        bold: true,
                        sz: 12,
                        fgColor: { rgb: 0xD8D8D8 }
                    },
                    parseDate: function (date) {
                        if (date == null)
                            return null;
                        else
                            return moment(date).format("DD/MM/YYYY");
                    }
                };
                let ws = XLSX.utils.json_to_sheet(response.rows, options);
                ws['!autofilter'] = {
                    ref: options.refHeader
                };
                let wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Contactos");
                XLSX.writeFile(wb, "Informe_Centro_Gestion_Comercial.xlsx", { cellStyles: true });
                $scope.MostrarProgress(false);
            }
        );
    };

    $scope.ConsultarCombosOrigenes = function () {
        if ($scope.PreContacto.OrigenPreContactoID == 2 || $scope.PreContacto.OrigenPreContactoID == 4 || $scope.PreContacto.OrigenPreContactoID == 5 || $scope.PreContacto.OrigenPreContactoID == 7) {
            if ($scope.TiposOfertas == undefined) {
                Services.Async(
                    $scope.serviceBaseGBI + "TiposOfertas/TiposOfertasConsultar/",
                    { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
                    function (response) {
                        $scope.TiposOfertas = response.rows;
                        $scope.TiposOfertas.unshift({ TipoOfertaID: null, Nombre: " -- Seleccione -- " });
                    }
                );
            }
            if ($scope.CondicionesInmuebles == undefined) {
                Services.Async(
                    $scope.serviceBaseGBI + "CondicionesInmuebles/CondicionesInmueblesConsultar/",
                    { Token: $scope.Usuario.Token },
                    function (response) {
                        $scope.CondicionesInmuebles = response.rows;
                        $scope.CondicionesInmuebles.unshift({ CondicionInmuebleID: null, Nombre: "Nuevo / Usado" });
                    }
                );
            }
            if ($scope.TiposInmuebles == undefined) {
                Services.Async(
                    $scope.serviceBaseGBI + "TiposInmuebles/TiposInmueblesConsultar/",
                    { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
                    function (response) {
                        $scope.TiposInmuebles = response.rows;
                        $scope.TiposInmuebles.unshift({ TipoInmuebleID: null, Nombre: " -- Seleccione -- " });
                    }
                );
            }
            if ($scope.TiposAvaluos == undefined) {
                Services.Async(
                    $scope.serviceBaseGBI + "TiposAvaluos/TiposAvaluosConsultar/",
                    { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
                    function (response) {
                        $scope.TiposAvaluos = response.rows;
                        $scope.TiposAvaluosFilter = response.rows;
                        $scope.TiposAvaluos.unshift({ TipoAvaluoID: null, Nombre: " -- Seleccione -- " });
                        $scope.TiposAvaluosFilter.unshift({ TipoAvaluoID: null, Nombre: "Todas" });
                    }
                );
            }
            if ($scope.Localidades == undefined) {
                Services.Async(
                    $scope.serviceBaseSIS + "Localidades/LocalidadesConsultar/",
                    { Rows: 0, Page: 0, CiudadID: 1204, Token: $scope.Usuario.Token },
                    function (response) {
                        $scope.Localidades = response.rows;
                        $scope.Localidades.unshift({ LocalidadID: null, Nombre: " -- Seleccione -- " });
                    }
                );
            }
            if ($scope.AntiguedadesInmuebles == undefined) {
                Services.Async(
                    $scope.serviceBaseGBI + "AntiguedadesInmuebles/AntiguedadesInmueblesConsultar/",
                    { Token: $scope.Usuario.Token },
                    function (response) {
                        $scope.AntiguedadesInmuebles = response.rows;
                        $scope.AntiguedadesInmuebles.unshift({ AntiguedadInmuebleID: null, Nombre: " -- Seleccione -- " });
                    }
                );
            }
        }
    };

    $scope.Sincronizar = function (OnSuccess) {
        if (!OnSuccess)
            $scope.MostrarProgress(true);
        $scope.PreContactoConsultar(function () {
            let scope = angular.element("[class*=Crm-View]").scope();
            if (scope.SetField)
                scope.SetField("PreContacto", $scope.PreContacto);
            if (!OnSuccess)
                $scope.MostrarProgress(false);
            else
                OnSuccess();
        });
    };

    $scope.MostrarHeaderPrincipal = function (bool) {
        if (bool)
            document.getElementById("headerPrincipal").style.display = "block";
        else
            document.getElementById("headerPrincipal").style.display = "none";
    };

    $scope.OnLoadInclude = function () {
        let scope = angular.element("[class*=Crm-View]").scope();
        if (scope.SetField)
            scope.SetField("PreContacto", $scope.PreContacto);
        $scope.MostrarProgress(false);
    };

    $scope.AbrirModalInventario = function (PreContacto) {
        var scope = angular.element(".Crm-Inventario").scope();
        if (scope)
            if (scope.AbrirInventario)
                scope.AbrirInventario(PreContacto);
    };

    $scope.CerrarModalInventario = function (PreContacto) {
        var scope = angular.element(".Crm-Inventario").scope();
        if (scope)
            if (scope.CerrarInventario)
                scope.CerrarInventario();
    };

    $scope.InitLocalidades = function (elem) {
        if ($filter("filter")($scope.PreContacto.ProcesosInmobiliariaLocalidades, function (item) { return item.Eliminar == false && item.LocalidadID == elem.LocalidadID }, true).length > 0)
            elem.Seleccionar = true;
        else
            elem.Seleccionar = false;
    };

    $scope.ChangeLocalidades = function (elem) {
        let _arrayLocalidades = $filter("filter")($scope.PreContacto.ProcesosInmobiliariaLocalidades, function (elem2) { return elem2.LocalidadID == elem.LocalidadID; }, true);
        if (elem.Seleccionar) {
            if (_arrayLocalidades.length == 0) {
                elem.Eliminar = false;
                $scope.PreContacto.ProcesosInmobiliariaLocalidades.push(elem);
            } else {
                angular.forEach($scope.PreContacto.ProcesosInmobiliariaLocalidades, function (item) {
                    item.Eliminar = false;
                });
            }
        } else {
            for (let i = 0; i < _arrayLocalidades.length; i++) {
                if (_arrayLocalidades[i].ProcesoInmobiliariaLocalidadID == undefined) {
                    _arrayLocalidades.splice(i, 1);
                    i--;
                } else
                    _arrayLocalidades[i].Eliminar = true;
            }
        }
    };

    $scope.TablaActividades = [];
    $scope.Estados = [{ ID: null, Nombre: "Todas" }, { ID: 1, Nombre: "Finalizadas" }, { ID: 2, Nombre: "Vigentes" }, { ID: 3, Nombre: "Vencidas" }, { ID: 4, Nombre: "Pendientes o proximas a vencer" }, { ID: "3,4", Nombre: "Vencidas y Pendientes" }];
    $scope.EstadosCompletadasCalendario = [{ ID: null, Nombre: "Todas" }, { ID: true, Nombre: "Actividades finalizadas" }, { ID: false, Nombre: "Actividades pendientes" }];

    $scope.searchActividades = {
        Page: 1,
        Rows: 30,
        SucursalID: $scope.Usuario.SucursalID,
        EstadoActividadID: "3,4",
        FechaFinal: moment().format("DD/MM/YYYY"),
        TipoCalendarioActividadID: null,
        UsuarioID: $scope.Usuario.UsuarioID,
        Usuario: $scope.Usuario.NombreCompleto
    };

    $scope.copySearchActividades = angular.copy($scope.searchActividades);

    $scope.GlobalOrderActividades = function (field, _event) {
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
        $scope.searchActividades.SortColumn = field;
        $scope.searchActividades.SortDirection = _order;
        $scope.ConsultarActividades();
    };

    $scope.AnteriorActividades = function () {
        if ($scope.searchActividades.Page > 1) {
            $scope.searchActividades.Page--;
            $scope.ConsultarActividades();
        }
    };

    $scope.SiguienteActividades = function (_field) {
        if (($scope.searchActividades.Page * $scope.searchActividades.Rows) < $scope[_field][0].TotalRows) {
            $scope.searchActividades.Page++;
            $scope.ConsultarActividades();
        }
    };

    $scope.GlobalSearchActividades = function () {
        if ($scope.TimeOutFilter)
            $timeout.cancel($scope.TimeOutFilter);
        $scope.TimeOutFilter = $timeout(function () {
            $scope.searchActividades.Page = 1;
            $scope.ConsultarActividades();
        }, 2000);
    };

    $scope.ConsultarActividades = function (OnSuccess, page) {
        if (page)
            $scope.searchActividades.Page = page;
        if ($scope.searchActividades.Fecha != undefined)
            if ($scope.searchActividades.Fecha.length < 10)
                $scope.searchActividades.Fecha = moment().format("DD/MM/YYYY");
        Services.Async(
            $scope.serviceBaseCRM + "CalendariosActividades/MiCalendarioTablaConsultar/",
            $scope.searchActividades,
            function (response) {
                $scope.TablaActividades = response.rows;
                if (OnSuccess)
                    OnSuccess();
            }
        );
    };

    $scope.searchAsesoresUsuariosCalendario = function (term, modelID) {
        let deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseCRM + "Asesores/AsesoresConsultar/",
            { Rows: 20, Page: 1, Activo: modelID ? null : true, UsuarioID: modelID, SucursalID: modelID ? null : $scope.Usuario.SucursalID, Token: $scope.Usuario.Token, NombreCompleto: term },
            function (response) {
                response.rows.unshift({ UsuarioID: null, NombreCompleto: "Todos" });
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    };

    $scope.DiaAnteriorCalendario = function () {
        $scope.searchActividades.FechaInicial = null;
        $scope.searchActividades.FechaFinal = null;
        if ($scope.searchActividades.Fecha == undefined || $scope.searchActividades.Fecha == null || $scope.searchActividades.Fecha == undefined || $scope.searchActividades.Fecha == "" || $scope.searchActividades.Fecha.length != 10)
            $scope.searchActividades.Fecha = moment().format("DD/MM/YYYY");
        $scope.searchActividades.Fecha = moment($scope.searchActividades.Fecha, "DD/MM/YYYY").subtract(1, 'days').format("DD/MM/YYYY");
        $scope.ConsultarActividades();
    };

    $scope.DiaSiguienteCalendario = function () {
        $scope.searchActividades.FechaInicial = null;
        $scope.searchActividades.FechaFinal = null;
        if ($scope.searchActividades.Fecha == undefined || $scope.searchActividades.Fecha == null || $scope.searchActividades.Fecha == undefined || $scope.searchActividades.Fecha == "" || $scope.searchActividades.Fecha.length != 10)
            $scope.searchActividades.Fecha = moment().format("DD/MM/YYYY");
        $scope.searchActividades.Fecha = moment($scope.searchActividades.Fecha, "DD/MM/YYYY").add(1, 'days').format("DD/MM/YYYY");
        $scope.ConsultarActividades();
    };

    $scope.AbrirMiCalendario = function () {
        $scope.Titulo = "Mi calendario de actividades";
        $scope.MostrarProgress(true);
        $scope.Modo = 4;
        $scope.MostrarProgress(false);
    };

    $scope.MenuCalendarios = [
        {
            text: '<i class="fal fa-calendar-star orange"></i>&nbsp;&nbsp;Duplicar actividad',
            click: function ($itemScope) {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseSIS + "CalendariosActividades/CalendariosActividadesConsultar/",
                    { Page: 0, Rows: 0, CalendarioActividadID: $itemScope.item.CalendarioActividadID },
                    function (response) {
                        $scope.Actividad = response.rows[0];
                        $scope.Actividad.Asunto = null;
                        $scope.Actividad.HabilitarFinalizar = false;
                        $scope.Actividad.CalendarioActividadID = null;
                        angular.element("#modalActividad").modal("show");
                        $scope.MostrarProgress(false);
                    }
                );
            },
            displayed: function ($itemScope) {
                return $itemScope.item.ProcesoID == null;
            }
        },
        {
            text: '<i class="fad fa-calendar-edit blue"></i>&nbsp;&nbsp;Modificar actividad',
            click: function ($itemScope) {
                $scope.MostrarProgress(true);
                $scope.Actividad = angular.copy($itemScope.item);
                $scope.Actividad.HabilitarFinalizar = false;
                $scope.ChangeTipoActividad();
                angular.element("#modalActividad").modal("show");
                $scope.MostrarProgress(false);
            },
            displayed: function ($itemScope) {
                return $itemScope.item.ProcesoID == null && $scope.Usuario.PermiteEdicionActividades == true;
            },
            enabled: function ($itemScope) {
                return $itemScope.item.Completada == false;
            }
        },
        {
            text: '<i class="fad fa-trash-alt red"></i>&nbsp;&nbsp;Eliminar actividad',
            click: function ($itemScope) {
                let item = $itemScope.item;
                alertify.confirm("¿Desea eliminar la actividad " + item.Asunto + "?", function () {
                    $scope.MostrarProgress(true);
                    Services.Async(
                        $scope.serviceBaseSIS + "CalendariosActividades/CalendariosActividadesEliminar/",
                        item,
                        function (response) {
                            alertify.success(response.rows[0].Descripcion);
                            $scope.MostrarProgress(false);
                            $scope.ConsultarActividades();
                        }
                    );
                });
            },
            displayed: function ($itemScope) {
                return $itemScope.item.ProcesoID == null;
            },
            enabled: function ($itemScope) {
                return $scope.Usuario.PermiteEliminarActividades == true;
            }
        },
        {
            text: '<i class="fad fa-check-circle green"></i>&nbsp;&nbsp;Finalizar actividad',
            click: function ($itemScope) {
                $scope.MostrarProgress(true);
                Services.Async(
                    $scope.serviceBaseSIS + "CalendariosActividades/CalendariosActividadesConsultar/",
                    { Page: 0, Rows: 0, CalendarioActividadID: $itemScope.item.CalendarioActividadID },
                    function (response) {
                        $scope.Actividad = response.rows[0];
                        $scope.Actividad.HabilitarFinalizar = true;
                        angular.element("#modalActividad").modal("show");
                        $scope.MostrarProgress(false);
                    }
                );
            },
            displayed: function ($itemScope) {
                return $itemScope.item.ProcesoID == null;
            },
            enabled: function ($itemScope) {
                return $itemScope.item.Completada == false;
            }
        },
        {
            text: '<i class="fal fa-calendar blue"></i>&nbsp;&nbsp;Ir a la actividad del proceso comercial',
            click: function ($itemScope) {
                $scope.AbrirCentroGestionDesdeCalendario($itemScope.item);
            },
            enabled: function ($itemScope) {
                return $itemScope.item.ProcesoID != null;
            }
        },
        null,
        {
            text: '<i class="fad fa-file-excel green"></i>&nbsp;&nbsp;Exportar las actividades',
            click: function ($itemScope) {
                $scope.ExportarActividadesExcel();
            }
        }
    ];

    $scope.AbrirCentroGestionDesdeCalendario = function (elem) {
        if (elem.ProcesoID == undefined) {
            alertify.error("La actividad no se puede abrir por que no esta asociada a un proceso.");
            return;
        }
        let _proceso = {
            ProcesoID: elem.ProcesoID,
            Token: $scope.Usuario.Token
        };
        $scope.AnteriorModo = 4;
        $scope.AbrirCentroGestion(_proceso, function () {
            $scope.VisualizarActividadesSeguimientos($scope.PreContacto, function () {
                $scope.DisabledFiltroActividades = false;
            }, elem.CalendarioActividadID, null);
        });
    };

    $scope.ExportarActividadesExcel = function () {
        $scope.MostrarProgress(true);
        let _search = angular.copy($scope.searchActividades);
        _search.Page = 0;
        _search.Rows = 0;
        Services.Async(
            $scope.serviceBaseCRM + "CalendariosActividades/MiCalendarioTablaConsultar/",
            _search,
            function (response) {
                let _columns = [
                    { Titulo: "ID", ColumnName: "CalendarioActividadID" },
                    { Titulo: "Fecha actividad", ColumnName: "FechaInicio" },
                    { Titulo: "Fecha vencimiento", ColumnName: "FechaVencimiento" },
                    {
                        Titulo: "Estado", ColumnName: function (item) {
                            return item.EstadoActividadID == 1 ? 'Finalizada' : (item.EstadoActividadID == 2 ? 'Vigente' : (item.EstadoActividadID == 3 ? 'Vencida' : 'Pendiente'))
                        }
                    },
                    { Titulo: "Actividad", ColumnName: "Asunto" },
                    { Titulo: "Contacto", ColumnName: "Contacto" },
                    { Titulo: "Celular", ColumnName: "Celular" },
                    { Titulo: "Dirección", ColumnName: "Direccion" },
                    { Titulo: "Email", ColumnName: "Email" },
                    { Titulo: "Inmueble", ColumnName: "InmuebleDescripcion" },
                    { Titulo: "Descripcion", ColumnName: "Descripcion" },
                ];                
                _columns.push({ Titulo: "Tipo de cierre", ColumnName: "CalendarioActividadCierreDetalleNombre" });
                _columns.push({ Titulo: "Cliente", ColumnName: "Cliente" })
                _columns.push({ Titulo: "Usuario", ColumnName: "Usuario" })
                let options = {
                    columns: _columns,
                    dateNF: "dd/MM/yyyy",
                    cellStylesHeader: {
                        bold: true,
                        sz: 12,
                        fgColor: { rgb: 0xD8D8D8 }
                    },
                    parseDate: function (date) {
                        return moment(date).format("DD/MM/YYYY hh:mm a");
                    }
                };
                let ws = XLSX.utils.json_to_sheet(response.rows, options);
                ws['!autofilter'] = {
                    ref: options.refHeader
                };
                let wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Actividades");
                XLSX.writeFile(wb, "Informe_Actividades.xlsx", { cellStyles: true });
                $scope.MostrarProgress(false);
            }
        );
    };

    calendarConfig.dateFormatter = 'moment';
    calendarConfig.i18nStrings.weekNumber = 'Semana {week}';
    calendarConfig.titleFormats.week = 'Semana {week} del año {year}';
    calendarConfig.dateFormats.time = 'hh:mm a';

    moment.locale('es');
    $scope.Page = {
        events: [],
        calendarTitle: null,
        calendarView: 'month',
        viewDate: moment()
    };        

    var _actionsProceso = {
        label: '<i class="fal fa-calendar" style="color: #89c0ef"></i>&nbsp;&nbsp;<span style="color: #89c0ef">Ir al proceso comercial</span>',
        onClick: function (args) {
            $scope.AbrirCentroGestionDesdeCalendario(args.calendarEvent);
        }
    };

    var _actionsDuplicar = {
        label: '<i class="fal fa-calendar-star" style="color: #f9a076"></i>&nbsp;&nbsp;<span style="color: #f9a076">Duplicar</span>',
        onClick: function (args) {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseSIS + "CalendariosActividades/CalendariosActividadesConsultar/",
                { Page: 0, Rows: 0, CalendarioActividadID: args.calendarEvent.CalendarioActividadID },
                function (response) {
                    $scope.Actividad = response.rows[0];
                    $scope.Actividad.Asunto = null;
                    $scope.Actividad.HabilitarFinalizar = false;
                    $scope.Actividad.CalendarioActividadID = null;
                    $scope.ChangeTipoActividad();
                    angular.element("#modalActividad").modal("show");
                    $scope.MostrarProgress(false);
                }
            );
        }
    };

    var _actionsModificar = {
        label: '<i class="fad fa-calendar-edit" style="color: #8ea9c1"></i>&nbsp;&nbsp;<span style="color: #8ea9c1">Modificar</span>',
        onClick: function (args) {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseSIS + "CalendariosActividades/CalendariosActividadesConsultar/",
                { Page: 0, Rows: 0, CalendarioActividadID: args.calendarEvent.CalendarioActividadID },
                function (response) {
                    $scope.Actividad = response.rows[0];
                    $scope.Actividad.HabilitarFinalizar = false;
                    $scope.ChangeTipoActividad();
                    angular.element("#modalActividad").modal("show");
                    $scope.MostrarProgress(false);
                }
            );
        }
    };

    var _actionsFinalizar = {
        label: '<i class="fad fa-check-circle" style="color: #b3d9b3"></i>&nbsp;&nbsp;<span style="color: #b3d9b3">Finalizar</span>',
        onClick: function (args) {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseSIS + "CalendariosActividades/CalendariosActividadesConsultar/",
                { Page: 0, Rows: 0, CalendarioActividadID: args.calendarEvent.CalendarioActividadID, SucursalID: $scope.Usuario.SucursalID },
                function (response) {
                    $scope.Actividad = response.rows[0];
                    $scope.Actividad.HabilitarFinalizar = true;
                    angular.element("#modalActividad").modal("show");
                    $scope.MostrarProgress(false);
                }
            );
        }
    };

    $scope.searchMiCalendario = {
        EstadoActividadID: "3,4",
        SucursalID: $scope.Usuario.SucursalID,
        TipoCalendarioActividadID: null,
        UsuarioID: $scope.Usuario.UsuarioID,
        Usuario: $scope.Usuario.NombreCompleto,
        Token: $scope.Usuario.Token
    };

    $scope.MiCalendarioConsultar = function () {
        if ($scope.Page.calendarView == 'year') {
            $scope.searchMiCalendario.AnoCalendario = parseInt(moment($scope.Page.viewDate).format("YYYY"));
            $scope.searchMiCalendario.MesCalendario = null;
            $scope.searchMiCalendario.SemanaCalendario = null;
            $scope.searchMiCalendario.DiaCalendario = null;
            $scope.searchMiCalendario.ModoCalendar = 'year';
        } else if ($scope.Page.calendarView == 'month') {
            $scope.searchMiCalendario.AnoCalendario = parseInt(moment($scope.Page.viewDate).format("YYYY"));
            $scope.searchMiCalendario.MesCalendario = parseInt(moment($scope.Page.viewDate).format("MM"));
            $scope.searchMiCalendario.SemanaCalendario = null;
            $scope.searchMiCalendario.DiaCalendario = null;
            $scope.searchMiCalendario.ModoCalendar = 'month';
        } else if ($scope.Page.calendarView == 'week') {
            $scope.searchMiCalendario.AnoCalendario = parseInt(moment($scope.Page.viewDate).format("YYYY"));
            $scope.searchMiCalendario.MesCalendario = parseInt(moment($scope.Page.viewDate).format("MM"));
            $scope.searchMiCalendario.SemanaCalendario = parseInt(moment($scope.Page.viewDate).format("W"));
            $scope.searchMiCalendario.DiaCalendario = null;
            $scope.searchMiCalendario.ModoCalendar = 'week';
        } else {
            $scope.searchMiCalendario.AnoCalendario = parseInt(moment($scope.Page.viewDate).format("YYYY"));
            $scope.searchMiCalendario.MesCalendario = parseInt(moment($scope.Page.viewDate).format("MM"));
            $scope.searchMiCalendario.SemanaCalendario = null;
            $scope.searchMiCalendario.DiaCalendario = parseInt(moment($scope.Page.viewDate).format("DD"));
            $scope.searchMiCalendario.ModoCalendar = 'day';
        }
        Services.Async(
            $scope.serviceBaseCRM + "CalendariosActividades/MiCalendarioConsultar/",
            $scope.searchMiCalendario,
            function (response) {
                angular.forEach(response.data, function (elem) {
                    if (elem.startsAt != null)
                        elem.startsAt = new Date(elem.startsAt);
                    if (elem.endsAt != null)
                        elem.endsAt = new Date(elem.endsAt);
                    let _arrayActions = [];
                    if (elem.ProcesoID != null)
                        _arrayActions.push(_actionsProceso);
                    else {
                        _arrayActions.push(_actionsDuplicar);
                        if (elem.Completada == false) {
                            _arrayActions.push(_actionsModificar);
                            _arrayActions.push(_actionsFinalizar);
                        }
                    }
                    elem.actions = _arrayActions;
                });
                $scope.Page.events = response.data;
            }
        );
    };

    $scope.InfoEvento = function (evento) {
        if (evento.ProcesoID != null)
            $scope.AbrirCentroGestionDesdeCalendario(evento);
        else {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseSIS + "CalendariosActividades/CalendariosActividadesConsultar/",
                { Page: 0, Rows: 0, CalendarioActividadID: evento.CalendarioActividadID },
                function (response) {
                    $scope.Actividad = response.rows[0];
                    $scope.Actividad.HabilitarFinalizar = true;
                    $scope.ChangeTipoActividad();
                    angular.element("#modalActividad").modal("show");
                    $scope.MostrarProgress(false);
                }
            );
        }
    };

    $scope.LineaTiempoSortOptions = {
        accept: function (sourceItemHandleScope, destSortableScope) {
            return true;
            // sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
        },
        itemMoved: function (event) {
            Services.Async(
                $scope.serviceBaseCRM + "PreContactos/MoverLineaTiempo/",
                {
                    DirIP: $scope.Usuario.Ip,
                    Usuario: $scope.Usuario.UsuarioID,
                    ProcesoID: event.source.itemScope.modelValue.ProcesoID,
                    ProcesoLineaTiempoID: event.dest.sortableScope.$parent.Linea.ProcesoLineaTiempoID,
                    Token: $scope.Usuario.Token
                },
                function (response) {
                    event.source.sortableScope.$parent.Linea.TotalProcesos -= 1;
                    event.source.sortableScope.$parent.Linea.TotalValorNegocio -= event.source.itemScope.modelValue.ValorNegocio;
                    event.dest.sortableScope.$parent.Linea.TotalProcesos += 1;
                    event.dest.sortableScope.$parent.Linea.TotalValorNegocio += event.source.itemScope.modelValue.ValorNegocio;
                    event.dest.sortableScope.$parent.Linea.EstadoLineaTiempoID = response.rows[0].Codigo;
                    event.source.itemScope.modelValue.status = event.dest.sortableScope.$parent.Linea.ProcesoLineaTiempoID;
                },
                function (response) {
                    event.source.sortableScope.$parent.Linea.Procesos.splice(event.source.index, 0, angular.copy(event.source.itemScope.modelValue));
                    event.dest.sortableScope.$parent.Linea.Procesos.splice(event.dest.index, 1);
                    if (response.data.Message)
                        alertify.error(response.data.Message);
                }
            );
        },
        containment: '#ContainerLineaTiempo'
    };

    $scope.FinishRenderLineaTiempo = function () {
        angular.element("div.pie-line-column-content").bind('scroll', function () {
            if (this.scrollTop >= (this.scrollHeight - this.clientHeight - 5))
                $scope.ScrollLineaTiempo(this);
        });
    };

    $scope.ScrollLineaTiempo = function (elem) {
        let _ProcesoLineaTiempoID = parseInt(angular.element(elem).attr("index"));
        let _lineaTiempo = $filter("filter")($scope.PreContactosLineaTiempo, function (elem) { return elem.ProcesoLineaTiempoID == _ProcesoLineaTiempoID }, true)[0];
        if (_lineaTiempo.Page == undefined)
            _lineaTiempo.Page = 1;
        if (_lineaTiempo.Rows == undefined)
            _lineaTiempo.Rows = 20;
        if (_lineaTiempo.Page + 1 <= Math.ceil(_lineaTiempo.TotalProcesos / _lineaTiempo.Rows)) {
            _lineaTiempo.Page = _lineaTiempo.Page + 1;
            let filtros = angular.copy($scope.Search);
            filtros.EstadoProcesoID = null;
            filtros.Page = _lineaTiempo.Page;
            filtros.Rows = _lineaTiempo.Rows;
            filtros.ProcesoLineaTiempoID = _lineaTiempo.ProcesoLineaTiempoID;
            Services.Async(
                $scope.serviceBaseCRM + "PreContactos/LineasTiemposConsultar/",
                filtros,
                function (response) {
                    for (let i = 0; i < response.data[0].Procesos.length; i++)
                        _lineaTiempo.Procesos.push(response.data[0].Procesos[i]);
                }
            );
        }
    };

    $scope.ModoVistaProcesos = function (modo) {
        $scope.ModoProcesos = modo;
        if (modo == "pieLine") {
            if ($filter("filter")($scope.FilterOrigenesPreContactos, function (elem) { return elem.OrigenPreContactoID == null }, true).length > 0)
                $scope.FilterOrigenesPreContactos.splice(0, 1);
        } else {
            if ($filter("filter")($scope.FilterOrigenesPreContactos, function (elem) { return elem.OrigenPreContactoID == null }, true).length == 0)
                $scope.FilterOrigenesPreContactos.unshift({ OrigenPreContactoID: null, Nombre: "Todos" });
        }
    };
    //////// prueba *///////
    $scope.InitParseJson = function (item, Field) {
        if (typeof item[Field] === 'string')
            item[Field] = JSON.parse(item[Field]);
    };

    $scope.ChangeFullSearch = function (linea) {
        let _lineaTiempo = angular.copy(linea);
        if ($scope.TimeOutFilter)
            $timeout.cancel($scope.TimeOutFilter);
        $scope.TimeOutFilter = $timeout(function () {
            _lineaTiempo.Page = 1;
            if (_lineaTiempo.Rows == undefined)
                _lineaTiempo.Rows = 20;
            let filtros = angular.copy($scope.Search);
            filtros.EstadoProcesoID = null;
            filtros.FullSearch = _lineaTiempo.FullSearch;
            filtros.Page = _lineaTiempo.Page;
            filtros.Rows = _lineaTiempo.Rows;
            filtros.ProcesoLineaTiempoID = _lineaTiempo.ProcesoLineaTiempoID;
            Services.Async(
                $scope.serviceBaseCRM + "PreContactos/LineasTiemposConsultar/",
                filtros,
                function (response) {
                    linea.TotalProcesos = response.data[0].TotalProcesos;
                    linea.TotalValorNegocio = response.data[0].TotalValorNegocio;
                    linea.Procesos = response.data[0].Procesos;
                }
            );
        }, 1500);
    };

    $scope.MostrarAuditoriaActividad = function (_event, item) {
        let _table = '<label class="control-label control-label-sm">Auditoria de la actividad</label>' +
            '<button class="close ml-10" onclick="CerrarPopover(this)"><i class="fal fa-times"></i></button>' +
            '<table class="table table-sm mb-0">' +
            '<tbody>' +
            '<tr>' +
            '<td class="blue">Usuario: </td>' +
            '<td>' + (item.RegistroUsuario == null ? '' : item.RegistroUsuario) + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td class="blue">Fecha: </td>' +
            '<td>' + (item.RegistroFecha == null ? 'N/A' : moment(item.RegistroFecha).format("DD-MMMM-YYYY hh:mm a")) + '</td>' +
            '</tr>';

        _table += '</tbody></table>';

        if ($scope.elem)
            $scope.elem.popover("dispose");
        $scope.elem = $(_event.currentTarget).popover({
            container: 'body',
            html: true,
            placement: 'auto',
            sanitize: false,
            content: _table,
            boundary: 'viewport',
            trigger: 'manual',
            template: '<div class="popover" role="tooltip"><div class="arrow"></div><div class="popover-body"></div></div>'
        });
        $scope.elem.popover("show");
    };
}]);
function CerrarPopover(_this) {
    angular.element(_this).closest(".popover").remove();
};