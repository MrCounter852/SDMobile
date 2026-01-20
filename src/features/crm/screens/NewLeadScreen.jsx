import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useGlobal } from "../../../core/global";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
// Usamos require().default para asegurar la compatibilidad con el sistema de exportación
const GestionComercialService = require("../services/leadService").default;
import PropertySelectionModal from "../../../components/PropertySelectionModal";

import {
  COLORS,
  CustomInput,
  SectionHeader,
} from "../components/FormComponents";
import GeneralInfoSection from "../components/NewLead/GeneralInfoSection";
import SearchDataSection from "../components/NewLead/SearchDataSection";
import ClientDetailSection from "../components/NewLead/ClientDetailSection";

const DETAIL_LABELS = {
  2: { label: "propietario", title: "Propietario" },
  4: { label: "arrendatario", title: "Arrendatario" },
  5: { label: "comprador", title: "Comprador" },
};

const NewLeadScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { contact, preContacto } = route.params || {};
  const { user } = useGlobal();

  const [origenes, setOrigenes] = useState([]);
  const [asesores, setAsesores] = useState([]);
  const [asesoresLoaded, setAsesoresLoaded] = useState(false);
  const [formasContacto, setFormasContacto] = useState([]);
  const [formasContactoLoaded, setFormasContactoLoaded] = useState(false);
  const [formasConocio, setFormasConocio] = useState([]);
  const [formasConocioLoaded, setFormasConocioLoaded] = useState(false);
  const [formasConocioDetalle, setFormasConocioDetalle] = useState([]);
  const [inmueblesDisponibles, setInmueblesDisponibles] = useState([]);
  const [tiposOferta, setTiposOferta] = useState([]);
  const [tiposOfertaLoaded, setTiposOfertaLoaded] = useState(false);
  const [condicionesInmueble, setCondicionesInmueble] = useState([]);
  const [condicionesLoaded, setCondicionesLoaded] = useState(false);
  const [tiposInmueble, setTiposInmueble] = useState([]);
  const [tiposInmuebleLoaded, setTiposInmuebleLoaded] = useState(false);
  const [antiguedades, setAntiguedades] = useState([]);
  const [antiguedadesLoaded, setAntiguedadesLoaded] = useState(false);
  const [localidades, setLocalidades] = useState([]);

  const mainFormRef = useRef(null);
  const fiscalFormRef = useRef(null);
  const [tiposAvaluo, setTiposAvaluo] = useState([]);
  const [tiposAvaluoLoaded, setTiposAvaluoLoaded] = useState(false);
  const [ciudades, setCiudades] = useState([]);
  const [ciudadesLoaded, setCiudadesLoaded] = useState(false);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [tiposDocumentoLoaded, setTiposDocumentoLoaded] = useState(false);
  const [tiposPersona, setTiposPersona] = useState([]);
  const [tiposPersonaLoaded, setTiposPersonaLoaded] = useState(false);
  const [responsabilidades, setResponsabilidades] = useState([]);
  const [responsabilidadesLoaded, setResponsabilidadesLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formConfig, setFormConfig] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [staticErrors, setStaticErrors] = useState({});

  const [form, setForm] = useState({
    OrigenPreContactoID: preContacto?.OrigenPreContactoID || 4, // Default to Arrendatarios
    OrigenPreContactoNombre: preContacto?.OrigenPreContactoNombre || "",
    Nombres: preContacto?.Nombres || "",
    Apellidos: preContacto?.Apellidos || "",
    Celular: preContacto?.Celular || contact?.Telefono || "",
    Email: preContacto?.Email || "",

    // Conditional Fields
    FormaContactoID: preContacto?.FormaContactoID || "",
    FormaContactoNombre: preContacto?.FormaContactoNombre || "",
    FormaComoNosConocioID: preContacto?.FormaComoNosConocioID || "",
    FormaComoNosConocioNombre: preContacto?.FormaComoNosConocioNombre || "",
    FormaComoNosConocioDetalleID:
      preContacto?.FormaComoNosConocioDetalleID || "",
    FormaComoNosConocioDetalleNombre:
      preContacto?.FormaComoNosConocioDetalleNombre || "",
    PalabraBusqueda: preContacto?.PalabraBusqueda || "",

    AsesorID: preContacto?.AsesorID || user?.AsesorID || "",
    AsesorNombreCompleto:
      preContacto?.AsesorNombreCompleto || user?.NombreCompleto || "",
    Telefono: preContacto?.Telefono || "",

    InmuebleID: preContacto?.InmuebleID || "",
    InmuebleNombre:
      preContacto?.InmuebleDescripcion || preContacto?.InmuebleDireccion || "",
    TipoOfertaID: preContacto?.TipoOfertaID || "",
    TipoOfertaNombre: preContacto?.TipoOfertaNombre || "",
    CondicionInmuebleID: preContacto?.CondicionInmuebleID || "",
    CondicionInmuebleNombre: preContacto?.CondicionInmuebleNombre || "",
    TipoInmuebleID: preContacto?.TipoInmuebleID || "",
    TipoInmuebleNombre: preContacto?.TipoInmuebleNombre || "",
    AntiguedadInmuebleID: preContacto?.AntiguedadInmuebleID || "",
    AntiguedadInmuebleNombre: preContacto?.AntiguedadInmuebleNombre || "",
    TipoAvaluoID: preContacto?.TipoAvaluoID || "",
    TipoAvaluoNombre: preContacto?.TipoAvaluoNombre || "",
    CiudadID: preContacto?.CiudadID || "",
    CiudadNombre: preContacto?.CiudadNombre || "",
    Direccion: preContacto?.Direccion || "",
    LocalidadID: preContacto?.LocalidadID || "",
    LocalidadNombre: preContacto?.LocalidadNombre || "",
    Area: preContacto?.Area || "",
    InmuebleDireccion: preContacto?.InmuebleDireccion || "",

    AreaDesde: preContacto?.AreaDesde || "",
    AreaHasta: preContacto?.AreaHasta || "",
    Cantidadhabitaciones: preContacto?.Cantidadhabitaciones || "",
    CantidadGarajes: preContacto?.CantidadGarajes || "",
    PresupuestoDesde: preContacto?.PresupuestoDesde || "",
    PresupuestoHasta: preContacto?.PresupuestoHasta || "",
    CantidadBanos: preContacto?.CantidadBanos || "",
    InteresesUbicacion: preContacto?.InteresesUbicacion || "",

    // Checkboxes for Estrato
    Estrato1: preContacto?.Estrato1 || false,
    Estrato2: preContacto?.Estrato2 || false,
    Estrato3: preContacto?.Estrato3 || false,
    Estrato4: preContacto?.Estrato4 || false,
    Estrato5: preContacto?.Estrato5 || false,
    Estrato6: preContacto?.Estrato6 || false,

    DescripcionAdicional: preContacto?.DescripcionAdicional || "",
    Observaciones: preContacto?.Observaciones || "",
    DetallarCliente: preContacto?.DetallarCliente || false,

    // Detailed Client Info...
    ClienteTipoDocumentoID: preContacto?.ClienteTipoDocumentoID || "",
    ClienteDocumento: preContacto?.ClienteDocumento || "",
    ClienteNombres: preContacto?.ClienteNombres || "",
    ClienteNombres2: preContacto?.ClienteNombres2 || "",
    ClienteApellidos: preContacto?.ClienteApellidos || "",
    ClienteApellidos2: preContacto?.ClienteApellidos2 || "",
    ClienteDireccion: preContacto?.ClienteDireccion || "",
    ClienteTelefono: preContacto?.ClienteTelefono || "",
    ClienteCelular: preContacto?.ClienteCelular || "",
    ClienteEmail: preContacto?.ClienteEmail || "",
    ClienteEmailFacturacionElectronica:
      preContacto?.ClienteEmailFacturacionElectronica || "",
    ClienteTipoPersonaID: preContacto?.ClienteTipoPersonaID || "",
    ClienteResponsabilidadTributariaID:
      preContacto?.ClienteResponsabilidadTributariaID || "",
    ClienteNombreRazonSocial: preContacto?.ClienteNombreRazonSocial || "",
  });

  const [selectedLocalidades, setSelectedLocalidades] = useState({});
  const [showInmuebleModal, setShowInmuebleModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingInmuebles, setLoadingInmuebles] = useState(false);
  const [lastLoadedOrigenId, setLastLoadedOrigenId] = useState(null);
  const [servicio, setServicio] = useState({ TipoProductoID: "", Nombre: "" });
  const [procesosServiciosIniciales, setProcesosServiciosIniciales] = useState(
    preContacto?.ProcesosServiciosIniciales || [],
  );
  const [tiposProductos, setTiposProductos] = useState([]);
  const [tiposProductosLoaded, setTiposProductosLoaded] = useState(false);

  const loadFormConfig = useCallback(async (origenId) => {
    if (!origenId) return;
    setLoadingConfig(true);
    try {
      const data =
        await GestionComercialService.consultarCombosOrigenes(origenId);
      setFormConfig(data || []);
    } catch (error) {
      console.error("NewLeadScreen:loadFormConfig", error);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    if (form.OrigenPreContactoID) {
      loadFormConfig(form.OrigenPreContactoID);
    } else {
      setFormConfig([]);
    }
  }, [form.OrigenPreContactoID, loadFormConfig]);

  const detailLabel = useMemo(() => {
    const current = DETAIL_LABELS[form.OrigenPreContactoID];
    return current ? current.label : "cliente o empresa";
  }, [form.OrigenPreContactoID]);

  const detailTitle = useMemo(() => {
    const current = DETAIL_LABELS[form.OrigenPreContactoID];
    return current ? current.title : "Cliente o empresa";
  }, [form.OrigenPreContactoID]);

  const isEmpresa = useMemo(() => {
    const tipo = tiposPersona.find(
      (t) =>
        t?.TipoPersonaID === form.ClienteTipoPersonaID ||
        t?.id === form.ClienteTipoPersonaID,
    );
    return tipo?.Empresa || tipo?.esEmpresa || false;
  }, [form.ClienteTipoPersonaID, tiposPersona]);

  const isEditing = preContacto?.ProcesoID != null;

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text style={{ color: "#337ab7", fontSize: 18, fontWeight: "bold" }}>
          {isEditing ? "Editar Contacto" : "Nuevo Contacto"}
        </Text>
      ),
      headerLeft: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#337ab7" />
        </TouchableOpacity>
      ),
      headerRight: () => null,
    });
  }, [navigation, isEditing]);

  const handleTipoPersonaChange = (value) => {
    setForm((prev) => {
      const updated = { ...prev, ClienteTipoPersonaID: value };
      const tipo = tiposPersona.find(
        (t) => t?.TipoPersonaID === value || t?.id === value,
      );
      if (tipo?.Empresa || tipo?.esEmpresa) {
        updated.ClienteNombres2 = "";
        updated.ClienteApellidos = "";
        updated.ClienteApellidos2 = "";
      }
      return updated;
    });
    // Limpiar campos no correspondientes (mantenemos lógica de Sedi)
    setForm((prev) => ({
      ...prev,
      ClienteTipoPersonaID: value,
      ...(value == 2
        ? { ClienteNombres: "", ClienteApellidos: "" }
        : { ClienteNombreRazonSocial: "" }),
    }));
  };

  useEffect(() => {
    if (preContacto?.ProcesosInmobiliariaLocalidades?.length) {
      const mapped = {};
      preContacto.ProcesosInmobiliariaLocalidades.forEach((loc) => {
        if (!loc?.Eliminar && loc?.LocalidadID != null) {
          mapped[loc.LocalidadID] = true;
        }
      });
      setSelectedLocalidades(mapped);
    }
  }, [preContacto]);

  useEffect(() => {
    if (showInmuebleModal && form.OrigenPreContactoID) {
      loadInmuebles(form.OrigenPreContactoID, searchTerm);
    }
  }, [showInmuebleModal, form.OrigenPreContactoID, searchTerm, loadInmuebles]);

  useEffect(() => {
    if (showInmuebleModal) {
      setSearchTerm("");
    }
  }, [showInmuebleModal]);

  const loadOrigenes = useCallback(async () => {
    // Origenes are already loaded at startup, just return them
    return origenes;
  }, [origenes]);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const [origenesResp, localidadesResp] = await Promise.all([
        GestionComercialService.consultarOrigenesPreContactos(),
        GestionComercialService.consultarLocalidades(),
        loadTiposPersona(),
      ]);

      setOrigenes(origenesResp || []);
      setLocalidades(localidadesResp || []);

      if (!preContacto?.OrigenPreContactoID) {
        const defaultOrigen = (origenesResp || [])[0]?.OrigenPreContactoID;
        if (defaultOrigen) {
          setForm((prev) => ({
            ...prev,
            OrigenPreContactoID: prev.OrigenPreContactoID || defaultOrigen,
          }));
        }
      }
    } catch (error) {
      console.error("NewLeadScreen:loadInitialData", error);
      setErrorMessage(
        "No pudimos cargar la información inicial. Intenta nuevamente.",
      );
    } finally {
      setLoading(false);
    }
  }, [preContacto]);

  const onSearchAsesores = useCallback(
    async (text) => {
      try {
        const response = await GestionComercialService.consultarAsesores({
          NombreCompleto: text,
          Rows: 20,
          SucursalID: user?.SucursalID,
        });
        return response || [];
      } catch (error) {
        console.error("NewLeadScreen:onSearchAsesores", error);
        return [];
      }
    },
    [user?.SucursalID],
  );

  const loadAsesores = useCallback(async () => {
    if (asesoresLoaded) return asesores;
    try {
      const response = await onSearchAsesores("");
      setAsesores(response || []);
      setAsesoresLoaded(true);
      return response || [];
    } catch (error) {
      return [];
    }
  }, [asesoresLoaded, onSearchAsesores]);

  const loadFormasContacto = useCallback(async () => {
    if (formasContactoLoaded) return formasContacto;
    try {
      const response = await GestionComercialService.consultarFormasContacto();
      setFormasContacto(response || []);
      setFormasContactoLoaded(true);
      return response || [];
    } catch (error) {
      console.error("NewLeadScreen:loadFormasContacto", error);
      return [];
    }
  }, [formasContactoLoaded]);

  const loadFormasConocio = useCallback(async () => {
    if (formasConocioLoaded) return formasConocio;
    try {
      const response =
        await GestionComercialService.consultarFormasComoNosConocio();
      setFormasConocio(response || []);
      setFormasConocioLoaded(true);
      return response || [];
    } catch (error) {
      console.error("NewLeadScreen:loadFormasConocio", error);
      return [];
    }
  }, [formasConocioLoaded]);

  const loadTiposOferta = useCallback(async () => {
    if (tiposOfertaLoaded) return tiposOferta;
    try {
      const response = await GestionComercialService.consultarTiposOfertas();
      setTiposOferta(response || []);
      setTiposOfertaLoaded(true);
      return response || [];
    } catch (error) {
      console.error("NewLeadScreen:loadTiposOferta", error);
      return [];
    }
  }, [tiposOfertaLoaded]);

  const loadCondicionesInmueble = useCallback(async () => {
    if (condicionesLoaded) return condicionesInmueble;
    try {
      const response =
        await GestionComercialService.consultarCondicionesInmueble();
      setCondicionesInmueble(response || []);
      setCondicionesLoaded(true);
      return response || [];
    } catch (error) {
      console.error("NewLeadScreen:loadCondicionesInmueble", error);
      return [];
    }
  }, [condicionesLoaded]);

  const loadTiposInmueble = useCallback(async () => {
    if (tiposInmuebleLoaded) return tiposInmueble;
    try {
      const response = await GestionComercialService.consultarTiposInmueble();
      setTiposInmueble(response || []);
      setTiposInmuebleLoaded(true);
      return response || [];
    } catch (error) {
      console.error("NewLeadScreen:loadTiposInmueble", error);
      return [];
    }
  }, [tiposInmuebleLoaded]);

  const loadAntiguedades = useCallback(async () => {
    if (antiguedadesLoaded) return antiguedades;
    try {
      const response =
        await GestionComercialService.consultarAntiguedadesInmueble();
      setAntiguedades(response || []);
      setAntiguedadesLoaded(true);
      return response || [];
    } catch (error) {
      console.error("NewLeadScreen:loadAntiguedades", error);
      return [];
    }
  }, [antiguedadesLoaded]);

  const loadTiposAvaluo = useCallback(async () => {
    if (tiposAvaluoLoaded) return tiposAvaluo;
    try {
      const response = await GestionComercialService.consultarTiposAvaluos();
      setTiposAvaluo(response || []);
      setTiposAvaluoLoaded(true);
      return response || [];
    } catch (error) {
      console.error("NewLeadScreen:loadTiposAvaluo", error);
      return [];
    }
  }, [tiposAvaluoLoaded]);

  const loadCiudades = useCallback(async () => {
    if (ciudadesLoaded) return ciudades;
    try {
      const response = await GestionComercialService.consultarCiudades();
      setCiudades(response || []);
      setCiudadesLoaded(true);
      return response || [];
    } catch (error) {
      console.error("NewLeadScreen:loadCiudades", error);
      return [];
    }
  }, [ciudadesLoaded]);

  const loadLocalidades = useCallback(async () => {
    // Localidades are loaded in loadInitialData, so return them
    return localidades;
  }, [localidades]);

  const loadTiposProductos = useCallback(async () => {
    if (tiposProductosLoaded) return tiposProductos;
    try {
      const response = await GestionComercialService.consultarTiposProductos();
      setTiposProductos(response || []);
      setTiposProductosLoaded(true);
      return response || [];
    } catch (error) {
      console.error("NewLeadScreen:loadTiposProductos", error);
      return [];
    }
  }, [tiposProductosLoaded]);

  const loadTiposDocumento = useCallback(async () => {
    if (tiposDocumentoLoaded) return tiposDocumento;
    try {
      const response = await GestionComercialService.consultarTiposDocumentos();
      setTiposDocumento(response || []);
      setTiposDocumentoLoaded(true);
      return response || [];
    } catch (error) {
      console.error("NewLeadScreen:loadTiposDocumento", error);
      return [];
    }
  }, [tiposDocumentoLoaded]);

  const loadTiposPersona = useCallback(async () => {
    if (tiposPersonaLoaded) return tiposPersona;
    try {
      const response = await GestionComercialService.consultarTiposPersonas();
      setTiposPersona(response || []);
      setTiposPersonaLoaded(true);
      return response || [];
    } catch (error) {
      console.error("NewLeadScreen:loadTiposPersona", error);
      return [];
    }
  }, [tiposPersonaLoaded]);

  const loadResponsabilidades = useCallback(async () => {
    if (responsabilidadesLoaded) return responsabilidades;
    try {
      const response =
        await GestionComercialService.consultarResponsabilidadesTributarias();
      setResponsabilidades(response || []);
      setResponsabilidadesLoaded(true);
      return response || [];
    } catch (error) {
      console.error("NewLeadScreen:loadResponsabilidades", error);
      return [];
    }
  }, [responsabilidadesLoaded]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const loadFormasConocioDetalle = useCallback(async (formaId) => {
    if (!formaId) {
      setFormasConocioDetalle([]);
      return [];
    }
    try {
      const detalles =
        await GestionComercialService.consultarFormasComoNosConocioDetalles(
          formaId,
        );
      const data = detalles || [];
      setFormasConocioDetalle(data);
      return data;
    } catch (error) {
      console.error("NewLeadScreen:loadFormasConocioDetalle", error);
      return [];
    }
  }, []);

  useEffect(() => {
    loadFormasConocioDetalle(form.FormaComoNosConocioID);
  }, [form.FormaComoNosConocioID, loadFormasConocioDetalle]);

  useEffect(() => {
    const loadDynamicConfig = async () => {
      if (!form.OrigenPreContactoID) return;
      setLoadingConfig(true);
      try {
        const response = await GestionComercialService.consultarCombosOrigenes(
          form.OrigenPreContactoID,
        );
        // Web uses response.data for CamposPreContactos
        setFormConfig(response.data || []);
      } catch (error) {
        console.error("NewLeadScreen:loadDynamicConfig", error);
      } finally {
        setLoadingConfig(false);
      }
    };
    loadDynamicConfig();
  }, [form.OrigenPreContactoID]);

  const loadInmuebles = useCallback(async (origenId, search = "") => {
    const id = Number(origenId);
    if (id === 4 || id === 5) {
      setLoadingInmuebles(true);
      try {
        const tipoOferta = id === 5 ? 2 : 1;
        const data =
          await GestionComercialService.consultarInmueblesDisponibles({
            TipoOfertaID: tipoOferta,
            FullSearch: search,
          });
        setInmueblesDisponibles(data || []);
      } catch (error) {
        console.error("NewLeadScreen:loadInmuebles", error);
      } finally {
        setLoadingInmuebles(false);
      }
    } else {
      setInmueblesDisponibles([]);
      setLoadingInmuebles(false);
    }
  }, []);

  const toggleEstrato = (key) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleLocalidad = (id) => {
    setSelectedLocalidades((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const buildLocalidadesPayload = () =>
    Object.entries(selectedLocalidades)
      .filter(([, selected]) => selected)
      .map(([LocalidadID]) => ({
        LocalidadID: Number(LocalidadID),
        Seleccionar: true,
        Eliminar: false,
      }));

  const renderEstratoSlot = (error) => (
    <View style={styles.inputContainer}>
      <Text
        style={[
          styles.label,
          (error || staticErrors.Estrato) && styles.errorText,
        ]}
      >
        Estrato{" "}
        {form.OrigenPreContactoID == 4 && (
          <Text style={{ color: COLORS.danger }}>*</Text>
        )}
      </Text>
      <View style={styles.tagsContainer}>
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <TouchableOpacity
            key={num}
            onPress={() => toggleEstrato(`Estrato${num}`)}
            style={[
              styles.tag,
              form[`Estrato${num}`] && styles.tagSelected,
              (error || staticErrors.Estrato) &&
                !form[`Estrato${num}`] &&
                styles.tagError,
            ]}
          >
            <Text
              style={[
                styles.tagText,
                form[`Estrato${num}`] && styles.tagTextSelected,
              ]}
            >
              {num}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderLocalidadSlot = () => (
    <View style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <Text
          style={[styles.label, staticErrors.Localidades && styles.errorText]}
        >
          Localidades{" "}
          {form.OrigenPreContactoID == 4 && (
            <Text style={{ color: COLORS.danger }}>*</Text>
          )}
        </Text>
        <Text style={styles.smallNote}> (Solo Bogotá)</Text>
      </View>
      <View style={styles.tagsContainer}>
        {localidades.map((loc) => (
          <TouchableOpacity
            key={loc.LocalidadID}
            style={[
              styles.tag,
              selectedLocalidades[loc.LocalidadID] && styles.tagSelected,
              staticErrors.Localidades &&
                !selectedLocalidades[loc.LocalidadID] &&
                styles.tagError,
            ]}
            onPress={() => toggleLocalidad(loc.LocalidadID)}
          >
            <Text
              style={[
                styles.tagText,
                selectedLocalidades[loc.LocalidadID] && styles.tagTextSelected,
              ]}
            >
              {loc.Nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const handleSave = async () => {
    // 1. Validar campos estáticos
    const errors = {};
    if (!form.OrigenPreContactoID) errors.OrigenPreContactoID = true;
    if (!form.Nombres?.trim()) errors.Nombres = true;
    if (!form.Apellidos?.trim()) errors.Apellidos = true;
    if (!form.Celular?.trim()) errors.Celular = true;
    if (!form.AsesorID) errors.AsesorID = true;
    if (!form.FormaContactoID) errors.FormaContactoID = true;
    if (!form.FormaComoNosConocioID) errors.FormaComoNosConocioID = true;

    // Validaciones específicas por Origen (Paridad Web)
    if (form.OrigenPreContactoID == 2) {
      // Captaciones
      if (!form.TipoOfertaID) errors.TipoOfertaID = true;
      if (!form.TipoInmuebleID) errors.TipoInmuebleID = true;
      if (!form.Direccion?.trim()) errors.Direccion = true; // Web: InmuebleDireccion
    }

    if (form.OrigenPreContactoID == 4) {
      // Arrendatarios
      if (!form.TipoOfertaID) errors.TipoOfertaID = true;
      if (!form.TipoInmuebleID) errors.TipoInmuebleID = true;
      // Web no valida explícitamente Estrato/Localidad en ValidarCampos, pero se mantienen si son críticos para mobile UI
      const hasEstrato = [1, 2, 3, 4, 5, 6].some(
        (num) => form[`Estrato${num}`],
      );
      if (!hasEstrato) errors.Estrato = true;
      if (Object.keys(selectedLocalidades).length === 0)
        errors.Localidades = true;
    }

    if (form.OrigenPreContactoID == 5) {
      // Ventas
      if (!form.TipoInmuebleID) errors.TipoInmuebleID = true;
    }

    if (form.OrigenPreContactoID == 7) {
      // Avaluos
      if (!form.CiudadID) errors.CiudadID = true;
      if (!form.Direccion) errors.Direccion = true;
      if (!form.TipoAvaluoID) errors.TipoAvaluoID = true;
    }

    // ID 2 (Propietarios) specific
    if (form.OrigenPreContactoID == 2) {
      if (!form.LocalidadID) errors.LocalidadID = true;
      if (!form.Direccion?.trim()) errors.Direccion = true;
      if (!form.Area) errors.Area = true;
    }

    if (form.DetallarCliente) {
      if (!form.ClienteTipoDocumentoID) errors.ClienteTipoDocumentoID = true;
      if (!form.ClienteDocumento?.trim()) errors.ClienteDocumento = true;
      if (!form.ClienteTipoPersonaID) errors.ClienteTipoPersonaID = true;
      if (isEmpresa) {
        if (!form.ClienteNombreRazonSocial?.trim())
          errors.ClienteNombreRazonSocial = true;
      } else {
        if (!form.ClienteNombres?.trim()) errors.ClienteNombres = true;
        if (!form.ClienteApellidos?.trim()) errors.ClienteApellidos = true;
      }
    }

    setStaticErrors(errors);

    // 2. Validar formularios dinámicos
    const isMainValid = mainFormRef.current?.validate();
    const isFiscalValid = form.DetallarCliente
      ? fiscalFormRef.current?.validate()
      : true;

    const hasStaticErrors = Object.keys(errors).length > 0;

    if (hasStaticErrors || !isMainValid || !isFiscalValid) {
      Alert.alert(
        "Error",
        "Por favor complete los campos requeridos marcados con *",
      );
      return;
    }

    const payload = {
      ...form,
      OrigenPreContactoID:
        Number(form.OrigenPreContactoID) || form.OrigenPreContactoID,
      ProcesosInmobiliariaLocalidades: buildLocalidadesPayload(),
      ProcesosServiciosIniciales: procesosServiciosIniciales,
      CuentaMensajeriaContactoID: contact?.CuentaMensajeriaContactoID || null,
      UsuarioID: user?.UsuarioID,
      Usuario: user?.UsuarioID,
      DirIP: user?.Ip || user?.DirIP || "",
      SucursalID: user?.SucursalID,
    };

    setSaving(true);
    try {
      const response = isEditing
        ? await GestionComercialService.actualizarPreContacto(payload)
        : await GestionComercialService.crearPreContacto(payload);
      const message =
        response?.rows?.[0]?.Descripcion ||
        (isEditing
          ? "Contacto actualizado correctamente"
          : "Contacto guardado correctamente");
      Alert.alert("Éxito", message, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("NewLeadScreen:handleSave", error);
      Alert.alert(
        "Error",
        `No pudimos ${
          isEditing ? "actualizar" : "guardar"
        } el contacto. Intenta nuevamente.`,
      );
    } finally {
      setSaving(false);
    }
  };
  const handleSelectInmueble = useCallback((item) => {
    setForm((prev) => ({
      ...prev,
      InmuebleID: item.InmuebleID,
    }));
    setShowInmuebleModal(false);
  }, []);

  const addServicios = () => {
    if (!servicio.TipoProductoID) {
      Alert.alert("Error", "Seleccione un servicio");
      return;
    }
    const selected = tiposProductos.find(
      (t) =>
        t.TipoProductoID === servicio.TipoProductoID ||
        t.id === servicio.TipoProductoID,
    );
    if (!selected) return;
    const exists = procesosServiciosIniciales.find(
      (s) => s.TipoProductoID === servicio.TipoProductoID && !s.Eliminar,
    );
    if (exists) {
      Alert.alert("Error", "El servicio ya está agregado");
      return;
    }
    const newServicio = {
      TipoProductoID: servicio.TipoProductoID,
      Nombre: selected.Nombre,
      Eliminar: false,
    };
    setProcesosServiciosIniciales((prev) => [...prev, newServicio]);
    setServicio({ TipoProductoID: "", Nombre: "" });
  };

  const removeServicios = (index) => {
    setProcesosServiciosIniciales((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, styles.centerContent]}
        edges={["bottom", "left", "right"]}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
        <ActivityIndicator size="large" color={COLORS.primary} />
        {errorMessage ? (
          <>
            <Text style={[styles.errorText, { marginTop: 16 }]}>
              {errorMessage}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadInitialData}
            >
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />

      <PropertySelectionModal
        visible={showInmuebleModal}
        onClose={() => setShowInmuebleModal(false)}
        inmueblesDisponibles={inmueblesDisponibles}
        loadingInmuebles={loadingInmuebles}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSelectInmueble={handleSelectInmueble}
        selectedInmuebleID={form.InmuebleID}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity
                onPress={loadInitialData}
                style={{ marginTop: 8 }}
              >
                <Text style={styles.retryText}>Intentar de nuevo</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <GeneralInfoSection
            form={form}
            setForm={setForm}
            staticErrors={staticErrors}
            setStaticErrors={setStaticErrors}
            loadOrigenes={loadOrigenes}
            loadCiudades={loadCiudades}
            loadFormasContacto={loadFormasContacto}
            loadFormasConocio={loadFormasConocio}
            loadFormasConocioDetalle={loadFormasConocioDetalle}
          />

          <SearchDataSection
            form={form}
            setForm={setForm}
            staticErrors={staticErrors}
            setStaticErrors={setStaticErrors}
            loadAsesores={loadAsesores}
            onSearchAsesores={onSearchAsesores}
            loadTiposOferta={loadTiposOferta}
            loadCondicionesInmueble={loadCondicionesInmueble}
            loadTiposInmueble={loadTiposInmueble}
            loadAntiguedades={loadAntiguedades}
            loadTiposAvaluo={loadTiposAvaluo}
            loadLocalidades={loadLocalidades}
            loadCiudades={loadCiudades}
            loadTiposProductos={loadTiposProductos}
            loadFormasContacto={loadFormasContacto}
            loadFormasConocio={loadFormasConocio}
            loadFormasConocioDetalle={loadFormasConocioDetalle}
            loadTiposDocumento={loadTiposDocumento}
            loadTiposPersona={loadTiposPersona}
            loadResponsabilidades={loadResponsabilidades}
            setShowInmuebleModal={setShowInmuebleModal}
            renderEstratoSlot={renderEstratoSlot}
            renderLocalidadSlot={renderLocalidadSlot}
            mainFormRef={mainFormRef}
            formConfig={formConfig}
            procesosServiciosIniciales={procesosServiciosIniciales}
            addServicios={addServicios}
            removeServicios={removeServicios}
            servicio={servicio}
            setServicio={setServicio}
          />

          <View style={styles.card}>
            <SectionHeader
              title="Otros Datos"
              icon="ellipsis-horizontal-circle-outline"
            />
            <CustomInput
              label="Observaciones"
              value={form.Observaciones}
              onChangeText={(t) => setForm({ ...form, Observaciones: t })}
              placeholder="Notas internas..."
              multiline
            />
          </View>

          <ClientDetailSection
            form={form}
            setForm={setForm}
            staticErrors={staticErrors}
            setStaticErrors={setStaticErrors}
            detailLabel={detailLabel}
            detailTitle={detailTitle}
            loadTiposDocumento={loadTiposDocumento}
            loadTiposPersona={loadTiposPersona}
            loadResponsabilidades={loadResponsabilidades}
            handleTipoPersonaChange={handleTipoPersonaChange}
            isEmpresa={isEmpresa}
            fiscalFormRef={fiscalFormRef}
            formConfig={formConfig}
          />

          <TouchableOpacity
            style={[
              styles.saveButtonContainer,
              saving && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>
                {saving ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  headerButton: {
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EFF6FF", // Light blue tint
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 0,
  },
  flexHalf: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    marginLeft: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  required: {
    color: COLORS.danger,
    marginLeft: 2,
    fontSize: 13,
  },
  smallNote: {
    fontSize: 11,
    color: COLORS.primary,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 50,
  },
  inputWrapperMultiline: {
    height: 100,
    alignItems: "flex-start",
    paddingTop: 12,
  },
  miniInputWrapper: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 50,
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    height: "100%",
  },
  inputMultiline: {
    textAlignVertical: "top",
  },
  inputIcon: {
    marginRight: 10,
  },
  pickerWrapper: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    height: 50,
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    color: COLORS.text,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#fff",
  },
  tagSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagError: {
    borderColor: COLORS.danger,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  tagTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: "center",
    fontSize: 13,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: "600",
    textAlign: "center",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.text,
  },
  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  selectBoxText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
  },
  selectBoxPlaceholder: {
    color: COLORS.textSecondary,
  },
  selectBoxDisabledText: {
    color: COLORS.textSecondary,
  },
  saveButtonContainer: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderRadius: 30,
    marginHorizontal: 20,
    width: "40%",
    height: 60,
    alignSelf: "center",
  },
  saveButton: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 30,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  addButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 5,
  },
  servicesList: {
    marginTop: 10,
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    padding: 10,
    marginBottom: 5,
  },
  serviceText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
  },
});

export default NewLeadScreen;
