import winston from 'winston';
import { join } from 'path';

// Créer un format personnalisé
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Créer le logger
const logger = winston.createLogger({
  level: 'info',
  format: customFormat,
  transports: [
    // Écrire dans la console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    }),
    // Écrire dans un fichier
    new winston.transports.File({
      filename: join(process.cwd(), 'logs', 'error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: join(process.cwd(), 'logs', 'combined.log')
    })
  ]
});

export default logger;