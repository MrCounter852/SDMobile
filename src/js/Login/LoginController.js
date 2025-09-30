const API_BASE_URL = 'https://admin.sedierp.com//API_SIS/api/';

export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}Login/ERPLogin/`, {
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
        console.log('Login successful:', data);
      return { 
        success: true, 
        token: data.AccessToken,
        expires: data.Expires,
        empresas: data.Empresas,
        user: {
          email: email
        }
      };
    } else {
      return { success: false, error: data.Message || 'Error de autenticación' };
    }
  } catch (error) {
    return { success: false, error: 'Error de conexión' };
  }
};

