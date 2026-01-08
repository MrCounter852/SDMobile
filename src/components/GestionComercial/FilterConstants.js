export const FILTER_OPTIONS = {
  estados: [
    { ID: null, Nombre: "Todos" },
    { ID: "1,4", Nombre: "Vigentes" },
    { ID: "2", Nombre: "Finalizados" },
    { ID: "3", Nombre: "Inviables" },
  ],
  estadosGenerales: [
    { ID: null, Nombre: "Todos" },
    { ID: "V", Nombre: "Vigentes" },
    { ID: "A", Nombre: "Próximas a vencer" },
    { ID: "R", Nombre: "Vencidas" },
  ],
  estadosActividades: [
    { ID: null, Nombre: "Todas" },
    { ID: "1", Nombre: "Finalizadas" },
    { ID: "2", Nombre: "Vigentes" },
    { ID: "3", Nombre: "Vencidas" },
    { ID: "4", Nombre: "Pendientes o próximas" },
    { ID: "3,4", Nombre: "Vencidas y Pendientes" },
  ],
};
