import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ExpandableDropdown = ({
  title,
  items,
  selectedItem,
  onSelect,
  hasSearch = false,
  onSearch,
  placeholder = 'Buscar...',
  loading = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [searchText, setSearchText] = useState('');

  const handleSearch = (text) => {
    setSearchText(text);
    if (onSearch) {
      onSearch(text);
    }
  };

  const handleSelect = (item) => {
    onSelect(item);
    setExpanded(false);
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={toggleExpanded}>
        <Text style={styles.buttonText}>
          {selectedItem ? (selectedItem.Empresa || selectedItem.Sucursal || 'Seleccionado') : title}
        </Text>
        <Text style={styles.arrow}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.expandedContainer}>
          {hasSearch && (
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#555555" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={placeholder}
                value={searchText}
                onChangeText={handleSearch}
              />
            </View>
          )}
          <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
            {loading ? (
              <ActivityIndicator size="large" color="#337ab7" />
            ) : (
              items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.item,
                    selectedItem && selectedItem.EmpresaID === item.EmpresaID && styles.selectedItem,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.itemText}>
                    {item.Empresa || item.Sucursal || 'Item ' + (index + 1)}
                  </Text>
                  {item.Logo && <Image source={{uri: item.Logo}} style={styles.itemLogo} />}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 15,
  },
  button: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    color: '#555555',
  },
  arrow: {
    fontSize: 16,
    color: '#555555',
  },
  expandedContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderTopWidth: 0,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    backgroundColor: '#fff',
    maxHeight: 300,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    margin: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingVertical: 0,
  },
  listContainer: {
    maxHeight: 250,
  },
  item: {
    width: '100%',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 16,
    flex: 1,
  },
  itemLogo: {
    width: 50,
    height: 50,
    marginLeft: 10,
    resizeMode: 'contain',
  },
  selectedItem: {
    backgroundColor: '#e0f7fa',
  },
});

export default ExpandableDropdown;