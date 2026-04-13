const logger = {
  info: (msg, data = '') => {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] ${timestamp} - ${msg}`, data);
  },
  error: (msg, err = '') => {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] ${timestamp} - ${msg}`, err);
  },
  warn: (msg, data = '') => {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] ${timestamp} - ${msg}`, data);
  }
};

module.exports = logger;
