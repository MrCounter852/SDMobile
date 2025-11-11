import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobal } from "../../core/global";

const Perfil = ({ navigation }) => {
  const { user, logout } = useGlobal();
  const { width } = Dimensions.get("window");

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f2f4f6" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <Image
              style={styles.backgroundImage}
              source={require("../../assets/images/back3.png")}
            />
            {user.Foto ? (
              <Image
                source={{
                  uri: `https://ns2.sedierp.com/ArchivosCargados/FotografiasUsuarios/${user.Foto}`,
                }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.initialContainer}>
                <Text style={styles.initialText}>
                  {user.NombreCompleto
                    ? user.NombreCompleto.charAt(0).toUpperCase()
                    : "U"}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.name}>{user.NombreCompleto || "Usuario"}</Text>
          <Text style={styles.email}>{user.Email || "email@example.com"}</Text>
        </View>
        <View style={styles.dataContainer}>
          <Text style={styles.sectionTitle}>Datos generales del usuario</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Tipo documento</Text>
            <Text style={styles.fieldValue}>{user.TipoDocumento}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Documento</Text>
            <Text style={styles.fieldValue}>{user.Documento}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Email - Usuario</Text>
            <Text style={styles.fieldValue}>{user.Email}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Tipo de usuario</Text>
            <Text style={styles.fieldValue}>{user.Rol}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Primer nombre</Text>
            <Text style={styles.fieldValue}>{user.Nombres}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Segundo nombre</Text>
            <Text style={styles.fieldValue}>
              {user.Nombres2 || "Ingrese nombres"}
            </Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Primer apellido</Text>
            <Text style={styles.fieldValue}>{user.Apellidos}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Segundo apellido</Text>
            <Text style={styles.fieldValue}>
              {user.Apellidos2 || "Ingrese apellidos"}
            </Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Dirección</Text>
            <Text style={styles.fieldValue}>{user.DireccionEmpresa}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Teléfono</Text>
            <Text style={styles.fieldValue}>{user.TelefonoEmpresa}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Celular</Text>
            <Text style={styles.fieldValue}>{user.Celular}</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={() => logout()}
            style={styles.logoutButton}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Perfil;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f4f6",
    position: "relative",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 40,
    paddingBottom: 32,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
  },
  profileImageContainer: {
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: 240,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#d0d7de",
  },
  initialContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#bfc9cf",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#d8dee3",
  },
  initialText: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "700",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2c3e50",
    marginTop: 6,
    textAlign: "center",
  },
  email: {
    fontSize: 14,
    color: "#6b7a83",
    textAlign: "center",
    marginTop: 4,
  },
  actionsContainer: {
    paddingHorizontal: 10,
    marginTop: 30,
  },
  logoutButton: {
    backgroundColor: "transparent",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#c0392b",
  },
  logoutButtonText: {
    color: "#c0392b",
    fontSize: 16,
    fontWeight: "600",
  },
  dataContainer: {
    marginTop: 30,
    paddingHorizontal: 30,

  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 20,
    textAlign: "center",
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e8ed",
  },
  fieldLabel: {
    fontSize: 14,
    color: "#6b7a83",
    flex: 1,
  },
  fieldValue: {
    fontSize: 14,
    color: "#2c3e50",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
});
