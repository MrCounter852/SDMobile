import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, CustomInput, SectionHeader } from "../FormComponents";
import CustomModalPicker from "../../../../components/shared/CustomModalPicker";
import DynamicForm from "../DynamicForm";

const ClientDetailSection = ({
  form,
  setForm,
  staticErrors,
  setStaticErrors,
  detailLabel,
  detailTitle,
  loadTiposDocumento,
  loadTiposPersona,
  loadResponsabilidades,
  handleTipoPersonaChange,
  isEmpresa,
  fiscalFormRef,
  formConfig,
}) => {
  return (
    <>
      <TouchableOpacity
        style={styles.switchRow}
        onPress={() =>
          setForm((p) => ({ ...p, DetallarCliente: !p.DetallarCliente }))
        }
      >
        <Ionicons
          name={form.DetallarCliente ? "checkbox" : "square-outline"}
          size={24}
          color={COLORS.primary}
        />
        <Text style={styles.switchLabel}>Detallar {detailLabel}</Text>
      </TouchableOpacity>

      {form.DetallarCliente && (
        <View style={styles.card}>
          <SectionHeader title={detailTitle} icon="person-circle-outline" />

          <CustomModalPicker
            label="Tipo de documento"
            required
            selectedValue={form.ClienteTipoDocumentoID}
            onValueChange={(value) => {
              setForm({ ...form, ClienteTipoDocumentoID: value });
              if (staticErrors.ClienteTipoDocumentoID) {
                setStaticErrors((prev) => ({
                  ...prev,
                  ClienteTipoDocumentoID: false,
                }));
              }
            }}
            onLoadData={loadTiposDocumento}
            placeholder="Seleccionar..."
            error={staticErrors.ClienteTipoDocumentoID}
          />

          <CustomInput
            label="Número de documento"
            required
            value={form.ClienteDocumento}
            onChangeText={(t) => {
              setForm({ ...form, ClienteDocumento: t });
              if (staticErrors.ClienteDocumento) {
                setStaticErrors((prev) => ({
                  ...prev,
                  ClienteDocumento: false,
                }));
              }
            }}
            placeholder="Documento"
            keyboardType="numeric"
            error={staticErrors.ClienteDocumento}
          />

          <CustomModalPicker
            label="Tipo de persona"
            required
            selectedValue={form.ClienteTipoPersonaID}
            onValueChange={(value) => {
              handleTipoPersonaChange(value);
              if (staticErrors.ClienteTipoPersonaID) {
                setStaticErrors((prev) => ({
                  ...prev,
                  ClienteTipoPersonaID: false,
                }));
              }
            }}
            onLoadData={loadTiposPersona}
            placeholder="Seleccionar..."
            error={staticErrors.ClienteTipoPersonaID}
          />

          {isEmpresa ? (
            <>
              <CustomInput
                label="Razón Social"
                required
                value={form.ClienteNombreRazonSocial}
                onChangeText={(t) => {
                  setForm({ ...form, ClienteNombreRazonSocial: t });
                  if (staticErrors.ClienteNombreRazonSocial) {
                    setStaticErrors((prev) => ({
                      ...prev,
                      ClienteNombreRazonSocial: false,
                    }));
                  }
                }}
                placeholder="Nombre de la empresa"
                error={staticErrors.ClienteNombreRazonSocial}
              />
              <CustomModalPicker
                label="Responsabilidad Tributaria"
                selectedValue={form.ClienteResponsabilidadTributariaID}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    ClienteResponsabilidadTributariaID: value,
                  })
                }
                onLoadData={loadResponsabilidades}
                placeholder="Seleccionar..."
              />
            </>
          ) : (
            <>
              <View style={styles.row}>
                <View style={styles.flexHalf}>
                  <CustomInput
                    label="Primer Nombre"
                    required
                    value={form.ClienteNombres}
                    onChangeText={(t) => {
                      setForm({ ...form, ClienteNombres: t });
                      if (staticErrors.ClienteNombres) {
                        setStaticErrors((prev) => ({
                          ...prev,
                          ClienteNombres: false,
                        }));
                      }
                    }}
                    placeholder="Nombre"
                    error={staticErrors.ClienteNombres}
                  />
                </View>
                <View style={styles.flexHalf}>
                  <CustomInput
                    label="Segundo Nombre"
                    value={form.ClienteNombres2}
                    onChangeText={(t) =>
                      setForm({ ...form, ClienteNombres2: t })
                    }
                    placeholder="Segundo Nombre"
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.flexHalf}>
                  <CustomInput
                    label="Primer Apellido"
                    required
                    value={form.ClienteApellidos}
                    onChangeText={(t) => {
                      setForm({ ...form, ClienteApellidos: t });
                      if (staticErrors.ClienteApellidos) {
                        setStaticErrors((prev) => ({
                          ...prev,
                          ClienteApellidos: false,
                        }));
                      }
                    }}
                    placeholder="Apellido"
                    error={staticErrors.ClienteApellidos}
                  />
                </View>
                <View style={styles.flexHalf}>
                  <CustomInput
                    label="Segundo Apellido"
                    value={form.ClienteApellidos2}
                    onChangeText={(t) =>
                      setForm({ ...form, ClienteApellidos2: t })
                    }
                    placeholder="Segundo Apellido"
                  />
                </View>
              </View>
            </>
          )}

          <View style={styles.row}>
            <View style={styles.flexHalf}>
              <CustomInput
                label="Celular"
                value={form.ClienteCelular}
                onChangeText={(t) => setForm({ ...form, ClienteCelular: t })}
                placeholder="Celular"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.flexHalf}>
              <CustomInput
                label="Teléfono"
                value={form.ClienteTelefono}
                onChangeText={(t) => setForm({ ...form, ClienteTelefono: t })}
                placeholder="Teléfono"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <CustomInput
            label="Dirección"
            value={form.ClienteDireccion}
            onChangeText={(t) => setForm({ ...form, ClienteDireccion: t })}
            placeholder="Dirección del cliente"
          />

          <CustomInput
            label="Email"
            value={form.ClienteEmail}
            onChangeText={(t) => setForm({ ...form, ClienteEmail: t })}
            placeholder="Email principal"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <CustomInput
            label="Email Facturación Electrónica"
            value={form.ClienteEmailFacturacionElectronica}
            onChangeText={(t) =>
              setForm({ ...form, ClienteEmailFacturacionElectronica: t })
            }
            placeholder="Email facturación"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <DynamicForm
            ref={fiscalFormRef}
            config={formConfig}
            initialValues={form}
            onStateChange={(newState) =>
              setForm((prev) => ({ ...prev, ...newState }))
            }
            filter={(f) =>
              f &&
              f.NombreCampo &&
              f.NombreCampo.startsWith("Cliente") &&
              ![
                "ClienteTipoDocumentoID",
                "ClienteDocumento",
                "ClienteTipoPersonaID",
                "ClienteNombres",
                "ClienteNombres2",
                "ClienteApellidos",
                "ClienteApellidos2",
                "ClienteDireccion",
                "ClienteTelefono",
                "ClienteCelular",
                "ClienteEmail",
                "ClienteEmailFacturacionElectronica",
                "ClienteResponsabilidadTributariaID",
                "ClienteNombreRazonSocial",
              ].includes(f.NombreCampo)
            }
            dataLoaders={{
              ClienteTipoDocumentoID: loadTiposDocumento,
              ClienteTipoPersonaID: loadTiposPersona,
              ClienteResponsabilidadTributariaID: loadResponsabilidades,
            }}
          />
        </View>
      )}
    </>
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
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  switchLabel: {
    marginLeft: 10,
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
  },
};

export default ClientDetailSection;
