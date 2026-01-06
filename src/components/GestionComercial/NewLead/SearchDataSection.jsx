import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, CustomInput, SectionHeader } from "../FormComponents";
import CustomModalPicker from "../../../assets/common/CustomModalPicker";
import DynamicForm from "../DynamicForm";

const SearchDataSection = ({
  form,
  setForm,
  staticErrors,
  setStaticErrors,
  loadAsesores,
  loadTiposOferta,
  loadCondicionesInmueble,
  loadTiposInmueble,
  loadAntiguedades,
  loadTiposAvaluo,
  loadLocalidades,
  loadCiudades,
  loadTiposProductos,
  loadFormasContacto,
  loadFormasConocio,
  loadFormasConocioDetalle,
  loadTiposDocumento,
  loadTiposPersona,
  loadResponsabilidades,
  setShowInmuebleModal,
  renderEstratoSlot,
  renderLocalidadSlot,
  mainFormRef,
  formConfig,
  procesosServiciosIniciales,
  addServicios,
  removeServicios,
  servicio,
  setServicio,
}) => {
  return (
    <View style={styles.card}>
      <SectionHeader title="Datos de Búsqueda" icon="search-circle-outline" />

      <View style={styles.row}>
        <View style={styles.flexHalf}>
          <CustomModalPicker
            label="Asesor"
            required
            selectedValue={form.AsesorID}
            onValueChange={(value) => {
              setForm({ ...form, AsesorID: value });
              if (staticErrors.AsesorID) {
                setStaticErrors((prev) => ({ ...prev, AsesorID: false }));
              }
            }}
            onLoadData={loadAsesores}
            placeholder="Selecciona asesor"
            error={staticErrors.AsesorID}
          />
        </View>
        <View style={styles.flexHalf}>
          <CustomInput
            label="Teléfono"
            value={form.Telefono}
            onChangeText={(t) => setForm({ ...form, Telefono: t })}
            placeholder="Teléfono fijo"
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {(form.OrigenPreContactoID == 4 || form.OrigenPreContactoID == 5) && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Inmueble de interés</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => setShowInmuebleModal(true)}
          >
            <Text style={styles.selectBoxText}>
              {form.InmuebleNombre ||
                (form.InmuebleID
                  ? `Inmueble #${form.InmuebleID}`
                  : "Seleccionar inmueble...")}
            </Text>
            <Ionicons name="search" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      )}

      {(form.OrigenPreContactoID == 2 || form.OrigenPreContactoID == 4) && (
        <View style={styles.row}>
          <View style={styles.flexHalf}>
            <CustomModalPicker
              label="Tipo de oferta"
              required
              selectedValue={form.TipoOfertaID}
              onValueChange={(v) => setForm({ ...form, TipoOfertaID: v })}
              onLoadData={loadTiposOferta}
              placeholder="Seleccionar..."
            />
          </View>
          <View style={styles.flexHalf}>
            <CustomModalPicker
              label="Condición inmueble"
              required={form.OrigenPreContactoID != 2}
              selectedValue={form.CondicionInmuebleID}
              onValueChange={(v) =>
                setForm({ ...form, CondicionInmuebleID: v })
              }
              onLoadData={loadCondicionesInmueble}
              placeholder="Seleccionar..."
            />
          </View>
        </View>
      )}

      {form.OrigenPreContactoID == 2 ||
      form.OrigenPreContactoID == 4 ||
      form.OrigenPreContactoID == 5 ? (
        <View style={styles.row}>
          <View style={styles.flexHalf}>
            <CustomModalPicker
              label="Tipo de inmueble"
              required
              selectedValue={form.TipoInmuebleID}
              onValueChange={(v) => setForm({ ...form, TipoInmuebleID: v })}
              onLoadData={loadTiposInmueble}
              placeholder="Seleccionar..."
            />
          </View>
          <View style={styles.flexHalf}>
            <CustomModalPicker
              label="Antigüedad"
              required={form.OrigenPreContactoID != 2}
              selectedValue={form.AntiguedadInmuebleID}
              onValueChange={(v) =>
                setForm({ ...form, AntiguedadInmuebleID: v })
              }
              onLoadData={loadAntiguedades}
              placeholder="Seleccionar..."
            />
          </View>
        </View>
      ) : form.OrigenPreContactoID == 7 ? (
        <CustomModalPicker
          label="Tipo de inmueble"
          required
          selectedValue={form.TipoInmuebleID}
          onValueChange={(v) => setForm({ ...form, TipoInmuebleID: v })}
          onLoadData={loadTiposInmueble}
          placeholder="Seleccionar..."
        />
      ) : null}

      {/* Area (Desde - Hasta) & Rooms/Parking */}
      {form.OrigenPreContactoID == 4 && (
        <>
          <View style={styles.row}>
            <View style={styles.flexHalf}>
              <Text style={styles.label}>Área (m2)</Text>
              <View style={{ flexDirection: "row", gap: 5 }}>
                <View style={styles.miniInputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Min"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="numeric"
                    value={form.AreaDesde}
                    onChangeText={(t) => setForm({ ...form, AreaDesde: t })}
                  />
                </View>
                <View style={styles.miniInputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Max"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="numeric"
                    value={form.AreaHasta}
                    onChangeText={(t) => setForm({ ...form, AreaHasta: t })}
                  />
                </View>
              </View>
            </View>
            <View style={styles.flexHalf}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <CustomInput
                    label="Habita."
                    value={form.Cantidadhabitaciones}
                    onChangeText={(t) =>
                      setForm({ ...form, Cantidadhabitaciones: t })
                    }
                    placeholder="#"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <CustomInput
                    label="Parq."
                    value={form.CantidadGarajes}
                    onChangeText={(t) =>
                      setForm({ ...form, CantidadGarajes: t })
                    }
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
              <View style={{ flexDirection: "row", gap: 5 }}>
                <View style={styles.miniInputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="$ Min"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="numeric"
                    value={form.PresupuestoDesde}
                    onChangeText={(t) =>
                      setForm({ ...form, PresupuestoDesde: t })
                    }
                  />
                </View>
                <View style={styles.miniInputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="$ Max"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="numeric"
                    value={form.PresupuestoHasta}
                    onChangeText={(t) =>
                      setForm({ ...form, PresupuestoHasta: t })
                    }
                  />
                </View>
              </View>
            </View>
            <View style={[styles.flexHalf, { flex: 0.5 }]}>
              <CustomInput
                label="Baños"
                value={form.CantidadBanos}
                onChangeText={(t) => setForm({ ...form, CantidadBanos: t })}
                placeholder="#"
                keyboardType="numeric"
              />
            </View>
          </View>
        </>
      )}

      {form.OrigenPreContactoID == 7 && (
        <CustomModalPicker
          label="Tipo de avalúo"
          required
          selectedValue={form.TipoAvaluoID}
          onValueChange={(v) => setForm({ ...form, TipoAvaluoID: v })}
          onLoadData={loadTiposAvaluo}
          placeholder="Seleccionar..."
        />
      )}

      {form.OrigenPreContactoID == 2 && (
        <CustomModalPicker
          label="Localidad"
          required
          selectedValue={form.LocalidadID}
          onValueChange={(v) => setForm({ ...form, LocalidadID: v })}
          onLoadData={loadLocalidades}
          placeholder="Seleccionar..."
        />
      )}

      {form.OrigenPreContactoID == 2 && (
        <>
          <CustomInput
            label="Dirección del inmueble"
            required
            value={form.Direccion}
            onChangeText={(t) => setForm({ ...form, Direccion: t })}
            placeholder="Dirección completa"
          />

          <CustomInput
            label="Área (m2)"
            required
            value={form.Area}
            onChangeText={(t) => setForm({ ...form, Area: t })}
            placeholder="Ej: 80"
            keyboardType="numeric"
          />
        </>
      )}

      {form.OrigenPreContactoID == 5 && (
        <CustomInput
          label="Área (m2)"
          value={form.Area}
          onChangeText={(t) => setForm({ ...form, Area: t })}
          placeholder="Ej: 80"
          keyboardType="numeric"
        />
      )}

      {form.OrigenPreContactoID == 4 && renderEstratoSlot()}
      {(form.OrigenPreContactoID == 4 || form.OrigenPreContactoID == 5) &&
        renderLocalidadSlot()}

      {form.OrigenPreContactoID == 4 && (
        <CustomInput
          label="Descripción Adicional Ubicación"
          value={form.InteresesUbicacion}
          onChangeText={(t) => setForm({ ...form, InteresesUbicacion: t })}
          placeholder="Barrio, cerca de..."
          multiline
        />
      )}

      {(form.OrigenPreContactoID == 2 ||
        form.OrigenPreContactoID == 4 ||
        form.OrigenPreContactoID == 5) && (
        <CustomInput
          label="Descripción Adicional Inmueble"
          value={form.DescripcionAdicional}
          onChangeText={(t) => setForm({ ...form, DescripcionAdicional: t })}
          placeholder="Estado, acabados..."
          multiline
        />
      )}

      <DynamicForm
        ref={mainFormRef}
        config={formConfig}
        initialValues={form}
        onStateChange={(newState) =>
          setForm((prev) => ({ ...prev, ...newState }))
        }
        filter={(f) =>
          f &&
          f.NombreCampo &&
          !f.NombreCampo.startsWith("Cliente") &&
          ![
            "Nombres",
            "Apellidos",
            "Celular",
            "Email",
            "Correo",
            "AsesorID",
            "FormaContactoID",
            "FormaComoNosConocioID",
            "FormaComoNosConocioDetalleID",
            "PalabraBusqueda",
            "InmuebleID",
            "Estrato",
            "LocalityID",
            "LocalidadID",
            "Localidades",
            "ProcesosInmobiliariaLocalidades",
            "TipoOfertaID",
            "CondicionInmuebleID",
            "TipoInmuebleID",
            "AntiguedadInmuebleID",
            "TipoAvaluoID",
            "CiudadID",
            "Area",
            "AreaDesde",
            "AreaHasta",
            "Cantidadhabitaciones",
            "CantidadGarajes",
            "PresupuestoDesde",
            "PresupuestoHasta",
            "CantidadBanos",
            "InteresesUbicacion",
            "DescripcionAdicional",
            "Observaciones",
            "DetallarCliente",
          ].includes(f.NombreCampo)
        }
        dataLoaders={{
          AsesorID: loadAsesores,
          TipoOfertaID: loadTiposOferta,
          CondicionInmuebleID: loadCondicionesInmueble,
          TipoInmuebleID: loadTiposInmueble,
          AntiguedadInmuebleID: loadAntiguedades,
          TipoAvaluoID: loadTiposAvaluo,
          LocalidadID: loadLocalidades,
          CiudadID: loadCiudades,
          FormaContactoID: loadFormasContacto,
          FormaComoNosConocioID: loadFormasConocio,
          FormaComoNosConocioDetalleID: loadFormasConocioDetalle,
          ClienteTipoDocumentoID: loadTiposDocumento,
          ClienteTipoPersonaID: loadTiposPersona,
          ClienteResponsabilidadTributariaID: loadResponsabilidades,
          TipoProductoID: loadTiposProductos,
        }}
      />

      {(form.OrigenPreContactoID == 1 || form.OrigenPreContactoID == 6) && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Servicios solicitados</Text>
          <View style={styles.row}>
            <View style={[styles.flexHalf, { flex: 3 }]}>
              <CustomModalPicker
                selectedValue={servicio.TipoProductoID}
                onValueChange={(v) => {
                  const selected = loadTiposProductos().find(
                    (t) => t.TipoProductoID === v || t.id === v
                  );
                  setServicio({
                    TipoProductoID: v,
                    Nombre: selected?.Nombre || "",
                  });
                }}
                onLoadData={loadTiposProductos}
                placeholder="Seleccione un servicio"
                hasSearch={true}
                searchPlaceholder="Buscar servicios..."
              />
            </View>
            <View
              style={[styles.flexHalf, { flex: 1, justifyContent: "center" }]}
            >
              <TouchableOpacity onPress={addServicios} style={styles.addButton}>
                <Ionicons name="add-circle" size={30} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
          {procesosServiciosIniciales.length > 0 && (
            <View style={styles.servicesList}>
              {procesosServiciosIniciales.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.serviceItem}
                  onPress={() => removeServicios(index)}
                >
                  <Text style={styles.serviceText}>{item.Nombre}</Text>
                  <Ionicons name="trash" size={20} color={COLORS.danger} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = {
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  flexHalf: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 8,
  },
  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    height: 50,
  },
  selectBoxText: {
    fontSize: 15,
    color: "#1F2937",
  },
  miniInputWrapper: {
    flex: 1,
    height: 50,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
    height: "100%",
  },
  addButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  servicesList: {
    marginTop: 10,
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    marginBottom: 5,
  },
  serviceText: {
    fontSize: 14,
    color: "#1F2937",
  },
};

export default SearchDataSection;
