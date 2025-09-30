import React, { useEffect } from 'react';
import {
  View,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import useGlobal from '../../core/global';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const init = useGlobal((state) => state.init);

  useEffect(() => {
    const timer = setTimeout(() => {
      init();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/logos/SEDI_ERP.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <ActivityIndicator size="large" color="#0086c8" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 50,
  },
  logo: {
    width: 200,
    height: 150,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;