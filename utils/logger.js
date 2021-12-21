import pkg from 'winston';
const { createLogger, format, transports } = pkg;
import "winston-daily-rotate-file";

// logger that will log events into .log files, rotating them every day
// if the current file size is greater than 20MB, a new one is created
// all log files are stored for a maximum of 14 days counting from the day they were created

export const logger = createLogger({
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.align(),
    format.printf((i) => `[${i.level.toUpperCase()}] ${[i.timestamp]} ${i.message}`)
  ),
  transports: [
    new transports.DailyRotateFile({
      level: 'info',
      filename: 'logs/%DATE%-main.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      handleExceptions: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});