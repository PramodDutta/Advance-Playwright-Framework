import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}

/**
 * Lazy file transport. The Logger writes to console (so Playwright report
 * captures it per-step) and also appends to logs/run-{ISO}.log so we can
 * grep across the whole suite after a CI run.
 *
 * The transport is intentionally tiny - no winston / pino dep. The repo
 * already keeps zero runtime deps for tests and we want to keep that.
 */
class FileTransport {
    private static handle: number | null = null;
    private static filePath: string | null = null;

    static write(line: string): void {
        if (process.env.TTA_LOG_FILE === 'off') return;
        try {
            if (FileTransport.handle === null) {
                const dir = path.resolve(process.cwd(), 'logs');
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                const stamp = new Date().toISOString().replace(/[:.]/g, '-');
                FileTransport.filePath = path.join(dir, `run-${stamp}.log`);
                FileTransport.handle = fs.openSync(FileTransport.filePath, 'a');
            }
            fs.writeSync(FileTransport.handle, line + '\n');
        } catch {
            // Logging must never break a test. Silently swallow any FS error.
        }
    }
}

export class Logger {
    private context: string;
    private static logLevel: LogLevel = LogLevel.INFO;

    constructor(context: string) {
        this.context = context;
    }

    /**
     * Create a new Logger instance with the given context
     */
    static create(context: string): Logger {
        return new Logger(context);
    }

    /**
     * Set the global log level
     */
    static setLogLevel(level: LogLevel): void {
        Logger.logLevel = level;
    }

    /**
     * Get the current log level
     */
    static getLogLevel(): LogLevel {
        return Logger.logLevel;
    }

    private formatMessage(level: LogLevel, message: string): string {
        return `[${new Date().toISOString()}] [${level}] [${this.context}] ${message}`;
    }

    private shouldLog(level: LogLevel): boolean {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        return levels.indexOf(level) >= levels.indexOf(Logger.logLevel);
    }

    /**
     * Log a debug message
     */
    debug(message: string): void {
        if (this.shouldLog(LogLevel.DEBUG)) {
            const line = this.formatMessage(LogLevel.DEBUG, message);
            console.debug(line);
            FileTransport.write(line);
        }
    }

    /**
     * Log an info message
     */
    info(message: string): void {
        if (this.shouldLog(LogLevel.INFO)) {
            const line = this.formatMessage(LogLevel.INFO, message);
            console.info(line);
            FileTransport.write(line);
        }
    }

    /**
     * Log a warning message
     */
    warn(message: string): void {
        if (this.shouldLog(LogLevel.WARN)) {
            const line = this.formatMessage(LogLevel.WARN, message);
            console.warn(line);
            FileTransport.write(line);
        }
    }

    /**
     * Log an error message
     */
    error(message: string, error?: unknown): void {
        if (this.shouldLog(LogLevel.ERROR)) {
            const line = this.formatMessage(LogLevel.ERROR, message);
            console.error(line, error || '');
            FileTransport.write(error ? `${line} ${String(error)}` : line);
        }
    }

    /**
     * Log a test step
     */
    step(stepNumber: number, description: string): void {
        this.info(`Step ${stepNumber}: ${description}`);
    }

    /**
     * Log the start of a test
     */
    testStart(testName: string): void {
        this.info(`========== START: ${testName} ==========`);
    }

    /**
     * Log the end of a test
     */
    testEnd(testName: string): void {
        this.info(`========== END: ${testName} ==========`);
    }
}

