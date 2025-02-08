type LogLevel = "debug" | "info" | "warn" | "error"

export const logger = {
  debug: (message: string, data?: any) => logMessage("debug", message, data),
  info: (message: string, data?: any) => logMessage("info", message, data),
  warn: (message: string, data?: any) => logMessage("warn", message, data),
  error: (message: string, data?: any) => logMessage("error", message, data),
}

function logMessage(level: LogLevel, message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const logData = {
    timestamp,
    level,
    message,
    ...(data && { data }),
  }

  if (level === "error") {
    console.error(JSON.stringify(logData, null, 2))
  } else {
    console.log(JSON.stringify(logData, null, 2))
  }
}

