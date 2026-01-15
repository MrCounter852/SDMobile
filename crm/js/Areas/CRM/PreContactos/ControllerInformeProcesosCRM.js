var ERP = angular.module("ERP", ['AxelSoft', 'cfp.hotkeys', 'DateTimePicker']);
ERP.directive('contextTrActive', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last === true) {
                angular.element("[context-tr-active]").click(function () {
                    $(this).addClass('tr-context-menu-active').siblings().removeClass("tr-context-menu-active");
                });
            }
        }
    };
});
ERP.controller("ControllerInformeProcesosComerciales", ['$scope', '$q', 'hotkeys', 'Services', function ($scope, $q, hotkeys, Services) {
    $scope.ProcesosCRM = [];
    $scope.EstadosGenerales = [{ ID: null, Nombre: "Todos" }, { ID: "V", Nombre: "A tiempo" }, { ID: "A", Nombre: "Proximo a vencer" }, { ID: "R", Nombre: "Vencido" }];

    hotkeys.add({
        combo: 'ctrl+b',
        description: 'Abre los filtros de la opción',
        callback: function () {
            $scope.AbrirModalFiltrar();
        }
    });

    $scope.search = {
        Rows: 100,
        Page: 1,
        OrigenPreContactoID: null,
        SucursalID: $scope.Usuario.SucursalID,
        PreContactoID: null,
        ProcesoID: null,
        NombreCompleto: null,
        ClienteNombreCompleto: null,
        Celular: null,
        Email: null,
        AsesorID: null,
        EstadoProcesoID: null,
        FechaInicial: null,
        FechaFinal: null,
        EstadoGeneral: null,
    };

    $scope.copySearch = angular.copy($scope.search);

    $scope.Init = function () {
        $scope.MostrarProgress(true);
        $scope.ConsultarCombos();
        Services.Async(
            $scope.serviceBaseCRM + "OrigenesPreContactosSucursales/OrigenesPreContactosSucursalesConsultar/",
            { SucursalID: $scope.Usuario.SucursalID, Token: $scope.Usuario.Token },
            function (response) {
                $scope.OrigenesPreContactos = angular.copy(response.rows);
                $scope.OrigenesPreContactos.unshift({ OrigenPreContactoID: null, Nombre: "Todos" });
                $scope.MostrarProgress(false);
                $scope.Consultar();
            }
        );
    };

    $scope.Consultar = function () {
        $scope.MostrarProgress(true);
        Services.Async(
            $scope.serviceBaseCRM + "PreContactos/InformeProcesosCRMConsultar/",
            $scope.search,
            function (response) {
                $scope.ProcesosCRM = response.rows;
                $scope.TablaFiltrada();
                $scope.MostrarProgress(false);
            }
        );
    };

    $scope.Anterior = function () {
        if ($scope.search.Page > 1) {
            $scope.search.Page--;
            $scope.Consultar();
        }
    };

    $scope.Siguiente = function () {
        if (($scope.search.Page * $scope.search.Rows) < $scope.ProcesosCRM[0].TotalRows) {
            $scope.search.Page++;
            $scope.Consultar();
        }
    };

    $scope.QuitarFiltros = function () {
        $scope.search = angular.copy($scope.copySearch);
        $scope.Consultar();
    };

    $scope.TablaFiltrada = function () {
        if (!angular.equals($scope.search, $scope.copySearch))
            $scope.Filtrado = true;
        else
            $scope.Filtrado = false;
    };

    $scope.AbrirModalFiltrar = function () {
        $("#modalFiltrar").modal("show");
    };

    $scope.CerrarModalFiltrar = function () {
        $("#modalFiltrar").modal("hide");
    };

    $scope.ConsultarCombos = function () {
        Services.Async(
            $scope.serviceBaseCRM + "PreContactos/EstadosProcesosConsultar/",
            { Token: $scope.Usuario.Token },
            function (response) {
                $scope.FilterEstadosProcesos = angular.copy(response.rows);
                $scope.FilterEstadosProcesos.unshift({ EstadoProcesoID: "1,4", Nombre: "Gestionando" });
                $scope.FilterEstadosProcesos.unshift({ EstadoProcesoID: null, Nombre: "Todos" });
            }
        );
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

    $scope.ExportarExcel = function () {
        $scope.MostrarProgress(true);
        let _search = angular.copy($scope.search);
        _search.Page = 0;
        _search.Rows = 0;
        Services.Async(
            $scope.serviceBaseCRM + "PreContactos/InformeProcesosCRMConsultar/",
            _search,
            function (response) {
                let _columns = [
                    { Titulo: "ProcesoID", ColumnName: "ProcesoID" },
                    { Titulo: "Fecha registro", ColumnName: "Fecha" },
                    { Titulo: "Fecha cierre", ColumnName: "FechaCierre" },
                    { Titulo: "Tipo contacto", ColumnName: "OrigenPreContactoNombre" },
                    { Titulo: "Estado actividades", ColumnName: "EstadoGeneral" },
                    { Titulo: "Ultima actividad", ColumnName: "UltimaFechaActividad" },
                    { Titulo: "Contacto", ColumnName: "NombreCompleto" },
                    { Titulo: "Telefono", ColumnName: "Telefono" },
                    { Titulo: "Celular", ColumnName: "Celular" },
                    { Titulo: "Email", ColumnName: "Email" },
                    { Titulo: "Dirección", ColumnName: "Direccion" },
                    { Titulo: "Cliente", ColumnName: "ClienteNombreCompleto" },
                    { Titulo: "Cliente celular", ColumnName: "ClienteCelular" },
                    { Titulo: "Observaciones", ColumnName: "Observaciones" },
                    { Titulo: "Forma contacto", ColumnName: "FormaContactoNombre" },
                    { Titulo: "Forma como nos conocieron", ColumnName: "FormaComoNosConocioDescripcion" },
                    { Titulo: "Detalle como nos conocio", ColumnName: "FormaComoNosConocioDetalleNombre" },
                    {
                        Titulo: "Estado proceso", ColumnName: function (elem) {
                            let _estado = elem.EstadoProcesoNombre;
                            if (elem.OrigenPrecontactoID == 2 && elem.EstadoProcesoID == 10)
                                _estado = "Captado";
                            else if (elem.OrigenPrecontactoID == 4 && elem.EstadoProcesoID == 10)
                                _estado = "Arrendado";
                            return _estado;
                        }
                    },
                    { Titulo: "Causal inviabilidad", ColumnName: "CausalInviabilidadNombre" },
                    { Titulo: "Fecha inviabilidad", ColumnName: "FechaInviabilidad" },
                    { Titulo: "Observaciones inviabilidad", ColumnName: "ObservacionesInviabilidad" },
                    { Titulo: "Valor negocio", ColumnName: "ValorNegocio" },
                    { Titulo: "Estado tiempo", ColumnName: "EstadoLineaTiempoNombre" },
                    { Titulo: "Asesor", ColumnName: "AsesorNombreCompleto" },
                ];
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
                XLSX.utils.book_append_sheet(wb, ws, "Procesos_comerciales");
                XLSX.writeFile(wb, "Informe_procesos_CRM.xlsx", { cellStyles: true });
                $scope.MostrarProgress(false);
            }
        );
    };
}]);
