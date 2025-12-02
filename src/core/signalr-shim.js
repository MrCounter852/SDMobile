// Este archivo debe importarse ANTES de usar signalr-no-jquery

const locationShim = {
  protocol: 'https:',
  host: 'admin.sedierp.com',
  search: '',
  hash: '',
  pathname: '/',
  href: 'https://admin.sedierp.com/'
};

// 1. WINDOW SHIM
if (typeof global.window === 'undefined') {
  global.window = global;
}

// Asegurar que window tenga addEventListener
if (!global.window.addEventListener) {
  global.window.addEventListener = (event, handler) => {
  };
}

if (!global.window.removeEventListener) {
  global.window.removeEventListener = () => { };
}

// Asegurar location en window
if (!global.window.location) {
  global.window.location = locationShim;
}

// 2. DOCUMENT SHIM
if (typeof global.document === 'undefined') {
  global.document = {
    readyState: 'complete',
    addEventListener: (event, handler) => { },
    removeEventListener: () => { },
    createElement: (tagName) => {
      if (tagName === 'a') {
        return {
          _href: '',
          set href(val) {
            this._href = val;
            // Parseo simple para evitar errores en la librería
            try {
              if (val && val.startsWith('//')) {
                val = 'https:' + val;
              }
              // React Native tiene URL disponible
              if (typeof URL !== 'undefined') {
                const parsed = new URL(val, 'http://localhost');
                this.protocol = parsed.protocol;
                this.host = parsed.host;
                this.hostname = parsed.hostname;
                this.port = parsed.port;
                this.pathname = parsed.pathname;
                this.search = parsed.search;
                this.hash = parsed.hash;
              } else {
                this.protocol = 'https:';
                this.host = 'localhost';
              }
            } catch (e) {
              // Ignorar errores de parseo
            }
          },
          get href() {
            return this._href;
          }
        };
      }
      return {};
    },
    location: locationShim,
  };
}

// 3. NAVIGATOR SHIM
if (typeof global.navigator === 'undefined') {
  global.navigator = {
    userAgent: 'react-native',
  };
} else if (!global.navigator.userAgent) {
  global.navigator.userAgent = 'react-native';
}

const NativeXMLHttpRequest = global.XMLHttpRequest;

class XHRWrapper extends NativeXMLHttpRequest {
  constructor() {
    super();
    this._withCredentials = false;
    try {
      super.withCredentials = false;
    } catch (e) { }
    console.log('[SignalR-Shim] XHR Created');
  }

  get withCredentials() {
    return this._withCredentials;
  }

  set withCredentials(value) {
    const boolValue = !!value;
    this._withCredentials = boolValue;
    try {
      super.withCredentials = boolValue;
    } catch (e) {
    }
  }

  open(method, url, async, user, password) {
    console.log(`[SignalR-Shim] XHR Open: ${method} ${url}`);
    // SignalR might pass undefined for async, user, password
    return super.open(method, url, async !== false, user, password);
  }

  send(data) {
    console.log('[SignalR-Shim] XHR Send');
    // Ensure withCredentials is set on native before sending
    try {
      if (super.withCredentials === undefined || super.withCredentials === null) {
        super.withCredentials = this._withCredentials;
      }
    } catch (e) { }
    return super.send(data);
  }
}

global.XMLHttpRequest = XHRWrapper;
global.window.XMLHttpRequest = XHRWrapper;
