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
    results.push({
      "filename": file.file,
      "complexity": file.averageCcn * file.methodsCount, // the sum of method complexities is the average ccn per method multiplied by the number of methods
      "lineComplexities": data.methods
        .filter((m) => m.file === file.file)
        .map((m) => ({
          "line": m.fromLine,
          "value": m.ccn
        }))
    })
  })

  return results
}
