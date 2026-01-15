ERP.controller("ControllerInventario", ['$scope', '$timeout', 'Services', 'alertify', '$window', function ($scope, $timeout, Services, alertify, $window) {
    $scope.LocalConfigInmuebles = "Config_Inmuebles_" + $scope.Usuario.EmpresaID + "_" + $scope.Usuario.UsuarioID;
    $scope.ConfigInmueble = {
        ValorAdministracion: false,
        Barrio: false,
        Zona: false,
        Estrato: false,
        MetroCuadrado: false,
        FincaRaiz: false,
        MercadoLibre: false,
        LaHaus: false,
        ZonaHabitat: false,
        CienCuadras: false,
        Idonde: false,
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
        Fotos: false
    };  

    $scope.DetailInventario = {
        title: "Informacion del inventario",
        classIconTitle: "fad fa-box-open",
        classController: "Crm-Inventario",
        OnDragged: function (heigth) {
            angular.element(".table-inventario").css("max-height", (heigth - 85) + "px");
        },
        Token: $scope.Usuario.Token
    };

    $scope.InitInventario = function () {
        Services.Async(
            $scope.serviceBaseGBI + "TiposInmuebles/TiposInmueblesConsultar",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token },
            function (response) {
                response.rows.unshift({ TipoInmuebleID: null, Nombre: "Todos" });
                $scope.TiposInmuebles = response.rows;
            }
        );
    };

    $scope.searchInventario = {
        Page: 1,
        Rows: 30,
        TipoPreContactoID: -1,
        SucursalID: $scope.Usuario.SucursalID,
        Token: $scope.Usuario.Token
    };

    $scope.copySearchInventario = angular.copy($scope.searchInventario);

    $scope.AbrirInventario = function (elem) {
        $scope.searchInventario = angular.copy($scope.copySearchInventario);
        if (elem) {
            if (elem.OrigenPreContactoID)
                $scope.searchInventario.OrigenPreContactoID = elem.OrigenPreContactoID;
            else
                $scope.searchInventario.OrigenPreContactoID = -1;
        } else
            $scope.searchInventario.OrigenPreContactoID = -1;
        if ($scope.searchInventario.OrigenPreContactoID == 4 || $scope.searchInventario.OrigenPreContactoID == 5) {
            let _item = $scope.GetLocalStorage($scope.LocalConfigInmuebles);
            if (_item)
                $scope.ConfigInmueble = angular.copy(_item);
            $scope.searchInventario.TipoInmuebleID = null;
        }        
        $scope.searchInventario.Page = 1;
        $scope.ConsultarInventario(function () {
            $scope.DetailInventario.Open(0.6);
        });
    };

    $scope.CerrarInventario = function () {
        $scope.DetailInventario.Close();
    };

    $scope.ConsultarInventario = function (OnSuccess) {
        $scope.MostrarProgress(true);
        if ($scope.searchInventario.OrigenPreContactoID == 1 || $scope.searchInventario.OrigenPreContactoID == 6) {
            $scope.DetailInventario.title = "Bodegas disponibles y reservadas";
            $scope.DetailInventario.classIconTitle = "fad fa-box-open";
            Services.Async(
                $scope.serviceBaseSTRG + "Bodegas/BodegasLibresConsultar/",
                $scope.searchInventario,
                function (response) {
                    $scope.BodegasDisponibles = response.rows;
                    if (OnSuccess)
                        OnSuccess();
                    $scope.MostrarProgress(false);
                }
            );
        } else if($scope.searchInventario.OrigenPreContactoID == 4) {
            $scope.DetailInventario.title = "Arriendos disponibles";
            $scope.DetailInventario.classIconTitle = "fal fa-hotel";
            let _filtros = angular.copy($scope.searchInventario);
            _filtros.TipoOfertaID = 1;
            _filtros.EstadoInmuebleID = 1;
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
        } else if ($scope.searchInventario.OrigenPreContactoID == 5) {
            $scope.DetailInventario.title = "Ventas de inmuebles disponibles";
            $scope.DetailInventario.classIconTitle = "fal fa-home-lg";
            let _filtros = angular.copy($scope.searchInventario);
            _filtros.TipoOfertaID = 2;
            _filtros.EstadoInmuebleID = 1;
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
        } else {
            alertify.error("No hay configurado un inventario");
            $scope.MostrarProgress(false);
        }
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

    $scope.GlobalSearchInventario = function () {
        if ($scope.TimeOutFilter)
            $timeout.cancel($scope.TimeOutFilter);
        $scope.TimeOutFilter = $timeout(function () {
            $scope.searchInventario.Page = 1;
            $scope.ConsultarInventario();
        }, 2000);
    };

    $scope.AbrirPanel = function (event) {
        let elem = angular.element(event.currentTarget).closest(".opciones-bottom");
        if (elem.hasClass("opened")) 
            elem.removeClass("opened").addClass("closed");            
         else 
            elem.removeClass("closed").addClass("opened");        
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
}]);