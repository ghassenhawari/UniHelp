import * as winston from 'winston';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

const devFormat = combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ level, message, timestamp, context, requestId, stack }) => {
        const ctx = context ? `[${context}]` : '';
        const rid = requestId ? ` {${requestId}}` : '';
        const err = stack ? `\n${stack}` : '';
        return `${timestamp} ${level} ${ctx}${rid}: ${message}${err}`;
    }),
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const isDev = process.env.NODE_ENV !== 'production';

export const winstonConfig: winston.LoggerOptions = {
    level: isDev ? 'debug' : 'info',
    format: isDev ? devFormat : prodFormat,
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5_000_000,
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 10_000_000,
            maxFiles: 10,
        }),
    ],
};
