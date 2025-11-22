/**
 * Logger centralizado para la aplicación
 * Solo muestra logs en desarrollo, excepto errores
 */

const isDev = process.env.NODE_ENV === 'development';

type LogLevel = 'log' | 'warn' | 'error' | 'info';

class Logger {
    private formatMessage(level: LogLevel, ...args: unknown[]): string {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level.toUpperCase()}]`;
    }

    log(...args: unknown[]): void {
        if (isDev) {
            console.log(this.formatMessage('log', ...args), ...args);
        }
    }

    info(...args: unknown[]): void {
        if (isDev) {
            console.info(this.formatMessage('info', ...args), ...args);
        }
    }

    warn(...args: unknown[]): void {
        if (isDev) {
            console.warn(this.formatMessage('warn', ...args), ...args);
        }
    }

    error(...args: unknown[]): void {
        // Errores siempre se muestran (incluso en producción)
        console.error(this.formatMessage('error', ...args), ...args);

        // TODO: Enviar a servicio de tracking (Sentry, LogRocket, etc)
        // if (!isDev && typeof window !== 'undefined') {
        //   window.Sentry?.captureException(args[0]);
        // }
    }

    group(label: string): void {
        if (isDev) {
            console.group(label);
        }
    }

    groupEnd(): void {
        if (isDev) {
            console.groupEnd();
        }
    }
}

export const logger = new Logger();
