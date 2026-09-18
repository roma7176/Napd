/**
 * Simulates network latency for mock service calls, so the UI's loading
 * states (spinners, disabled buttons, skeletons) have something real to
 * show during development. Once a service function is pointed at the real
 * FastAPI backend, this can be removed from that function.
 */
export function mockDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
