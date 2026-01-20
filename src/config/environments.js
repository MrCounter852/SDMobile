// Environment configuration for SediMobile
const environments = {
  development: {
    BASE_URL_SIS: 'https://devadmin.sedisolutions.co:444',
    BASE_URL_NS: 'https://dev.sedisolutions.co:444',
    SIGNALR_URL: 'https://devadmin.sedisolutions.co:444/API_SIS/signalr',
  },/** 
  staging: {
    BASE_URL_SIS: 'https://staging-admin.sedierp.com',
    BASE_URL_NS: 'https://staging-ns.sedierp.com',
    SIGNALR_URL: 'https://staging-admin.sedierp.com/API_SIS/signalr'
  },*/
  production: {
    BASE_URL_SIS: 'https://admin.sedierp.com',
    BASE_URL_NS: 'https://ns2.sedierp.com',
    SIGNALR_URL: 'https://admin.sedierp.com/API_SIS/signalr'
  }
};

/**
 * Get current environment configuration
 * @returns {Object} Environment configuration object
 */
const getEnvironmentConfig = () => {
  // You can customize this logic based on your needs
  // For example, check process.env.NODE_ENV, or use a custom variable

  // Default to development if __DEV__ is true (React Native dev mode)
  /*  
  if (__DEV__) {
    return environments.development;
  }
*/
  // For production builds, you might want to check app.json or other indicators
  // For now, default to production
  return environments.production;
};

export default getEnvironmentConfig;
