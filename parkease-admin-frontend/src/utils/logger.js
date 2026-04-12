// Production-ready logger - completely disabled for clean console
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args) => {
    // Logs completely disabled - silent output
  },
  
  warn: (...args) => {
    // Warnings completely disabled - silent output
  },
  
  error: (...args) => {
    // Always log errors for monitoring
    console.error(...args);
  },
  
  debug: (...args) => {
    // Debug disabled - silent output
  },
};

export default logger;
