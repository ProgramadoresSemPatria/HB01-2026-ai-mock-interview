type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

function formatLine(level: LogLevel, message: string, meta?: object): string {
  const timestamp = new Date().toISOString();
  const metaPart = meta !== undefined ? ` | ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level}] ${message}${metaPart}`;
}

function shouldLog(level: LogLevel): boolean {
  if (process.env.NODE_ENV !== "test") return true;
  return level === "WARN" || level === "ERROR";
}

function write(level: LogLevel, message: string, meta?: object): void {
  if (!shouldLog(level)) return;

  const line = formatLine(level, message, meta);

  switch (level) {
    case "DEBUG":
      console.debug(line);
      break;
    case "INFO":
      console.info(line);
      break;
    case "WARN":
      console.warn(line);
      break;
    case "ERROR":
      console.error(line);
      break;
  }
}

export const logger = {
  info(message: string, meta?: object): void {
    write("INFO", message, meta);
  },
  warn(message: string, meta?: object): void {
    write("WARN", message, meta);
  },
  error(message: string, meta?: object): void {
    write("ERROR", message, meta);
  },
  debug(message: string, meta?: object): void {
    write("DEBUG", message, meta);
  },
};
