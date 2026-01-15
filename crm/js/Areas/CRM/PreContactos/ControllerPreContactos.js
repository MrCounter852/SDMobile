var ERP = angular.module("ERP", ['ngTable', 'AxelSoft', 'DateTimePicker', 'SelectTreeAR', 'ui.utils.masks', 'daterangepicker', 'cfp.hotkeys']);
ERP.controller("ControllerPreContactos", ['$scope', '$filter', '$q', 'NgTableParams', 'hotkeys', function ($scope, $filter, $q, NgTableParams, hotkeys) {
    $scope.tablePreContactos = new NgTableParams({}, { dataset: [] });
    $scope.formasComoNosConocioDetalles = [{ FormaComoNosConocioDetalleID: null, Nombre: "-- N/A --" }];
    hotkeys.add({
        combo: 'ctrl+b',
        description: 'Abre los filtros de la opción',
        callback: function () {
            $scope.AbrirModalFiltrar();
        }
    });

    hotkeys.add({
        combo: 'ctrl+alt+n',
        description: 'Permite crear un nuevo documento contable.',
        callback: function (event, hotkey) {
            $scope.AbrirModalAgregar();
        }
    });

    $scope.search = {
        Rows: "100",
        Token: $scope.Usuario.Token,
        Filtrado: false
    };
    $scope.copySearch = angular.copy($scope.search);

    $scope.Init = function () {
        $scope.Consultar();
        $scope.formasComoNosConocio();
    }

    $scope.Consultar = function () {
        $scope.MostrarProgress(true);
        new async(
            $scope.serviceBaseCRM + "PreContactos/PreContactosConsultar/",
            $scope.search,
            function (response) {
                $scope.PreContactos = response.rows;
                $scope.tablePreContactos.settings({
                    dataset: response.rows,
                    counts: [10, 50, 100, (response.rows.length > 100) ? response.rows.length : 150]
                });
                $scope.Filtrado();
                $scope.formasContacto();

                $scope.$apply();
                $scope.MostrarProgress(false);
                $scope.CerrarModalFiltrar();
            }
        );
    }

    $("#Fecha").datetimepicker({
        locale: 'es',
        format: 'DD/MM/YYYY',
    });

    $scope.QuitarFiltros = function () {
        $scope.search = angular.copy($scope.copySearch);
        $scope.date = {
            startDate: moment().subtract(29, 'days'),
            endDate: moment()
        };
        $scope.Consultar();
    }

    $scope.Filtrado = function () {
        if (!angular.equals($scope.search, $scope.copySearch))
            $scope.search.Filtrado = true;
    }

    $scope.AbrirModalFiltrar = function () {
        $("#modalFiltrar").modal("show");
    }

    $scope.CerrarModalFiltrar = function () {
        $("#modalFiltrar").modal("hide");
    }


    $scope.seleccionarFila = function (item) {
        if ($scope.PreContacto == null || $scope.PreContacto != item) {
            $scope.PreContacto = item;
            $scope.isEdicion = true;
            $scope.cambiarFormaComoNosConocioCRM(true);
        } else {
            $scope.PreContacto = null;
            $scope.isEdicion = false;
        }
    }


    $scope.AbrirModalAgregar = function (item) {
        $scope.tipo = "Registro de precontactos";
        $scope.classModal = "fa fa-plus";
        fecha = $filter('date')(Date(), "dd/MM/yyyy");
        $('#Fecha').data("DateTimePicker").date(fecha);
        $scope.PreContacto = {
            DirIP: $scope.Usuario.Ip,
            Usuario: $scope.Usuario.UsuarioID,
            UsuarioID: $scope.Usuario.UsuarioID,
            PreContatoID: null,
            Token: $scope.Usuario.Token,
            FormaComoNosConocioDetalleID: null,
            FormaContactoID: null,
            FormaComoNosConocioID: null,
            SucursalID: $scope.Usuario.SucursalID,
        };
        $scope.button = true;
        $("#modalAgregar").modal("show");
    }


    $scope.AbrirModalEditar = function () {
        fecha = $filter('date')($scope.PreContacto.Fecha, "dd/MM/yyyy");
        $('#Fecha').data("DateTimePicker").date(fecha);
        $scope.tipo = "Edición de precontacto " + $scope.PreContacto.Nombres + " " + $scope.PreContacto.Apellidos;
        $scope.isEdicion = true;
        $scope.button = false;
        $("#modalAgregar").modal("show");
    }

    $scope.CerrarModalEditar = function () {
        $("#modalEditarDocumento").modal("hide");
    }

    $scope.Insertar = function () {
        if ($scope.ValidarObligatorios()) {
            alertify.confirm("Desea registrar el precontacto " + $scope.PreContacto.Nombres + " " + $scope.PreContacto.Apellidos, function () {
                new async(
                    $scope.serviceBaseCRM + "PreContactos/PreContactosInsertar/",
                    $scope.PreContacto,
                    function (response) {
                        alertify.success(response.rows[0].Descripcion);
                        $scope.$apply();
                        $scope.Consultar()
                        $("#modalAgregar").modal("hide");
                    });

            }).set('title', 'Confirmación');
        }
    }
    $scope.Actualizar = function () {
        if ($scope.ValidarObligatorios()) {
            $scope.PreContacto.Token = $scope.Usuario.Token;
            $scope.PreContacto.Usuario = $scope.Usuario.UsuarioID;
            $scope.PreContacto.DirIP = $scope.Usuario.DirIp;

            alertify.confirm("Desea Actualizar el precontacto " + $scope.PreContacto.Nombres + " " + $scope.PreContacto.Apellidos, function () {
                new async(
                    $scope.serviceBaseCRM + "PreContactos/PreContactosActualizar/",
                    $scope.PreContacto,
                    function (response) {
                        alertify.success(response.rows[0].Descripcion);
                        $scope.$apply();
                        $scope.Consultar()
                        $("#modalAgregar").modal("hide");
                    });

            }).set('title', 'Confirmación');
        }
    }

    $scope.Eliminar = function () {
        $scope.PreContacto.Token = $scope.Usuario.Token;
        $scope.PreContacto.Usuario = $scope.Usuario.UsuarioID;
        $scope.PreContacto.DirIP = $scope.Usuario.DirIp;
        alertify.confirm("Desea eliminar el precontacto " + $scope.PreContacto.Nombres + " " + $scope.PreContacto.Apellidos, function () {
            new async(
                $scope.serviceBaseCRM + "PreContactos/PreContactosEliminar/",
                $scope.PreContacto,
                function (response) {
                    alertify.success(response.rows[0].Descripcion);
                    $scope.$apply();
                    $scope.Consultar()
                });

        }).set('title', 'Confirmación');
    }

    $scope.searchAsesores = function (term) {
        var deferred = $q.defer();
        if (!term) {
            term = "_";
        }
        new async(
            $scope.serviceBaseCRM + "JerarquiasAsesores/JerarquiasAsesoresConsultar/",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token, AsesorNombreCompleto: term },
            function (response) {
                deferred.resolve(response.rows);
            }
        );
        return deferred.promise;
    }


    $scope.ddlSearchAsesores = {
        iconLeaf: "fa fa-map-marker",
        iconExpand: "fa fa-plus",
        iconCollapse: "fa fa-minus",
        fieldChildren: "__children__",
        expanded: "__expanded__",
        orderByField: "Nombre",
        orderByReverse: false,
        async: true
    }

    $scope.cambiarFormaComoNosConocioCRM = function (edit) {
        if ($scope.PreContacto.FormaComoNosConocioID != null) {
            new async(
                $scope.serviceBaseCRM + "FormasComoNosConocioDetalles/FormasComoNosConocioDetallesConsultar/",
                { Rows: 0, Page: 0, Token: $scope.Usuario.Token, FormaComoNosConocioID: $scope.PreContacto.FormaComoNosConocioID },
                function (response) {
                    $scope.formasComoNosConocioDetalles = response.rows;
                    $scope.formasComoNosConocioDetalles.unshift({ FormaComoNosConocioDetalleID: null, Nombre: "-- N/A --" });
                    if (!edit)
                        $scope.PreContacto.FormaComoNosConocioDetalleID = null;
                    $scope.$apply();
                });
        } else {
            $scope.formasComoNosConocioDetalles = [{ FormaComoNosConocioDetalleID: null, Nombre: "-- N/A --" }];
            $scope.PreContacto.FormaComoNosConocioDetalleID = null;
        }
    }

    $scope.formasComoNosConocio = function () {
        new async(
            $scope.serviceBaseCRM + "FormasComoNosConocio/FormasComoNosConocioConsultar/",
            { Rows: 0, Page: 0, Activo: true, Token: $scope.Usuario.Token },
            function (response) {
                $scope.formasComoNosConocio = response.rows;
                $scope.formasComoNosConocio.unshift({ FormaComoNosConocioID: null, Descripcion: "-- Seleccione --" });
                $scope.$apply();
            });
    }

    $scope.formasContacto = function () {
        new async(
            $scope.serviceBaseCRM + "FormasFormasContactos/FormasContactosConsultar/",
            { Rows: 0, Page: 0, Token: $scope.Usuario.Token, Activo: true },
            function (response) {
                $scope.formasFormasContactos = response.rows;
                $scope.formasFormasContactos.unshift({ FormaContactoID: null, Nombre: "-- Seleccione --" });
                $scope.$apply();
            });
    }

    $scope.ValidarObligatorios = function () {
        if ($scope.PreContacto.AsesorID == null || $scope.PreContacto.AsesorID == undefined) {
            alertify.error("Debe seleccionar el asesor");
            return false;
        }
        if ($scope.PreContacto.FormaComoNosConocioID == null || $scope.PreContacto.FormaComoNosConocioID == undefined) {
            alertify.error("La forma como nos conocio es necesaria");
            return false;
        }
        if ($scope.PreContacto.FormaContactoID == null || $scope.PreContacto.FormaContactoID == undefined) {
            alertify.error("La forma de contacto es necesaria");
            return false;
        }
        if ($scope.PreContacto.Viable == null || $scope.PreContacto.Viable == undefined) {
            $scope.PreContacto.Viable = false;
        }
        return true
    }
}]);
