import { Codacyrc } from "./model/codacyInput"

import { getLizardOptions, LizardOptions } from "./configCreator"
import { runLizardCommand } from "./lizard"
import { debug } from "./logging"
import { FileComplexity } from "./model/MetricsResults"

export const lizardMetricsEngine = async function (
  codacyrc?: Codacyrc
): Promise<FileComplexity[]> {
  debug("engine: starting")

  const lizardOptions = await getLizardOptions(codacyrc)

  const results = await getLizardMetrics(lizardOptions)

  debug("engine: finished")

  return results
}

const getLizardMetrics = async (options: LizardOptions) => {
  const results: FileComplexity[] = []

  // get Lizard tool output parsed
  const data = await runLizardCommand({ ...options, "returnMetrics": true })

  // iterate over the files
  data.files.forEach((file) => {
    const fileMethods = data.methods.filter((m) => m.file === file.file)

    results.push({
      "filename": file.file,
      "complexity": fileMethods.reduce((sum, m) => sum + m.ccn, 0), // sum of the actual per-method complexities
      "lineComplexities": fileMethods.map((m) => ({
        "line": m.fromLine,
        "value": m.ccn
      }))
    })
  })

  return results
}
