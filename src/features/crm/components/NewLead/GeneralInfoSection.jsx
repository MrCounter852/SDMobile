import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, CustomInput, SectionHeader } from "../FormComponents";
import CustomModalPicker from "../../../../components/shared/CustomModalPicker";

const GeneralInfoSection = ({
  form,
  setForm,
  staticErrors,
  setStaticErrors,
  loadOrigenes,
  loadCiudades,
  loadFormasContacto,
  loadFormasConocio,
  loadFormasConocioDetalle,
}) => {
  return (
    <View style={styles.card}>
      <SectionHeader
        title="Información General"
        icon="information-circle-outline"
      />

      <CustomModalPicker
        label="Tipo de contacto"
        required
        selectedValue={form.OrigenPreContactoID}
        displayValue={form.OrigenPreContactoNombre}
        onValueChange={(value) => {
          setForm({
            ...form,
            OrigenPreContactoID: value ? Number(value) : "",
          });
          if (staticErrors.OrigenPreContactoID) {
            setStaticErrors((prev) => ({
              ...prev,
              OrigenPreContactoID: false,
            }));
          }
        }}
        onLoadData={loadOrigenes}
        placeholder="Selecciona el origen"
        hasSearch={false}
        error={staticErrors.OrigenPreContactoID}
      />

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <CustomInput
            label="Nombres"
            required
            value={form.Nombres}
            onChangeText={(t) => {
              setForm({ ...form, Nombres: t });
              if (staticErrors.Nombres)
                setStaticErrors((prev) => ({ ...prev, Nombres: false }));
            }}
            placeholder="Nombres"
            error={staticErrors.Nombres}
          />
        </View>
        <View style={{ flex: 1 }}>
          <CustomInput
            label="Apellidos"
            required
            value={form.Apellidos}
            onChangeText={(t) => {
              setForm({ ...form, Apellidos: t });
              if (staticErrors.Apellidos)
                setStaticErrors((prev) => ({ ...prev, Apellidos: false }));
            }}
            placeholder="Apellidos"
            error={staticErrors.Apellidos}
          />
        </View>
      </View>

      <CustomInput
        label="Celular"
        required
        value={form.Celular}
        onChangeText={(t) => {
          setForm({ ...form, Celular: t });
          if (staticErrors.Celular)
            setStaticErrors((prev) => ({ ...prev, Celular: false }));
        }}
        placeholder="Celular"
        keyboardType="phone-pad"
        error={staticErrors.Celular}
      />

      <CustomInput
        label="Email"
        value={form.Email}
        onChangeText={(t) => setForm({ ...form, Email: t })}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {form.OrigenPreContactoID == 7 && (
        <>
          <CustomModalPicker
            label="Ciudad"
            required
            selectedValue={form.CiudadID}
            displayValue={form.CiudadNombre}
            onValueChange={(value) => {
              setForm({ ...form, CiudadID: value });
              if (staticErrors.CiudadID) {
                setStaticErrors((prev) => ({ ...prev, CiudadID: false }));
              }
            }}
            onLoadData={loadCiudades}
            placeholder="Selecciona ciudad"
            error={staticErrors.CiudadID}
          />
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "500",
                color: "#6B7280",
                marginBottom: 8,
              }}
            >
              Dirección <Text style={{ color: COLORS.danger }}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                {
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
                staticErrors.Direccion && { borderColor: COLORS.danger },
              ]}
              onPress={() => {}}
            >
              <Text
                style={[
                  { fontSize: 15 },
                  !form.Direccion && { color: "#6B7280" },
                ]}
              >
                {form.Direccion || "Click para ingresar dirección..."}
              </Text>
              <Ionicons
                name="location-outline"
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>
        </>
      )}

      <CustomModalPicker
        label="Forma de contacto"
        required
        selectedValue={form.FormaContactoID}
        displayValue={form.FormaContactoNombre}
        onValueChange={(value) => {
          setForm({ ...form, FormaContactoID: value });
          if (staticErrors.FormaContactoID) {
            setStaticErrors((prev) => ({ ...prev, FormaContactoID: false }));
          }
        }}
        onLoadData={loadFormasContacto}
        placeholder="Selecciona forma de contacto"
        error={staticErrors.FormaContactoID}
      />

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <CustomModalPicker
            label="¿Cómo nos conoció?"
            required
            selectedValue={form.FormaComoNosConocioID}
            displayValue={form.FormaComoNosConocioNombre}
            onValueChange={(value) => {
              setForm({
                ...form,
                FormaComoNosConocioID: value,
                FormaComoNosConocioDetalleID: "",
              });
              if (staticErrors.FormaComoNosConocioID) {
                setStaticErrors((prev) => ({
                  ...prev,
                  FormaComoNosConocioID: false,
                }));
              }
              loadFormasConocioDetalle(value);
            }}
            onLoadData={loadFormasConocio}
            placeholder="Seleccionar..."
            error={staticErrors.FormaComoNosConocioID}
          />
        </View>
        <View style={{ flex: 1 }}>
          <CustomModalPicker
            label="Detalle"
            selectedValue={form.FormaComoNosConocioDetalleID}
            displayValue={form.FormaComoNosConocioDetalleNombre}
            onValueChange={(value) =>
              setForm({ ...form, FormaComoNosConocioDetalleID: value })
            }
            onLoadData={() =>
              loadFormasConocioDetalle(form.FormaComoNosConocioID)
            }
            placeholder="Seleccionar..."
            enabled={!!form.FormaComoNosConocioID}
          />
        </View>
      </View>

      <CustomInput
        label="Palabra de búsqueda (Google/Social)"
        value={form.PalabraBusqueda}
        onChangeText={(t) => setForm({ ...form, PalabraBusqueda: t })}
        placeholder="Ej: Apartamento en venta"
      />
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
};

export default GeneralInfoSection;
