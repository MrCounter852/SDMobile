import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, FlatList, Dimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useGlobal from '../../core/global';

const { width } = Dimensions.get('window');
const numColumns = 2;
const itemWidth = (width - 40) / numColumns - 10;

const getIconName = (icon) => {
const iconMap = {
  // Sistema / Configuración
  'fal fa-cogs': 'settings-outline',
  'fal fa-cog': 'cog-outline',
  'fal fa-sliders-v': 'options-outline',
  'fal fa-wrench': 'construct-outline',
  'fal fa-server': 'server-outline',

  // Usuarios y seguridad
  'fal fa-user-alt': 'person-outline',
  'fal fa-user-circle': 'person-circle-outline',
  'fal fa-key': 'key-outline',
  'fal fa-lock-alt': 'lock-closed-outline',

  // Ubicación y entorno
  'fal fa-map-marker-alt': 'location-outline',
  'fal fa-map-pin': 'pin-outline',
  'fal fa-globe': 'globe-outline',
  'fal fa-plane': 'airplane-outline',
  'fal fa-language': 'language-outline',
  'fal fa-sun': 'sunny-outline',

  // Negocios / ERP General
  'fal fa-handshake': 'handshake-outline', // CRM
  'fal fa-envelope': 'mail-outline', // Servicio al Cliente
  'fal fa-chart-pie': 'pie-chart-outline', // Analítica
  'fal fa-chart-line': 'trending-up-outline', // Financiero
  'fal fa-warehouse': 'cube-outline', // Bodega / Almacén
  'fal fa-home': 'home-outline', // Inmobiliaria
  'fal fa-archive': 'archive-outline', // Inventarios / SGD
  'fal fa-shopping-cart': 'cart-outline', // Facturación
  'fal fa-credit-card': 'card-outline', // Cartera
  'fal fa-money-bill': 'cash-outline', // Pagos
  'fas fa-money-bill-alt': 'card-outline',
  'fal fa-industry': 'business-outline', // Producción
  'fal fa-cubes': 'cube-outline', // Producción
  'fal fa-hand-holding-box': 'cube-outline', // Logística o Almacenamiento

  // Gestión de personas
  'far fa-list-alt': 'list-outline', // Selección de Personal
  'far fa-hands': 'people-outline', // Nómina
  'fal fa-id-card': 'id-card-outline', // Identificación / Empleado
  'fal fa-comments': 'chatbubble-ellipses-outline', // Comunicaciones
  'fal fa-tv': 'tv-outline',
  'fal fa-th': 'grid-outline',
  'fas fa-pallet-alt': 'cube-outline',
  'fal fa-file-edit': 'document-text-outline',
  'fal fa-hand-holding-usd': 'cash-outline',
  'fal fa-watch': 'time-outline',
  'fas fa-calendar-alt': 'calendar-outline',
};

  return iconMap[icon] || 'help-circle-outline';
};

const MenuItem = ({ item, level = 0, forceExpanded = false }) => {
  const [expanded, setExpanded] = useState(forceExpanded || item.__expanded__ || false);

  const hasChildren = item.__children__ && item.__children__.length > 0;

  const toggleExpanded = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.menuItem, { paddingLeft: 20 + level * 20 }]}
        onPress={toggleExpanded}
      >
        <Ionicons name={getIconName(item.Icon)} size={20} color="#2b8cff" />
        <Text style={styles.menuText}>{item.Nombre}</Text>
        {hasChildren && (
          <Ionicons
            name={expanded ? 'chevron-down' : 'chevron-forward'}
            size={16}
            color="#666"
          />
        )}
      </TouchableOpacity>
      {hasChildren && expanded && (
        <View>
          {item.__children__.map((child) => (
            <MenuItem key={child.OpcionMenuID} item={child} level={level + 1} forceExpanded={forceExpanded} />
          ))}
        </View>
      )}
    </View>
  );
};

const Menu = ({ navigation }) => {
  const { menuOptions } = useGlobal();
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMenuOptions = useMemo(() => {
    if (!searchQuery) return menuOptions;
    return menuOptions.filter(item =>
      item.Nombre.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [menuOptions, searchQuery]);

  const renderGridItem = ({ item }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => setSelectedMenu(item)}
    >
      <Ionicons name={getIconName(item.Icon)} size={40} color="#2b8cff" />
      <Text style={styles.gridText}>{item.Nombre}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {selectedMenu ? (
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedMenu(null)}
            >
              <Ionicons name="arrow-back" size={24} color="#2b8cff" />
              <Text style={styles.backText}>Volver</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{selectedMenu.Nombre}</Text>
          </View>
          <MenuItem item={{ ...selectedMenu, __expanded__: true }} forceExpanded={true} />
        </ScrollView>
      ) : (
        <View style={styles.gridContainer}>
          <Text style={styles.title}>Menú de Opciones</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar menú..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FlatList
            data={filteredMenuOptions}
            renderItem={renderGridItem}
            keyExtractor={(item) => item.OpcionMenuID.toString()}
            numColumns={numColumns}
            contentContainerStyle={styles.grid}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default Menu;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'absolute',
        left: 20,
        top: 20,
    },
    backText: {
        fontSize: 16,
        color: '#2b8cff',
        marginLeft: 5,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
    },
    gridContainer: {
        flex: 1,
        padding: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
    },
    grid: {
        flexGrow: 1,
        alignItems: 'center',
        paddingBottom: 20,
    },
    gridItem: {
        width: itemWidth,
        height: itemWidth,
        margin: 5,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    gridText: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
        marginTop: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
    },
});