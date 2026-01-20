import getEnvironmentConfig from '../../../config/environments';

export const loginUser = async (email, password) => {
  const response = await fetch(`${getEnvironmentConfig().BASE_URL_SIS}/API_SIS/api/Login/ERPLogin/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Usuario: email,
      Clave: password,
    }),
  });

  const data = await response.json();

  if (response.ok && data.AccessToken) {
    return {
      success: true,
      token: data.AccessToken,
      expires: data.Expires,
      empresas: data.Empresas,
      user: { email }
    };
  } else {
    throw new Error(data.Message || 'Error de autenticación');
  }
};

export const fetchEmpresas = async (token, search = '') => {
  const response = await fetch(`${getEnvironmentConfig().BASE_URL_SIS}/API_SIS/api/Login/ERPEmpresas/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      AccessToken: token,
      FilterEmpresa: true,
      fullsearch: search,
    }),
  });

  const data = await response.json();

  if (data.Codigo === 200) {
    return data.Empresas;
  } else {
    throw new Error(data.Descripcion || 'Error al obtener empresas');
  }
};

export const getOauthToken = async (accessToken, baseDatosID, empresaID, sucursalID) => {
  const response = await fetch(`${getEnvironmentConfig().BASE_URL_SIS}/API_SIS/api/Login/OauthToken/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      AccessToken: accessToken,
      BaseDatosID: baseDatosID,
      EmpresaID: empresaID,
      SucursalID: sucursalID,
    }),
  });

  const data = await response.json();

  if (response.ok && data.AccessToken) {
    return { accessToken: data.AccessToken };
  } else {
    throw new Error(data.Message || 'Error en OauthToken');
  }
};

export const getSessionData = async (token) => {
  const response = await fetch(`${getEnvironmentConfig().BASE_URL_NS}/API_SIS/api/Login/LoginAcceso?TokenKey=${token}`, {
    method: 'GET',
  });
  const data = await response.json();
  return data;
};