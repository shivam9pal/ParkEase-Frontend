import '@testing-library/jest-dom';

// Mock import.meta.env for Vite environment variables
global.import = {
  ...global.import,
  meta: {
    env: {
      VITE_API_BASE_URL: 'http://localhost:8080',
      VITE_NODE_ENV: 'test',
    },
  },
};

// Polyfill for TextEncoder and TextDecoder
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock leaflet for react-leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Popup: ({ children }) => <div>{children}</div>,
  useMap: () => ({}),
}));

// Mock leaflet itself
jest.mock('leaflet', () => ({
  map: jest.fn(),
  tileLayer: jest.fn().mockReturnValue({
    addTo: jest.fn(),
  }),
  marker: jest.fn().mockReturnValue({
    addTo: jest.fn(),
    bindPopup: jest.fn(),
  }),
  DomUtil: {
    get: jest.fn(),
  },
  L: {},
}));
