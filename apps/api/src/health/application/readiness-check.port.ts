export const READINESS_CHECK_PORT = Symbol('READINESS_CHECK_PORT');

export interface ReadinessCheckPort {
  check(): Promise<void>;
  close(): Promise<void>;
}
