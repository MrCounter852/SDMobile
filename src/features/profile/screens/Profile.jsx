import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useGlobal } from "../../../core/global";
import getEnvironmentConfig from "../../../config/environments";
import FocusAwareStatusBar from "../../../components/FocusAwareStatusBar";
import { COLORS } from "../../../core/theme";

const { width } = Dimensions.get("window");

const Perfil = ({ navigation }) => {
  const { user, logout } = useGlobal();

  const InfoCard = ({ icon, label, value }) => (
    <View style={styles.infoCard}>
      <View style={styles.infoCardIcon}>
        <Ionicons name={icon} size={20} color={COLORS.secondary} />
      </View>
      <View style={styles.infoCardContent}>
        <Text style={styles.infoCardLabel}>{label}</Text>
        <Text style={styles.infoCardValue} numberOfLines={1}>
          {value || "—"}
        </Text>
      </View>
    </View>
  );

  const ActionItem = ({ icon, label, onPress, danger = false }) => (
    <TouchableOpacity
      style={[styles.actionItem, danger && styles.actionItemDanger]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[styles.actionItemIcon, danger && styles.actionItemIconDanger]}
      >
        <Feather
          name={icon}
          size={20}
          color={danger ? "#EF4444" : COLORS.accent}
        />
      </View>
      <Text
        style={[styles.actionItemLabel, danger && styles.actionItemLabelDanger]}
      >
        {label}
      </Text>
      <Feather
        name="chevron-right"
        size={20}
        color={danger ? "#EF4444" : COLORS.lightGray}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FocusAwareStatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary, COLORS.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={["top"]}>
            <View style={styles.headerContent}>
              <View style={styles.headerPattern}>
                <View style={styles.patternCircle1} />
                <View style={styles.patternCircle2} />
                <View style={styles.patternCircle3} />
              </View>

              <View style={styles.avatarContainer}>
                {user.Foto ? (
                  <Image
                    source={{
                      uri: `${
                        getEnvironmentConfig().BASE_URL_NS
                      }/ArchivosCargados/FotografiasUsuarios/${user.Foto}`,
                    }}
                    style={styles.avatar}
                  />
                ) : (
                  <LinearGradient
                    colors={[COLORS.accent, COLORS.success]}
                    style={styles.avatarPlaceholder}
                  >
                    <Text style={styles.avatarInitial}>
                      {user.NombreCompleto
                        ? user.NombreCompleto.charAt(0).toUpperCase()
                        : "U"}
                    </Text>
                  </LinearGradient>
                )}
                <View style={styles.avatarBadge}>
                  <Ionicons name="checkmark" size={12} color="#FFF" />
                </View>
              </View>

              <Text style={styles.userName}>
                {user.NombreCompleto || "Usuario"}
              </Text>
              <View style={styles.roleContainer}>
                <Ionicons
                  name="shield-checkmark"
                  size={14}
                  color="rgba(255,255,255,0.85)"
                />
                <Text style={styles.userRole}>{user.Rol || "Usuario"}</Text>
              </View>
              <Text style={styles.userEmail}>
                {user.Email || "email@example.com"}
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons
              name="document-text-outline"
              size={22}
              color={COLORS.secondary}
            />
            <Text style={styles.statValue}>{user.TipoDocumento || "—"}</Text>
            <Text style={styles.statLabel}>Tipo Doc.</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="card-outline" size={22} color={COLORS.accent} />
            <Text style={styles.statValue} numberOfLines={1}>
              {user.Documento || "—"}
            </Text>
            <Text style={styles.statLabel}>Documento</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="call-outline" size={22} color={COLORS.success} />
            <Text style={styles.statValue}>{user.Celular || "—"}</Text>
            <Text style={styles.statLabel}>Celular</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Información Personal</Text>
          </View>
          <View style={styles.infoGrid}>
            <InfoCard
              icon="person"
              label="Primer Nombre"
              value={user.Nombres}
            />
            <InfoCard
              icon="person-outline"
              label="Segundo Nombre"
              value={user.Nombres2}
            />
            <InfoCard
              icon="people"
              label="Primer Apellido"
              value={user.Apellidos}
            />
            <InfoCard
              icon="people-outline"
              label="Segundo Apellido"
              value={user.Apellidos2}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Contacto</Text>
          </View>
          <View style={styles.infoGrid}>
            <InfoCard icon="mail" label="Email" value={user.Email} />
            <InfoCard
              icon="call"
              label="Teléfono"
              value={user.TelefonoEmpresa}
            />
            <InfoCard
              icon="phone-portrait"
              label="Celular"
              value={user.Celular}
            />
            <InfoCard
              icon="location"
              label="Dirección"
              value={user.DireccionEmpresa}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="settings-outline"
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.sectionTitle}>Opciones</Text>
          </View>
          <View style={styles.actionsCard}>
            <ActionItem
              icon="settings"
              label="Configuración"
              onPress={() => navigation.navigate("Settings")}
            />
            <View style={styles.actionDivider} />
            <ActionItem
              icon="log-out"
              label="Cerrar Sesión"
              onPress={logout}
              danger
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>SediMobile v0.1.0-alpha.1</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default Perfil;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  headerGradient: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  headerContent: {
    paddingTop: 16,
    paddingBottom: 48,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  headerPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -60,
    right: -40,
  },
  patternCircle2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -30,
    left: -30,
  },
  patternCircle3: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(136,231,130,0.15)",
    top: 40,
    left: 50,
  },

  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.35)",
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.35)",
  },
  avatarInitial: {
    fontSize: 44,
    fontWeight: "700",
    color: "#FFF",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.highlight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },

  userName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 6,
    textAlign: "center",
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  userRole: {
    fontSize: 13,
    color: "rgba(255,255,255,0.95)",
    fontWeight: "500",
    marginLeft: 6,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },

  statsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: -28,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
    marginTop: 8,
    marginBottom: 4,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.lightGray,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 4,
  },

  section: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.dark,
    marginLeft: 10,
  },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  infoCard: {
    width: (width - 52) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    margin: 6,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  infoCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0,134,200,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardLabel: {
    fontSize: 11,
    color: COLORS.lightGray,
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoCardValue: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: "600",
  },

  actionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
  },
  actionItemDanger: {
    backgroundColor: "#FEF2F2",
  },
  actionItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0,172,196,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  actionItemIconDanger: {
    backgroundColor: "#FEE2E2",
  },
  actionItemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
  },
  actionItemLabelDanger: {
    color: "#EF4444",
  },
  actionDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 76,
  },

  footer: {
    marginTop: 40,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#CBD5E1",
    fontWeight: "500",
  },
});
