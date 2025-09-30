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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loginUser } from '../../js/Login/LoginController';
import useGlobal from '../../core/global';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('login');
  const [empresas, setEmpresas] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [selectedSucursal, setSelectedSucursal] = useState(null);
  const [loginData, setLoginData] = useState(null);
  const login = useGlobal((state) => state.login);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu email y contraseña');
      return;
    }

    setLoading(true);
    const result = await loginUser(email, password);

    if (result.success) {
      setLoginData(result);
      try {
        const empresasResponse = await fetch('https://admin.sedierp.com//API_SIS/api/Login/ERPEmpresas/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            AccessToken: result.token,
            FilterEmpresa: false,
          }),
        });
        const empresasData = await empresasResponse.json();
        if (empresasData.Codigo === 200) {
          setEmpresas(empresasData.Empresas);
          setStep('selection');
        } else {
          Alert.alert('Error', empresasData.Descripcion || 'Error al obtener empresas');
        }
      } catch (error) {
        Alert.alert('Error', 'Error de conexión al obtener empresas');
      }
    } else {
      Alert.alert('Error', result.error);
    }
    setLoading(false);
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
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
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
          source={require('../../assets/images/logos/SEDI_ERP.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>Empresa</Text>
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {empresas.map((empresa, index) => (
            <TouchableOpacity key={index} style={[styles.item, selectedEmpresa?.EmpresaID === empresa.EmpresaID && styles.selectedItem]} onPress={() => setSelectedEmpresa(empresa)}>
              <Text style={styles.itemText}>{empresa.Empresa}</Text>
              {empresa.Logo && <Image source={{uri: empresa.Logo}} style={styles.itemLogo} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
        {selectedEmpresa && (
          <>
            <Text style={styles.subtitle}>Sucursal</Text>
            <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
              {selectedEmpresa.Sucursales.map((sucursal, index) => (
                <TouchableOpacity key={index} style={[styles.item, selectedSucursal === sucursal && styles.selectedItem]} onPress={() => setSelectedSucursal(sucursal)}>
                  <Text style={styles.itemText}>{sucursal.Sucursal || 'Sucursal ' + (index + 1)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
                <TouchableOpacity style={styles.startButton} onPress={() => {
                  login({ email: loginData.user.email, token: loginData.token, empresa: selectedEmpresa, sucursal: selectedSucursal });
                  Alert.alert('Éxito', 'Login exitoso!');
                }}>
                  <Text style={styles.startButtonText}>INICIAR SESIÓN</Text>
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
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#337ab7',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backButton: {
    width: '45%',
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
    width: '45%',
    height: 50,
    backgroundColor: '#337ab7',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
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