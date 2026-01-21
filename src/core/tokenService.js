import * as SecureStore from 'expo-secure-store';
import { loginUser, getOauthToken, getSessionData } from '../features/auth/services/authService';
class TokenService {
  constructor() {
    this.tokenExpiry = null;
    this.isRefreshing = false;
    this.refreshPromise = null;
  }
  parseExpiryDate(expiresString) {
    if (!expiresString) return null;
    let date = new Date(expiresString);
    if (!isNaN(date.getTime())) {
      return date;
    }
    const parts = expiresString.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (parts) {
      const [, day, month, year, hours, minutes, seconds] = parts;
      return new Date(year, month - 1, day, hours, minutes, seconds);
    }

    return null;
  }

  isTokenExpired() {
    if (!this.tokenExpiry) {
      return false;
    }

    const now = new Date();
    const bufferMs = 60 * 1000;
    return now.getTime() >= (this.tokenExpiry.getTime() - bufferMs);
  }

  setTokenExpiry(expiresString) {
    this.tokenExpiry = this.parseExpiryDate(expiresString);
    console.log('[TokenService] Token expiry set to:', this.tokenExpiry);
  }

  async refreshToken() {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this._doRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  async _doRefresh() {
    try {
      const credentialsStr = await SecureStore.getItemAsync('auth_credentials');
      const selectionStr = await SecureStore.getItemAsync('auth_selection');

      if (!credentialsStr || !selectionStr) {
        throw new Error('No stored credentials available for token refresh');
      }

      const { email, password } = JSON.parse(credentialsStr);
      const { empresa, sucursal } = JSON.parse(selectionStr);

      if (!email || !password || !empresa || !sucursal) {
        throw new Error('Incomplete credentials for token refresh');
      }

      const loginResult = await loginUser(email, password);

      const oauthData = await getOauthToken(
        loginResult.token,
        empresa.BaseDatosID,
        empresa.EmpresaID,
        sucursal.SucursalID
      );

      await SecureStore.setItemAsync('accessToken', oauthData.accessToken);
      await SecureStore.setItemAsync('erpToken', oauthData.accessToken);

      if (loginResult.expires) {
        this.setTokenExpiry(loginResult.expires);
      }

      const sessionData = await getSessionData(oauthData.accessToken);

      const useGlobal = require('./global').useGlobal;
      const state = useGlobal.getState();

      const usuarioID = sessionData.Session?.Usuario?.UsuarioID;
      const rolID = sessionData.Session?.Usuario?.RolID;
      const user = sessionData.Session?.Usuario || {};
      const accesos = sessionData.Session?.Accesos || [];

      await SecureStore.setItemAsync('usuarioID', usuarioID?.toString() || '');
      await SecureStore.setItemAsync('rolID', rolID?.toString() || '');

      state.login({
        user: {
          email: email,
          ...user,
        },
        usuarioID,
        rolID,
        empresa,
        sucursal,
        accesos,
      });

      console.log('[TokenService] Token refresh successful');
      return oauthData.accessToken;

    } catch (error) {
      console.error('[TokenService] Token refresh failed:', error);
      throw error;
    }
  }

  async getValidToken() {
    if (this.isTokenExpired()) {
      return await this.refreshToken();
    }
    const erpToken = await SecureStore.getItemAsync('erpToken');
    if (erpToken) {
      return erpToken;
    }

    const accessToken = await SecureStore.getItemAsync('accessToken');
    return accessToken || '';
  }

  async handleApiError(error, statusCode) {
    if (statusCode === 401 || statusCode === 403) {
      console.log('[TokenService] Auth error detected, attempting token refresh...');
      try {
        await this.refreshToken();
        return true;
      } catch (refreshError) {
        console.error('[TokenService] Token refresh failed after auth error:', refreshError);
        return false;
      }
    }
    return false;
  }

  async triggerConnectionRecovery() {
    console.log('[TokenService] Triggering connection recovery...');

    const useGlobal = require('./global').useGlobal;
    const state = useGlobal.getState();

    state.setInitialized(false);

    const SignalRService = require('../features/chat/services/signalrService').default;
    SignalRService.stop();
    await SignalRService.connect();
  }
}

export default new TokenService();
