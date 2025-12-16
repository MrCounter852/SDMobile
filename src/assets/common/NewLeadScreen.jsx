import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useGlobal } from '../../core/global';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import leadService from '../../services/leads/leadService';

const COLORS = {
  primary: '#337ab7', // User requested blue
  secondary: '#88E782', // User requested green (for gradient)
  background: '#F3F4F6', // Light Gray background from original
  card: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  inputBg: '#F9FAFB', // Restored light gray input bg
  focus: '#337ab7',
  white: '#FFFFFF',
  danger: '#DC2626',
  success: '#10B981',
};

const CustomInput = ({ label, required, value, onChangeText, placeholder, multiline, keyboardType, icon }) => (
  <View style={styles.inputContainer}>
    <View style={styles.labelContainer}>
      <Text style={styles.label}>{label}</Text>
      {required && <Text style={styles.required}>*</Text>}
    </View>
    <View style={[styles.inputWrapper, multiline && styles.inputWrapperMultiline]}>
      {icon && <Ionicons name={icon} size={20} color={COLORS.textSecondary} style={styles.inputIcon} />}
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value ? String(value) : ''}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  </View>
);

const CustomPicker = ({ label, required, selectedValue, onValueChange, items = [], placeholder }) => (
  <View style={styles.inputContainer}>
    <View style={styles.labelContainer}>
      <Text style={styles.label}>{label}</Text>
      {required && <Text style={styles.required}>*</Text>}
    </View>
    <View style={styles.pickerWrapper}>
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        style={styles.picker}
        dropdownIconColor={COLORS.textSecondary}
      >
        <Picker.Item label={placeholder || "Seleccione"} value="" color={COLORS.textSecondary} style={{ fontSize: 14 }} />
        {items.map((item, index) => (
          <Picker.Item
            key={item.id || item.value || index}
            label={item.label || item.Nombre || item.NombreCompleto || item.Descripcion || item}
            value={item.id || item.value || item.OrigenPreContactoID || item.AsesorID || item.InmuebleID || item.TipoOfertaID || item.CondicionInmuebleID || item.TipoInmuebleID || item.AntiguedadInmuebleID || item.TipoAvaluoID || item.LocalidadID || item.FormaContactoID || item.FormaComoNosConocioID || item.FormaComoNosConocioDetalleID || item.TipoDocumentoID || item.TipoPersonaID || item.ResponsabilidadTributariaID || item.TipoProductoID || item}
            color={COLORS.text}
            style={{ fontSize: 14 }}
          />
        ))}
      </Picker>
    </View>
  </View>
);

const SectionHeader = ({ title, icon }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionIconContainer}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const DETAIL_LABELS = {
  2: { label: 'propietario', title: 'Propietario' },
  4: { label: 'arrendatario', title: 'Arrendatario' },
  5: { label: 'comprador', title: 'Comprador' },
};

const NewLeadScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { contact, preContacto } = route.params || {};
  const { user } = useGlobal();


  const [origenes, setOrigenes] = useState([]);
  const [asesores, setAsesores] = useState([]);
  const [formasContacto, setFormasContacto] = useState([]);
  const [formasConocio, setFormasConocio] = useState([]);
  const [formasConocioDetalle, setFormasConocioDetalle] = useState([]);
  const [inmueblesDisponibles, setInmueblesDisponibles] = useState([]);
  const [tiposOferta, setTiposOferta] = useState([]);
  const [condicionesInmueble, setCondicionesInmueble] = useState([]);
  const [tiposInmueble, setTiposInmueble] = useState([]);
  const [antiguedades, setAntiguedades] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [tiposAvaluo, setTiposAvaluo] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [tiposPersona, setTiposPersona] = useState([]);
  const [responsabilidades, setResponsabilidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');


  const [form, setForm] = useState({
    OrigenPreContactoID: preContacto?.OrigenPreContactoID || 4, // Default to Arrendatarios
    Nombres: preContacto?.Nombres || '',
    Apellidos: preContacto?.Apellidos || '',
    Celular: preContacto?.Celular || contact?.Telefono || '',
    Email: preContacto?.Email || '',

    // Conditional Fields
    FormaContactoID: preContacto?.FormaContactoID || '',
    FormaComoNosConocioID: preContacto?.FormaComoNosConocioID || '',
    FormaComoNosConocioDetalleID: preContacto?.FormaComoNosConocioDetalleID || '',
    PalabraBusqueda: preContacto?.PalabraBusqueda || '',

    AsesorID: preContacto?.AsesorID || user?.AsesorID || '',
    Telefono: preContacto?.Telefono || '',

    InmuebleID: preContacto?.InmuebleID || '',
    TipoOfertaID: preContacto?.TipoOfertaID || '',
    CondicionInmuebleID: preContacto?.CondicionInmuebleID || '',
    TipoInmuebleID: preContacto?.TipoInmuebleID || '',
    AntiguedadInmuebleID: preContacto?.AntiguedadInmuebleID || '',
    TipoAvaluoID: preContacto?.TipoAvaluoID || '',

    AreaDesde: preContacto?.AreaDesde || '',
    AreaHasta: preContacto?.AreaHasta || '',
    Cantidadhabitaciones: preContacto?.Cantidadhabitaciones || '',
    CantidadGarajes: preContacto?.CantidadGarajes || '',
    PresupuestoDesde: preContacto?.PresupuestoDesde || '',
    PresupuestoHasta: preContacto?.PresupuestoHasta || '',
    CantidadBanos: preContacto?.CantidadBanos || '',
    InteresesUbicacion: preContacto?.InteresesUbicacion || '',

    // Checkboxes for Estrato
    Estrato1: preContacto?.Estrato1 || false,
    Estrato2: preContacto?.Estrato2 || false,
    Estrato3: preContacto?.Estrato3 || false,
    Estrato4: preContacto?.Estrato4 || false,
    Estrato5: preContacto?.Estrato5 || false,
    Estrato6: preContacto?.Estrato6 || false,

    DescripcionAdicional: preContacto?.DescripcionAdicional || '',
    Observaciones: preContacto?.Observaciones || '',
    DetallarCliente: preContacto?.DetallarCliente || false,

    // Detailed Client Info...
    ClienteTipoDocumentoID: '',
    ClienteDocumento: '',
    ClienteNombres: '',
    ClienteNombres2: '',
    ClienteApellidos: '',
    ClienteApellidos2: '',
    ClienteDireccion: '',
    ClienteTelefono: '',
    ClienteCelular: '',
    ClienteEmail: '',
    ClienteEmailFacturacionElectronica: '',
    ClienteTipoPersonaID: '',
    ClienteResponsabilidadTributariaID: '',
  });

  const [selectedLocalidades, setSelectedLocalidades] = useState({});

  const detailLabel = useMemo(() => {
    const current = DETAIL_LABELS[form.OrigenPreContactoID];
    return current ? current.label : 'cliente o empresa';
  }, [form.OrigenPreContactoID]);

  const detailTitle = useMemo(() => {
    const current = DETAIL_LABELS[form.OrigenPreContactoID];
    return current ? current.title : 'Cliente o empresa';
  }, [form.OrigenPreContactoID]);

  const isEmpresa = useMemo(() => {
    const tipo = tiposPersona.find(
      t =>
        t?.TipoPersonaID === form.ClienteTipoPersonaID ||
        t?.id === form.ClienteTipoPersonaID
    );
    return tipo?.Empresa || tipo?.esEmpresa || false;
  }, [form.ClienteTipoPersonaID, tiposPersona]);

  useFocusEffect(
    React.useCallback(() => {
      navigation.setOptions({
        headerTitle: () => (
          <Text style={{ color: '#337ab7', fontSize: 18, fontWeight: 'bold' }}>Nuevo Contacto</Text>
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
    }, [navigation])
  );

  const handleTipoPersonaChange = (value) => {
    setForm(prev => {
      const updated = { ...prev, ClienteTipoPersonaID: value };
      const tipo = tiposPersona.find(
        t => t?.TipoPersonaID === value || t?.id === value
      );
      if (tipo?.Empresa || tipo?.esEmpresa) {
        updated.ClienteNombres2 = '';
        updated.ClienteApellidos = '';
        updated.ClienteApellidos2 = '';
      }
      return updated;
    });
  };

  useEffect(() => {
    if (preContacto?.ProcesosInmobiliariaLocalidades?.length) {
      const mapped = {};
      preContacto.ProcesosInmobiliariaLocalidades.forEach(loc => {
        if (!loc?.Eliminar && loc?.LocalidadID != null) {
          mapped[loc.LocalidadID] = true;
        }
      });
      setSelectedLocalidades(mapped);
    }
  }, [preContacto]);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [
        origenesResp,
        asesoresResp,
        formasContactoResp,
        formasConocioResp,
        tiposOfertaResp,
        condicionesResp,
        tiposInmuebleResp,
        antiguedadesResp,
        localidadesResp,
        tiposDocumentoResp,
        tiposPersonaResp,
        responsabilidadesResp,
        tiposAvaluoResp,
      ] = await Promise.all([
        leadService.consultarOrigenesPreContactos(),
        leadService.consultarAsesores(),
        leadService.consultarFormasContacto(),
        leadService.consultarFormasComoNosConocio(),
        leadService.consultarTiposOfertas(),
        leadService.consultarCondicionesInmueble(),
        leadService.consultarTiposInmueble(),
        leadService.consultarAntiguedadesInmueble(),
        leadService.consultarLocalidades(),
        leadService.consultarTiposDocumentos(),
        leadService.consultarTiposPersonas(),
        leadService.consultarResponsabilidadesTributarias(),
        leadService.consultarTiposAvaluos(),
      ]);

      setOrigenes(origenesResp || []);
      setAsesores(asesoresResp || []);
      setFormasContacto(formasContactoResp || []);
      setFormasConocio(formasConocioResp || []);
      setTiposOferta(tiposOfertaResp || []);
      setCondicionesInmueble(condicionesResp || []);
      setTiposInmueble(tiposInmuebleResp || []);
      setAntiguedades(antiguedadesResp || []);
      setLocalidades(localidadesResp || []);
      setTiposDocumento(tiposDocumentoResp || []);
      setTiposPersona(tiposPersonaResp || []);
      setResponsabilidades(responsabilidadesResp || []);
      setTiposAvaluo(tiposAvaluoResp || []);

      if (!preContacto?.OrigenPreContactoID) {
        const defaultOrigen = (origenesResp || [])[0]?.OrigenPreContactoID;
        if (defaultOrigen) {
          setForm(prev => ({
            ...prev,
            OrigenPreContactoID: prev.OrigenPreContactoID || defaultOrigen,
          }));
        }
      }
    } catch (error) {
      console.error('NewLeadScreen:loadInitialData', error);
      setErrorMessage('No pudimos cargar la información inicial. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [preContacto]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const loadFormasDetalle = useCallback(async (formaId) => {
    if (!formaId) {
      setFormasConocioDetalle([]);
      return;
    }
    try {
      const detalles = await leadService.consultarFormasComoNosConocioDetalles(formaId);
      setFormasConocioDetalle(detalles || []);
    } catch (error) {
      console.error('NewLeadScreen:loadFormasDetalle', error);
    }
  }, []);

  useEffect(() => {
    loadFormasDetalle(form.FormaComoNosConocioID);
  }, [form.FormaComoNosConocioID, loadFormasDetalle]);

  const loadInmuebles = useCallback(async (origenId) => {
    const id = Number(origenId);
    if (id === 4 || id === 5) {
      try {
        const tipoOferta = id === 5 ? 2 : 1;
        const data = await leadService.consultarInmueblesDisponibles({ TipoOfertaID: tipoOferta });
        setInmueblesDisponibles(data || []);
      } catch (error) {
        console.error('NewLeadScreen:loadInmuebles', error);
      }
    } else {
      setInmueblesDisponibles([]);
    }
  }, []);

  useEffect(() => {
    if (form.OrigenPreContactoID) {
      loadInmuebles(form.OrigenPreContactoID);
    }
  }, [form.OrigenPreContactoID, loadInmuebles]);

  const toggleEstrato = (key) => {
    setForm(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleLocalidad = (id) => {
    setSelectedLocalidades(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const buildLocalidadesPayload = () => (
    Object.entries(selectedLocalidades)
      .filter(([, selected]) => selected)
      .map(([LocalidadID]) => ({
        LocalidadID: Number(LocalidadID),
        Seleccionar: true,
        Eliminar: false,
      }))
  );

  const handleSave = async () => {
    if (!form.Nombres.trim()) { Alert.alert('Error', 'Nombres es requerido'); return; }
    if (!form.Apellidos.trim()) { Alert.alert('Error', 'Apellidos es requerido'); return; }
    if (!form.Celular.trim()) { Alert.alert('Error', 'Celular es requerido'); return; }
    const payload = {
      ...form,
      OrigenPreContactoID: Number(form.OrigenPreContactoID) || form.OrigenPreContactoID,
      ProcesosInmobiliariaLocalidades: buildLocalidadesPayload(),
      ProcesosServiciosIniciales: [],
      CuentaMensajeriaContactoID: contact?.CuentaMensajeriaContactoID || null,
      UsuarioID: user?.UsuarioID,
      Usuario: user?.UsuarioID,
      DirIP: user?.Ip || user?.DirIP || '',
      SucursalID: user?.SucursalID,
    };

    setSaving(true);
    try {
      const response = await leadService.crearPreContacto(payload);
      const message = response?.rows?.[0]?.Descripcion || 'Contacto guardado correctamente';
      Alert.alert('Éxito', message, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('NewLeadScreen:handleSave', error);
      Alert.alert('Error', 'No pudimos guardar el contacto. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]} edges={['bottom', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
        <ActivityIndicator size="large" color={COLORS.primary} />
        {errorMessage ? (
          <>
            <Text style={[styles.errorText, { marginTop: 16 }]}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadInitialData}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />

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
              <TouchableOpacity onPress={loadInitialData} style={{ marginTop: 8 }}>
                <Text style={styles.retryText}>Intentar de nuevo</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* --- INFORMACIÓN GENERAL --- */}
          <View style={styles.card}>
            <SectionHeader title="Información General" icon="information-circle-outline" />
            <CustomPicker
              label="Tipo de contacto"
              required
              selectedValue={form.OrigenPreContactoID}
              onValueChange={value => setForm({ ...form, OrigenPreContactoID: value ? Number(value) : '' })}
              items={origenes}
              placeholder="Selecciona el origen"
            />

            <View style={styles.row}>
              <View style={styles.flexHalf}>
                <CustomInput
                  label="Nombres"
                  required
                  value={form.Nombres}
                  onChangeText={t => setForm({ ...form, Nombres: t })}
                  placeholder="Ej. Juan"
                />
              </View>
              <View style={styles.flexHalf}>
                <CustomInput
                  label="Apellidos"
                  required
                  value={form.Apellidos}
                  onChangeText={t => setForm({ ...form, Apellidos: t })}
                  placeholder="Ej. Pérez"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flexHalf}>
                <CustomInput
                  label="Celular"
                  required
                  value={form.Celular}
                  onChangeText={t => setForm({ ...form, Celular: t })}
                  placeholder="300 000 0000"
                  keyboardType="phone-pad"
                  icon="call-outline"
                />
              </View>
              <View style={styles.flexHalf}>
                <CustomInput
                  label="Email"
                  value={form.Email}
                  onChangeText={t => setForm({ ...form, Email: t })}
                  placeholder="correo@ejemplo.com"
                  keyboardType="email-address"
                  icon="mail-outline"
                />
              </View>
            </View>

            {/* Logic from HTML: if OrigenPreContactoID == 7 (Avaluos) */}
            {form.OrigenPreContactoID == 7 && (
              <>
                <View style={styles.row}>
                  <View style={styles.flexHalf}>
                    <CustomPicker
                      label="¿Como se contactaron?"
                      required
                      selectedValue={form.FormaContactoID}
                      onValueChange={v => setForm({ ...form, FormaContactoID: v })}
                      items={formasContacto}
                    />
                  </View>
                  <View style={styles.flexHalf}>
                    <CustomPicker
                      label="¿Como nos conocieron?"
                      required
                      selectedValue={form.FormaComoNosConocioID}
                      onValueChange={v => setForm({ ...form, FormaComoNosConocioID: v })}
                      items={formasConocio}
                    />
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={styles.flexHalf}>
                    <CustomPicker
                      label="Especificación"
                      selectedValue={form.FormaComoNosConocioDetalleID}
                      onValueChange={v => setForm({ ...form, FormaComoNosConocioDetalleID: v })}
                      items={formasConocioDetalle}
                    />
                  </View>
                  <View style={styles.flexHalf}>
                    <CustomInput
                      label="Palabras de busqueda"
                      value={form.PalabraBusqueda}
                      onChangeText={t => setForm({ ...form, PalabraBusqueda: t })}
                      placeholder="Ej. Google"
                      icon="search-outline"
                    />
                  </View>
                </View>
              </>
            )}
          </View>

          {/* --- DATOS DE BUSQUEDA --- */}
          <View style={styles.card}>
            <SectionHeader title="Datos de Búsqueda" icon="search-outline" />

            <View style={styles.row}>
              <View style={[styles.flexHalf, { flex: 2 }]}>
                <CustomPicker
                  label="Asesor Comercial"
                  required
                  selectedValue={form.AsesorID}
                  onValueChange={v => setForm({ ...form, AsesorID: v })}
                  items={asesores}
                  placeholder="Asignar a..."
                />
              </View>
              <View style={[styles.flexHalf, { flex: 1 }]}>
                <CustomInput
                  label="Teléfono"
                  value={form.Telefono}
                  onChangeText={t => setForm({ ...form, Telefono: t })}
                  placeholder="Opcional"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {(form.OrigenPreContactoID == 4 || form.OrigenPreContactoID == 5) && (
              <CustomPicker
                label="Inmueble de Interés"
                selectedValue={form.InmuebleID}
                onValueChange={v => setForm({ ...form, InmuebleID: v })}
                items={inmueblesDisponibles}
              />
            )}

            <View style={styles.row}>
              {(form.OrigenPreContactoID == 2 || form.OrigenPreContactoID == 4) && (
                <View style={styles.flexHalf}>
                  <CustomPicker
                    label="Tipo de Oferta"
                    required
                    selectedValue={form.TipoOfertaID}
                    onValueChange={v => setForm({ ...form, TipoOfertaID: v })}
                    items={tiposOferta}
                  />
                </View>
              )}

              {(form.OrigenPreContactoID == 2 || form.OrigenPreContactoID == 4 || form.OrigenPreContactoID == 5) && (
                <View style={styles.flexHalf}>
                  <CustomPicker
                    label="Condición"
                    selectedValue={form.CondicionInmuebleID}
                    onValueChange={v => setForm({ ...form, CondicionInmuebleID: v })}
                    items={condicionesInmueble}
                  />
                </View>
              )}
            </View>

            <View style={styles.row}>
              {(form.OrigenPreContactoID == 2 || form.OrigenPreContactoID == 4 || form.OrigenPreContactoID == 5 || form.OrigenPreContactoID == 7) && (
                <View style={styles.flexHalf}>
                  <CustomPicker
                    label="Tipo de Inmueble"
                    required
                    selectedValue={form.TipoInmuebleID}
                    onValueChange={v => setForm({ ...form, TipoInmuebleID: v })}
                    items={tiposInmueble}
                  />
                </View>
              )}

              {(form.OrigenPreContactoID == 2 || form.OrigenPreContactoID == 4 || form.OrigenPreContactoID == 5) && (
                <View style={styles.flexHalf}>
                  <CustomPicker
                    label="Antigüedad"
                    selectedValue={form.AntiguedadInmuebleID}
                    onValueChange={v => setForm({ ...form, AntiguedadInmuebleID: v })}
                    items={antiguedades}
                  />
                </View>
              )}
            </View>

            {form.OrigenPreContactoID == 7 && (
              <CustomPicker
                label="Tipo de Avalúo"
                required
                selectedValue={form.TipoAvaluoID}
                onValueChange={v => setForm({ ...form, TipoAvaluoID: v })}
                items={tiposAvaluo}
                placeholder="Seleccione"
              />
            )}

            {/* Area (Desde - Hasta) & Rooms/Parking */}
            {form.OrigenPreContactoID == 4 && (
              <>
                <View style={styles.row}>
                  <View style={styles.flexHalf}>
                    <Text style={styles.label}>Área (m²)</Text>
                    <View style={{ flexDirection: 'row', gap: 5 }}>
                      <View style={styles.miniInputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="Min"
                          placeholderTextColor={COLORS.textSecondary}
                          keyboardType="numeric"
                          value={form.AreaDesde}
                          onChangeText={t => setForm({ ...form, AreaDesde: t })}
                        />
                      </View>
                      <View style={styles.miniInputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="Max"
                          placeholderTextColor={COLORS.textSecondary}
                          keyboardType="numeric"
                          value={form.AreaHasta}
                          onChangeText={t => setForm({ ...form, AreaHasta: t })}
                        />
                      </View>
                    </View>
                  </View>
                  <View style={styles.flexHalf}>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <CustomInput
                          label="Habita."
                          value={form.Cantidadhabitaciones}
                          onChangeText={t => setForm({ ...form, Cantidadhabitaciones: t })}
                          placeholder="#"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <CustomInput
                          label="Parq."
                          value={form.CantidadGarajes}
                          onChangeText={t => setForm({ ...form, CantidadGarajes: t })}
                          placeholder="#"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.flexHalf}>
                    <Text style={styles.label}>Presupuesto</Text>
                    <View style={{ flexDirection: 'row', gap: 5 }}>
                      <View style={styles.miniInputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="$ Min"
                          placeholderTextColor={COLORS.textSecondary}
                          keyboardType="numeric"
                          value={form.PresupuestoDesde}
                          onChangeText={t => setForm({ ...form, PresupuestoDesde: t })}
                        />
                      </View>
                      <View style={styles.miniInputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="$ Max"
                          placeholderTextColor={COLORS.textSecondary}
                          keyboardType="numeric"
                          value={form.PresupuestoHasta}
                          onChangeText={t => setForm({ ...form, PresupuestoHasta: t })}
                        />
                      </View>
                    </View>
                  </View>
                  <View style={[styles.flexHalf, { flex: 0.5 }]}>
                    <CustomInput
                      label="Baños"
                      value={form.CantidadBanos}
                      onChangeText={t => setForm({ ...form, CantidadBanos: t })}
                      placeholder="#"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <CustomInput
                  label="Ubicación Detallada"
                  required
                  value={form.InteresesUbicacion}
                  onChangeText={t => setForm({ ...form, InteresesUbicacion: t })}
                  placeholder="Barrio, cerca de..."
                  multiline
                />

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Estrato</Text>
                  <View style={styles.tagsContainer}>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <TouchableOpacity
                        key={num}
                        onPress={() => toggleEstrato(`Estrato${num}`)}
                        style={[styles.tag, form[`Estrato${num}`] && styles.tagSelected]}
                      >
                        <Text style={[styles.tagText, form[`Estrato${num}`] && styles.tagTextSelected]}>{num}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* Localidades - Only for Bogota (ID 4 or 5) */}
            {(form.OrigenPreContactoID == 4 || form.OrigenPreContactoID == 5) && (
              <View style={styles.inputContainer}>
                <View style={styles.labelContainer}>
                  <Text style={styles.label}>{form.OrigenPreContactoID == 4 ? "Localidades *" : "Localidades"}</Text>
                  <Text style={styles.smallNote}> (Solo Bogotá)</Text>
                </View>
                <View style={styles.tagsContainer}>
                  {localidades.map(loc => (
                    <TouchableOpacity
                      key={loc.LocalidadID}
                      style={[styles.tag, selectedLocalidades[loc.LocalidadID] && styles.tagSelected]}
                      onPress={() => toggleLocalidad(loc.LocalidadID)}
                    >
                      <Text style={[styles.tagText, selectedLocalidades[loc.LocalidadID] && styles.tagTextSelected]}>{loc.Nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {(form.OrigenPreContactoID == 2 || form.OrigenPreContactoID == 4 || form.OrigenPreContactoID == 5) && (
              <CustomInput
                label="Descripción Adicional Inmueble"
                value={form.DescripcionAdicional}
                onChangeText={t => setForm({ ...form, DescripcionAdicional: t })}
                placeholder="Cerca a colegios, parques..."
                multiline
              />
            )}

            <CustomInput
              label="Observaciones"
              value={form.Observaciones}
              onChangeText={t => setForm({ ...form, Observaciones: t })}
              placeholder="Notas internas..."
              multiline
            />

            <TouchableOpacity
              style={[styles.switchRow, { marginTop: 10 }]}
              onPress={() => setForm(p => ({ ...p, DetallarCliente: !p.DetallarCliente }))}
            >
              <Ionicons
                name={form.DetallarCliente ? "checkbox" : "square-outline"}
                size={24}
                color={COLORS.primary}
              />
              <Text style={[styles.switchLabel, { marginLeft: 10 }]}>Detallar {detailLabel}</Text>
            </TouchableOpacity>

          </View>

          {form.DetallarCliente && (
            <View style={styles.card}>
              <SectionHeader title={detailTitle} icon="person-circle-outline" />

              <View style={styles.row}>
                <View style={styles.flexHalf}>
                  <CustomPicker
                    label="Tipo de documento"
                    selectedValue={form.ClienteTipoDocumentoID}
                    onValueChange={v => setForm({ ...form, ClienteTipoDocumentoID: v })}
                    items={tiposDocumento}
                    placeholder="Seleccione"
                  />
                </View>
                <View style={styles.flexHalf}>
                  <CustomInput
                    label="Documento"
                    value={form.ClienteDocumento}
                    onChangeText={t => setForm({ ...form, ClienteDocumento: t })}
                    placeholder="Sin dígito de verificación"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.flexHalf}>
                  <CustomPicker
                    label="Tipo de persona"
                    selectedValue={form.ClienteTipoPersonaID}
                    onValueChange={handleTipoPersonaChange}
                    items={tiposPersona}
                    placeholder="Seleccione"
                  />
                </View>
                <View style={styles.flexHalf}>
                  <CustomPicker
                    label="Responsabilidad tributaria"
                    selectedValue={form.ClienteResponsabilidadTributariaID}
                    onValueChange={v => setForm({ ...form, ClienteResponsabilidadTributariaID: v })}
                    items={responsabilidades}
                    placeholder="Seleccione"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.flexHalf}>
                  <CustomInput
                    label={isEmpresa ? 'Nombre de la empresa' : 'Nombres'}
                    required
                    value={form.ClienteNombres}
                    onChangeText={t => setForm({ ...form, ClienteNombres: t })}
                    placeholder={isEmpresa ? 'Nombre legal' : 'Primer nombre'}
                  />
                </View>
                {!isEmpresa && (
                  <View style={styles.flexHalf}>
                    <CustomInput
                      label="Nombres 2"
                      value={form.ClienteNombres2}
                      onChangeText={t => setForm({ ...form, ClienteNombres2: t })}
                      placeholder="Segundo nombre"
                    />
                  </View>
                )}
              </View>

              {!isEmpresa && (
                <View style={styles.row}>
                  <View style={styles.flexHalf}>
                    <CustomInput
                      label="Apellidos"
                      value={form.ClienteApellidos}
                      onChangeText={t => setForm({ ...form, ClienteApellidos: t })}
                      placeholder="Primer apellido"
                    />
                  </View>
                  <View style={styles.flexHalf}>
                    <CustomInput
                      label="Apellidos 2"
                      value={form.ClienteApellidos2}
                      onChangeText={t => setForm({ ...form, ClienteApellidos2: t })}
                      placeholder="Segundo apellido"
                    />
                  </View>
                </View>
              )}

              <CustomInput
                label="Dirección"
                value={form.ClienteDireccion}
                onChangeText={t => setForm({ ...form, ClienteDireccion: t })}
                placeholder="Dirección principal"
              />

              <View style={styles.row}>
                <View style={styles.flexHalf}>
                  <CustomInput
                    label="Teléfono"
                    value={form.ClienteTelefono}
                    onChangeText={t => setForm({ ...form, ClienteTelefono: t })}
                    placeholder="Fijo"
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.flexHalf}>
                  <CustomInput
                    label="Celular"
                    value={form.ClienteCelular}
                    onChangeText={t => setForm({ ...form, ClienteCelular: t })}
                    placeholder="(3XX) XXX XXXX"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <CustomInput
                label="Email"
                value={form.ClienteEmail}
                onChangeText={t => setForm({ ...form, ClienteEmail: t })}
                placeholder="correo@ejemplo.com"
                keyboardType="email-address"
              />

              <CustomInput
                label="Email Facturación Electrónica"
                value={form.ClienteEmailFacturacionElectronica}
                onChangeText={t => setForm({ ...form, ClienteEmailFacturacionElectronica: t })}
                placeholder="facturacion@empresa.com"
                keyboardType="email-address"
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveButtonContainer, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>{saving ? 'Guardando...' : 'Guardar Contacto'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 60 }} />

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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerButton: {
    padding: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF', // Light blue tint
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    marginLeft: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 50,
  },
  inputWrapperMultiline: {
    height: 100,
    alignItems: 'flex-start',
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
    justifyContent: 'center'
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    height: '100%',
  },
  inputMultiline: {
    textAlignVertical: 'top',
  },
  inputIcon: {
    marginRight: 10,
  },
  pickerWrapper: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    height: 50,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    color: COLORS.text,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
  },
  tagSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  tagTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: 'center',
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
    fontWeight: '600',
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 15,
    color: COLORS.text,
  },
  saveButtonContainer: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    borderRadius: 30,
    marginHorizontal: 20,
  },
  saveButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 30,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default NewLeadScreen;
