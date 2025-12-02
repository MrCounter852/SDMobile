import React, { useState } from 'react';
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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import useGlobal from '../../core/global';
import ExpandableDropdown from '../../assets/common/SearchableDropdownModal';
import { loginUser, fetchEmpresas, getOauthToken, getSessionData } from '../../services/auth/authService';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('login');
  const [empresas, setEmpresas] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [selectedSucursal, setSelectedSucursal] = useState(null);
  const [loginData, setLoginData] = useState(null);
  const [empresasLoading, setEmpresasLoading] = useState(false);
  const login = useGlobal((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu email y contraseña');
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser(email, password);
      setLoginData(result);
      setEmpresasLoading(true);
      const empresas = await fetchEmpresas(result.token, '');
      setEmpresas(empresas);
      setEmpresasLoading(false);
      setStep('selection');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const handleEmpresaSearch = async (text) => {
    if (text.length >= 3 || text === '') {
      setEmpresasLoading(true);
      try {
        const empresas = await fetchEmpresas(loginData.token, text);
        setEmpresas(empresas);
      } catch (error) {
        Alert.alert('Error', error.message);
      }
      setEmpresasLoading(false);
    }
  };

  let content;
  if (step === 'login') {
    content = (
      <View style={styles.loginContainer}>
        <Image
          source={require('../../assets/images/logos/SEDI_ERP.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Bienvenido a SEDI ERP</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Contraseña"
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
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#555555"
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>SIGUIENTE</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  } else if (step === 'selection') {
    content = (
      <View style={styles.selectionContainer}>
        <Image
          source={selectedEmpresa ? {uri: selectedEmpresa.Logo} : require('../../assets/images/logos/SEDI_ERP.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>Empresa</Text>
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
        {selectedEmpresa && (
          <>
            <Text style={styles.subtitle}>Sucursal</Text>
            <ExpandableDropdown
              title="Seleccionar sucursal"
              items={selectedEmpresa ? selectedEmpresa.Sucursales : []}
              selectedItem={selectedSucursal}
              onSelect={setSelectedSucursal}
              hasSearch={false}
              placeholder="Buscar sucursal"
              loading={false}
            />
            {selectedSucursal && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.backButton} onPress={() => {
                  setStep('login');
                  setSelectedEmpresa(null);
                  setSelectedSucursal(null);
                  setEmpresas([]);
                  setLoginData(null);
                }}>
                  <Text style={styles.backButtonText}>ATRÁS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.startButton} onPress={async () => {
                  setLoading(true);
                  try {
                    const oauthData = await getOauthToken(loginData.token, selectedEmpresa.BaseDatosID, selectedEmpresa.EmpresaID, selectedSucursal.SucursalID);
                    await SecureStore.setItemAsync('accessToken', oauthData.accessToken);
                    await SecureStore.setItemAsync('erpToken', oauthData.accessToken);
                    try {
                      const sessionData = await getSessionData(oauthData.accessToken);
                      const usuarioID = sessionData.Session?.Usuario?.UsuarioID;
                      const rolID = sessionData.Session?.Usuario?.RolID;
                      const user = sessionData.Session?.Usuario || {};
                      const accesos = sessionData.Session?.Accesos || [];
                      login({
                        user: { email: loginData.user.email, ...user, Token: user.Token },
                        usuarioID,
                        rolID,
                        empresa: selectedEmpresa,
                        sucursal: selectedSucursal,
                        accesos
                      });
                      await SecureStore.setItemAsync('usuarioID', usuarioID?.toString() || '');
                      await SecureStore.setItemAsync('rolID', rolID?.toString() || '');
                    } catch (error) {
                      console.error('Error fetching session:', error);
                      login({
                        user: { email: loginData.user.email },
                        empresa: selectedEmpresa,
                        sucursal: selectedSucursal
                      });
                    }
                    Alert.alert('Éxito', 'Login exitoso!');
                  } catch (error) {
                    Alert.alert('Error', error.message);
                  }
                  setLoading(false);
                }} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.startButtonText}>INICIAR SESIÓN</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior="height" style={styles.flexOne}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flexOne: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginContainer: {
    width: '90%',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: '#555555',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  passwordInputContainer: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  eyeButton: {
    paddingHorizontal: 10,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#337ab7',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectionContainer: {
    width: '90%',
    alignItems: 'center',
  },
  listContainer: {
    width: '100%',
    maxHeight: 300,
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
  subtitle: {
    fontSize: 18,
    marginBottom: 10,
    color: '#555555',
    alignSelf: 'flex-start',
  },
  selectedItem: {
    backgroundColor: '#e0f7fa',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,

  },
  backButton: {
    width: '50%',
    height: 50,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    border: 5,
    borderColor: '#337ab7',
    borderWidth: 2,
  },
  startButton: {
    width: '50%',
    height: 50,
    backgroundColor: '#337ab7',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    color: '#337ab7',
    fontSize: 16,
    fontWeight: 'bold',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Login;