import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import useGlobal from "../../../core/global";
import ExpandableDropdown from "../../../components/shared/SearchableDropdownModal";
import FocusAwareStatusBar from "../../../components/FocusAwareStatusBar";
import {
  loginUser,
  fetchEmpresas,
  getOauthToken,
  getSessionData,
} from "../services/authService";

const { width } = Dimensions.get("window");

// Paleta de colores de la marca
const COLORS = {
  primary: "#337ab7",
  secondary: "#0086C8",
  accent: "#00ACC4",
  success: "#00CDA7",
  highlight: "#88E782",
  dark: "#1E293B",
  gray: "#64748B",
  lightGray: "#94A3B8",
  background: "#F8FAFC",
  white: "#FFFFFF",
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("login");
  const [empresas, setEmpresas] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [selectedSucursal, setSelectedSucursal] = useState(null);
  const [loginData, setLoginData] = useState(null);
  const [empresasLoading, setEmpresasLoading] = useState(false);
  const login = useGlobal((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor ingresa tu email y contraseña");
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser(email, password);
      setLoginData(result);
      setEmpresasLoading(true);
      const empresas = await fetchEmpresas(result.token, "");
      setEmpresas(empresas);
      setEmpresasLoading(false);
      setStep("selection");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
    setLoading(false);
  };

  const handleEmpresaSearch = async (text) => {
    if (text.length >= 3 || text === "") {
      setEmpresasLoading(true);
      try {
        const empresas = await fetchEmpresas(loginData.token, text);
        setEmpresas(empresas);
      } catch (error) {
        Alert.alert("Error", error.message);
      }
      setEmpresasLoading(false);
    }
  };

  const handleBack = () => {
    setStep("login");
    setSelectedEmpresa(null);
    setSelectedSucursal(null);
    setEmpresas([]);
    setLoginData(null);
  };

  const handleStartSession = async () => {
    setLoading(true);
    try {
      const oauthData = await getOauthToken(
        loginData.token,
        selectedEmpresa.BaseDatosID,
        selectedEmpresa.EmpresaID,
        selectedSucursal.SucursalID,
      );
      await SecureStore.setItemAsync("accessToken", oauthData.accessToken);
      await SecureStore.setItemAsync("erpToken", oauthData.accessToken);
      try {
        const sessionData = await getSessionData(oauthData.accessToken);
        const usuarioID = sessionData.Session?.Usuario?.UsuarioID;
        const rolID = sessionData.Session?.Usuario?.RolID;
        const user = sessionData.Session?.Usuario || {};
        const accesos = sessionData.Session?.Accesos || [];
        login({
          user: {
            email: loginData.user.email,
            ...user,
            Token: user.Token,
            CDNEndPoint: user.CDNEndPoint,
            CDNLlavePublica: user.CDNLlavePublica,
            CDNLlavePrivada: user.CDNLlavePrivada,
          },
          usuarioID,
          rolID,
          empresa: selectedEmpresa,
          sucursal: selectedSucursal,
          accesos,
        });
        await SecureStore.setItemAsync(
          "usuarioID",
          usuarioID?.toString() || "",
        );
        await SecureStore.setItemAsync("rolID", rolID?.toString() || "");
      } catch (error) {
        console.error("Error fetching session:", error);
        login({
          user: { email: loginData.user.email },
          empresa: selectedEmpresa,
          sucursal: selectedSucursal,
        });
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
    setLoading(false);
  };

  // Step 1: Login Form
  const renderLoginStep = () => (
    <View style={styles.formCard}>
      {/* Header decorativo */}
      <View style={styles.cardHeader}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary, COLORS.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardHeaderGradient}
        >
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
          <Ionicons name="lock-closed" size={40} color="#FFF" />
        </LinearGradient>
      </View>

      <View style={styles.formContent}>
        <Image
          source={require("../../../assets/images/logos/SEDI_ERP.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.welcomeTitle}>Bienvenido</Text>
        <Text style={styles.welcomeSubtitle}>
          Ingresa tus credenciales para continuar
        </Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputIconContainer}>
            <Ionicons name="mail-outline" size={20} color={COLORS.secondary} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.lightGray}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputIconContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={COLORS.secondary}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor={COLORS.lightGray}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={COLORS.gray}
            />
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.9}
          style={styles.buttonWrapper}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>CONTINUAR</Text>
                <Feather name="arrow-right" size={20} color="#FFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Step 2: Company Selection
  const renderSelectionStep = () => (
    <View style={styles.formCard}>
      {/* Header decorativo */}
      <View style={styles.cardHeader}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary, COLORS.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardHeaderGradient}
        >
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
          <Ionicons name="business" size={40} color="#FFF" />
        </LinearGradient>
      </View>

      <View style={styles.formContent}>
        <Image
          source={
            selectedEmpresa
              ? { uri: selectedEmpresa.Logo }
              : require("../../../assets/images/logos/SEDI_ERP.png")
          }
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.welcomeTitle}>Selecciona tu empresa</Text>
        <Text style={styles.welcomeSubtitle}>
          Elige la empresa y sucursal para iniciar
        </Text>

        {/* Empresa Dropdown */}
        <View style={styles.dropdownSection}>
          <View style={styles.dropdownLabel}>
            <Ionicons
              name="business-outline"
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.dropdownLabelText}>Empresa</Text>
          </View>
          <ExpandableDropdown
            title="Seleccionar empresa"
            items={empresas}
            selectedItem={selectedEmpresa}
            onSelect={(empresa) => {
              setSelectedEmpresa(empresa);
              setSelectedSucursal(null);
            }}
            hasSearch={true}
            onSearch={handleEmpresaSearch}
            placeholder="Buscar empresa"
            loading={empresasLoading}
          />
        </View>

        {/* Sucursal Dropdown */}
        {selectedEmpresa && (
          <View style={styles.dropdownSection}>
            <View style={styles.dropdownLabel}>
              <Ionicons
                name="location-outline"
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.dropdownLabelText}>Sucursal</Text>
            </View>
            <ExpandableDropdown
              title="Seleccionar sucursal"
              items={selectedEmpresa ? selectedEmpresa.Sucursales : []}
              selectedItem={selectedSucursal}
              onSelect={setSelectedSucursal}
              hasSearch={false}
              placeholder="Buscar sucursal"
              loading={false}
            />
          </View>
        )}

        {/* Buttons */}
        {selectedSucursal && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.8}
              style={styles.secondaryButtonWrapper}
            >
              <View style={styles.secondaryButton}>
                <Feather name="arrow-left" size={18} color={COLORS.primary} />
                <Text style={styles.secondaryButtonText}>Atrás</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleStartSession}
              disabled={loading}
              activeOpacity={0.9}
              style={styles.primaryButtonWrapper}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonSmall}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Iniciar</Text>
                    <Feather name="log-in" size={18} color="#FFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FocusAwareStatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
      />

      {/* Background decoration */}
      <View style={styles.backgroundDecoration}>
        <LinearGradient
          colors={[`${COLORS.primary}15`, `${COLORS.accent}10`, "transparent"]}
          style={styles.backgroundGradient}
        />
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior="padding" style={styles.flexOne}>
            <ScrollView
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Step indicator */}
              <View style={styles.stepIndicator}>
                <View
                  style={[
                    styles.stepDot,
                    step === "login" && styles.stepDotActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumber,
                      step === "login" && styles.stepNumberActive,
                    ]}
                  >
                    1
                  </Text>
                </View>
                <View style={styles.stepLine} />
                <View
                  style={[
                    styles.stepDot,
                    step === "selection" && styles.stepDotActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumber,
                      step === "selection" && styles.stepNumberActive,
                    ]}
                  >
                    2
                  </Text>
                </View>
              </View>

              {step === "login" ? renderLoginStep() : renderSelectionStep()}

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>SediMobile v0.1.0-alpha.1</Text>
                <Text style={styles.footerSubtext}>
                  © 2026 SEDI ERP - Todos los derechos reservados
                </Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Background decoration
  backgroundDecoration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 400,
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 400,
  },
  bgCircle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: `${COLORS.success}10`,
    top: -100,
    right: -100,
  },
  bgCircle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: `${COLORS.primary}08`,
    top: 150,
    left: -80,
  },

  // Step indicator
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.lightGray,
  },
  stepNumberActive: {
    color: COLORS.white,
  },
  stepLine: {
    width: 60,
    height: 3,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 8,
    borderRadius: 2,
  },

  // Form Card
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  cardHeader: {
    height: 100,
    overflow: "hidden",
  },
  cardHeaderGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  decorativeCircle1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
    top: -40,
    right: -20,
  },
  decorativeCircle2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.08)",
    bottom: -30,
    left: 20,
  },
  formContent: {
    padding: 28,
    alignItems: "center",
  },

  // Logo & titles
  logo: {
    width: 120,
    height: 80,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 8,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: 28,
  },

  // Input styles
  inputContainer: {
    width: "100%",
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputIconContainer: {
    width: 50,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: COLORS.dark,
    paddingRight: 16,
  },
  eyeButton: {
    paddingHorizontal: 16,
    height: "100%",
    justifyContent: "center",
  },

  // Buttons
  buttonWrapper: {
    width: "100%",
    marginTop: 8,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Dropdown section
  dropdownSection: {
    width: "100%",
    marginBottom: 16,
  },
  dropdownLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  dropdownLabelText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
  },

  // Button row
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    marginTop: 16,
    gap: 12,
  },
  secondaryButtonWrapper: {
    flex: 1,
  },
  primaryButtonWrapper: {
    flex: 1,
  },
  secondaryButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  primaryButtonSmall: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  // Footer
  footer: {
    marginTop: 40,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: "600",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: COLORS.lightGray,
  },
});

export default Login;
