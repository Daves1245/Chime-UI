interface MockLogger {
  info: (obj: object | string, msg?: string) => void;
  error: (obj: object | string, msg?: string) => void;
  warn: (obj: object | string, msg?: string) => void;
  debug: (obj: object | string, msg?: string) => void;
  child: (obj: object) => MockLogger;
}

const mockLogger: MockLogger = {
  info: (obj: object | string, msg?: string) =>
    console.info(typeof obj === 'string' ? obj : msg || '', obj),
  error: (obj: object | string, msg?: string) =>
    console.error(typeof obj === 'string' ? obj : msg || '', obj),
  warn: (obj: object | string, msg?: string) =>
    console.warn(typeof obj === 'string' ? obj : msg || '', obj),
  debug: (obj: object | string, msg?: string) =>
    console.debug(typeof obj === 'string' ? obj : msg || '', obj),
  child: () => mockLogger,
};

// Always use mock logger for now to avoid worker thread issues
const logger = mockLogger;

export default logger;
