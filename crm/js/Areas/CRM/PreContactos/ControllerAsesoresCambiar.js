var ERP = angular.module("ERP", ['AxelSoft', 'FileViewer']);
ERP.controller("ControllerAsesoresCambiar", ['$scope', '$filter', 'Services', 'alertify', '$q', '$timeout', function ($scope, $filter, Services, alertify, $q, $timeout) {
    $scope.Procesos = [];
    $scope.Estados = [{ ID: null, Nombre: "Todos" }, { ID: true, Nombre: "Activos" }, { ID: false, Nombre: "Inactivos" }];
    $scope.Search = {
        OrigenPreContactoID: null,
        OrigenAsesorID: null,
        DestinoAsesorID: null,
        EstadoProcesoID: "1,4",
        SeleccionarTodos: false,
        AsesoresActivos: true,
        FullSearch: null        
    };

    $scope.viewer = {
        CDNEndPoint: $scope.Usuario.CDNEndPoint,
        CDNLlavePublica: $scope.Usuario.CDNLlavePublica,
        Token: $scope.Usuario.Token
    };

    $scope.copySearch = angular.copy($scope.Search);

    $scope.searchAsesoresOrigen = function (term, modelID) {
        let deferred = $q.defer();
        Services.Async(
            $scope.serviceBaseCRM + "Asesores/AsesoresConsultar/",
            { Rows: 20, Page: 1, Activo: $scope.Search.AsesoresActivos, AsesorID: modelID, SucursalID: modelID ? null : $scope.Usuario.SucursalID, Token: $scope.Usuario.Token, NombreCompleto: term },
            function (response) {
                if (!modelID) {
                    response.rows.unshift({ AsesorID: -1, NombreCompleto: "Sin asesor" });
                    response.rows.unshift({ AsesorID: null, NombreCompleto: "Todos" });
                }
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

    $scope.Init = function () {
        if ($scope.QueryString.ProcesoID != undefined && isNaN(parseInt($scope.QueryString.ProcesoID)) == false) {
            $scope.Search.ProcesoID = $scope.QueryString.ProcesoID;
            $scope.Search.EstadoProcesoID = null;
            $scope.BuscarProcesosComerciales();
        }

        $scope.CombosConsultar();
    };

    $scope.GlobalSearch = function () {
        if ($scope.TimeOutFilter)
            $timeout.cancel($scope.TimeOutFilter);
        $scope.TimeOutFilter = $timeout(function () {
            $scope.BuscarProcesosComerciales();
        }, 1000);
    };

    $scope.CombosConsultar = function () {
        Services.Async(
            $scope.serviceBaseCRM + "PreContactos/EstadosProcesosConsultar/",
            { Token: $scope.Usuario.Token },
            function (response) {                
                $scope.EstadosProcesos = response.rows;
                $scope.EstadosProcesos.unshift({ EstadoProcesoID: "1,4", Nombre: "Nuevo y En gestión" });
                $scope.EstadosProcesos.unshift({ EstadoProcesoID: null, Nombre: "Todos" });                
            }
        );
        Services.Async(
            $scope.serviceBaseCRM + "OrigenesPreContactosSucursales/OrigenesPreContactosSucursalesConsultar/",
            { SucursalID: $scope.Usuario.SucursalID, Token: $scope.Usuario.Token },
            function (response) {                
                $scope.OrigenesPreContactos = angular.copy(response.rows);
                $scope.OrigenesPreContactos.unshift({ OrigenPreContactoID: null, Nombre: "Todos" });                
            }
        );
    };

    $scope.BuscarProcesosComerciales = function () {
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseCRM + "PreContactos/AsesoresProcesosConsultar",
            $scope.Search,
            function (response) {
                $scope.Procesos = response.rows;
                $scope.MostrarProgress(false);
            }
        );
    };

    $scope.GuardarCambios = function () {
        if ($scope.Search.DestinoAsesorID == undefined || $scope.Search.DestinoAsesorID == null) {
            alertify.error("El nuevo asesor es requerido");
            return;
        }
        let _cambiar = angular.copy($scope.Search);
        _cambiar.Procesos = $filter("filter")($scope.Procesos, function (elem) { return elem.Seleccionar == true }, true);
        if (_cambiar.Procesos.length == 0) {
            alertify.error("Debe seleccionar al menos 1 proceso comercial");
            return;
        }
        alertify.confirm("¿Desea asignar los procesos comerciales al nuevo asesor?", function () {
            $scope.MostrarProgress(true);
            Services.Async(
                $scope.serviceBaseCRM + "PreContactos/CambiarAsesorProcesos/",
                _cambiar,
                function (response) {
                    $scope.Search.SeleccionarTodos = false;
                    alertify.success(response.rows[0].Descripcion);
                    $scope.MostrarProgress(false);
                    $scope.BuscarProcesosComerciales();
                }
            );
        });
    };

    $scope.ChangeSeleccionar = function () {
        angular.forEach($scope.Procesos, function (elem) {
            elem.Seleccionar = $scope.Search.SeleccionarTodos;
        });
    };
}]);