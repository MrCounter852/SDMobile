import React from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { CustomInput, COLORS } from "./FormComponents";
import CustomModalPicker from "../../../components/shared/CustomModalPicker";

const DynamicField = ({ config, value, onChange, onLoadData, error }) => {
  if (!config) return null;

  const {
    NombreVisual,
    NombreCampo,
    TipoCampo,
    TipoDatoID,
    Requerido,
    Placeholder,
    EsLista,
    ArrayLista,
  } = config;

  if (TipoDatoID === 6 || EsLista) {
    const loadData = ArrayLista
      ? () => Promise.resolve(ArrayLista)
      : onLoadData || (() => Promise.resolve([]));

    return (
      <CustomModalPicker
        label={NombreVisual}
        required={Requerido}
        selectedValue={value}
        onValueChange={onChange}
        placeholder={Placeholder || "Seleccione..."}
        onLoadData={loadData}
        hasSearch={true}
        error={error}
      />
    );
  }

  if (TipoDatoID === 7 || TipoCampo === "Boolean" || TipoCampo === "Bit") {
    return (
      <View style={styles.switchContainer}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{NombreVisual}</Text>
          {Requerido && <Text style={styles.required}>*</Text>}
        </View>
        <Switch
          value={!!value}
          onValueChange={onChange}
          trackColor={{ false: "#D1D5DB", true: COLORS.secondary }}
          thumbColor={value ? COLORS.primary : "#F3F4F6"}
        />
      </View>
    );
  }

  const isNumeric =
    TipoDatoID === 2 ||
    TipoDatoID === 3 ||
    TipoCampo === "Integer" ||
    TipoCampo === "Decimal" ||
    TipoCampo === "Number";

  const isTextArea =
    TipoDatoID === 5 || TipoCampo === "Memo" || TipoCampo === "TextoLargo";

  return (
    <CustomInput
      label={NombreVisual}
      required={Requerido}
      value={value}
      onChangeText={onChange}
      placeholder={
        Placeholder ||
        (isNumeric ? "0" : `Ingrese ${NombreVisual.toLowerCase()}`)
      }
      keyboardType={isNumeric ? "numeric" : "default"}
      multiline={isTextArea}
      error={error}
    />
  );
};

const styles = StyleSheet.create({
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  required: {
    color: COLORS.danger,
    marginLeft: 4,
    fontSize: 14,
  },
});

export default DynamicField;
