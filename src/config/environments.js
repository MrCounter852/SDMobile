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

const getEnvironmentConfig = () => {
  return environments.development;
};

export default getEnvironmentConfig;
