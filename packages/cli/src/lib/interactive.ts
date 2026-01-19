/**
 * Utilities for detecting interactive vs non-interactive mode
 */

/**
 * Check if we're in an interactive terminal
 * Returns false in:
 * - CI environments
 * - Non-TTY environments (piped input/output)
 * - When --json flag is used
 */
export function isInteractive(options: { json?: boolean } = {}): boolean {
  if (options.json) return false;
  if (process.env.CI) return false;
  if (!process.stdin.isTTY) return false;
  return true;
}

/**
 * Check if all required arguments are provided
 */
export function hasAllArgs<T extends Record<string, any>>(
  args: T,
  required: (keyof T)[]
): boolean {
  return required.every((key) => args[key] !== undefined && args[key] !== null);
}
