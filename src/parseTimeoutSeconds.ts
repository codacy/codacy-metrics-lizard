export const defaultTimeout = 15 * 60

export function parseTimeoutSeconds(timeoutString?: string): number {
    const parsed = parseInt(timeoutString, 10)

    return Math.max(
        Number.isNaN(parsed) ? defaultTimeout : parsed,
        0
    )
}
