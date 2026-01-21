import * as SecureStore from 'expo-secure-store';
import { loginUser, getOauthToken, getSessionData } from '../features/auth/services/authService';

/**
 * Centralized Token Service
 * Handles token storage, expiration checks, and automatic refresh.
 */
class TokenService {
  constructor() {
    this.tokenExpiry = null;
    this.isRefreshing = false;
    this.refreshPromise = null;
  }

  /**
   * Parses the expiry date from the API response.
   * Expected format: "DD/MM/YYYY HH:mm:ss" or ISO string
   */
  parseExpiryDate(expiresString) {
    if (!expiresString) return null;

    // Try parsing as ISO string first
    let date = new Date(expiresString);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Try parsing DD/MM/YYYY HH:mm:ss format
    const parts = expiresString.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (parts) {
      const [, day, month, year, hours, minutes, seconds] = parts;
      return new Date(year, month - 1, day, hours, minutes, seconds);
    }

    return null;
  }

  /**
   * Checks if the current token is expired.
   * Adds a 60-second buffer to refresh tokens before they actually expire.
   */
  isTokenExpired() {
    if (!this.tokenExpiry) {
      // If we don't have expiry info, assume token is valid
      // and let the API call fail if it's not
      return false;
    }

    const now = new Date();
    const bufferMs = 60 * 1000; // 60 seconds buffer
    return now.getTime() >= (this.tokenExpiry.getTime() - bufferMs);
  }

  /**
   * Sets the token expiry date.
   */
  setTokenExpiry(expiresString) {
    this.tokenExpiry = this.parseExpiryDate(expiresString);
    console.log('[TokenService] Token expiry set to:', this.tokenExpiry);
  }

  /**
   * Refreshes the token using stored credentials.
   * Returns the new token or throws an error if refresh fails.
   */
  async refreshToken() {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      console.log('[TokenService] Refresh already in progress, waiting...');
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
    console.log('[TokenService] Starting token refresh...');

    try {
      // Get stored credentials
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

      // Perform login flow
      const loginResult = await loginUser(email, password);

      // Get OAuth token
      const oauthData = await getOauthToken(
        loginResult.token,
        empresa.BaseDatosID,
        empresa.EmpresaID,
        sucursal.SucursalID
      );

      // Save the new token
      await SecureStore.setItemAsync('accessToken', oauthData.accessToken);
      await SecureStore.setItemAsync('erpToken', oauthData.accessToken);

      // Set new expiry (from initial login response)
      if (loginResult.expires) {
        this.setTokenExpiry(loginResult.expires);
      }

      // Get session data to update global state
      const sessionData = await getSessionData(oauthData.accessToken);

      // Update global state
      const useGlobal = require('./global').useGlobal;
      const state = useGlobal.getState();

      const usuarioID = sessionData.Session?.Usuario?.UsuarioID;
      const rolID = sessionData.Session?.Usuario?.RolID;
      const user = sessionData.Session?.Usuario || {};
      const accesos = sessionData.Session?.Accesos || [];

      // Save usuarioID and rolID to SecureStore
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

  /**
   * Gets a valid token. If the current token is expired, refreshes it first.
   */
  async getValidToken() {
    if (this.isTokenExpired()) {
      console.log('[TokenService] Token expired, refreshing...');
      return await this.refreshToken();
    }

    // Return stored token
    const erpToken = await SecureStore.getItemAsync('erpToken');
    if (erpToken) {
      return erpToken;
    }

    const accessToken = await SecureStore.getItemAsync('accessToken');
    return accessToken || '';
  }

  /**
   * Handles API errors. If it's an auth error, attempts token refresh.
   * Returns true if the error was handled and the request should be retried.
   */
  async handleApiError(error, statusCode) {
    // Check for authentication errors (401, 403)
    if (statusCode === 401 || statusCode === 403) {
      console.log('[TokenService] Auth error detected, attempting token refresh...');
      try {
        await this.refreshToken();
        return true; // Retry the request
      } catch (refreshError) {
        console.error('[TokenService] Token refresh failed after auth error:', refreshError);
        return false;
      }
    }
    return false;
  }

  /**
   * Triggers the connection recovery flow.
   * Shows splash screen and attempts SignalR reconnection.
   */
  async triggerConnectionRecovery() {
    console.log('[TokenService] Triggering connection recovery...');

    const useGlobal = require('./global').useGlobal;
    const state = useGlobal.getState();

    // Show splash screen
    state.setInitialized(false);

    // Attempt SignalR reconnection
    const SignalRService = require('../features/chat/services/signalrService').default;
    SignalRService.stop();
    await SignalRService.connect();
  }
}

export default new TokenService();
