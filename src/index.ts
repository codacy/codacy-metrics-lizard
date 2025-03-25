import { lizardMetricsEngine } from "./lizardMetricsEngine"
import { parseTimeoutSeconds } from "./parseTimeoutSeconds"

const timeoutSeconds = parseTimeoutSeconds(process.env.TIMEOUT_SECONDS)

const timeoutHandle = setTimeout(() => {
    console.error("Timeout occurred. Exiting.")
    process.exit(2)
}, timeoutSeconds * 1000)

async function run() {
    const results = await lizardMetricsEngine()
    console.log(results)
}

run()
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
    .finally(() => clearTimeout(timeoutHandle))