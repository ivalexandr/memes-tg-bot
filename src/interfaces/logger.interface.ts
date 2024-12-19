export interface LoggerInterface {
  info(message: string): void;
  error(message: string): void;
  warning(message: string): void;
}
