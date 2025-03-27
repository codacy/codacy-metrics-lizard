import { lizardMetricsEngine } from "./lizardMetricsEngine"
import { parseTimeoutSeconds } from "./parseTimeoutSeconds"
import { readCodacyrcFile } from "./fileUtils"

const timeoutSeconds = parseTimeoutSeconds(process.env.TIMEOUT_SECONDS)

const timeoutHandle = setTimeout(() => {
    console.error("Timeout occurred. Exiting.")
    process.exit(2)
}, timeoutSeconds * 1000)

async function run() {
    const codacyrc = await readCodacyrcFile("/.codacyrc")
    const results = await lizardMetricsEngine(codacyrc)
    results.forEach((result) => {
        console.log(JSON.stringify(result)) // print each result as a JSON string
    })
}

run()
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
    .finally(() => clearTimeout(timeoutHandle))


