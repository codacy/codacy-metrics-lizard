import { Codacyrc } from "codacy-seed"

import { debug } from "./logging"
import { toolName } from "./toolMetadata"

export interface LizardOptions {
  "files": string[];
  "thresholds": { [patternId: string]: number };
  "returnMetrics": boolean;
}

export const getLizardOptions = async function (
    codacyrc: Codacyrc
): Promise<LizardOptions> {
  try {
    // Get options for the tool from the codacyrc
    const patterns = codacyrc.tools[0]?.patterns || [];
    const thresholds = Object.fromEntries(
        patterns.map((p) => [p.patternId, p.parameters?.[0]?.value])
    )

    return {
      files: codacyrc.files,
      thresholds,
      returnMetrics: !!patterns,
    }
  } catch (error) {
    console.error("Error in getLizardOptions:", error)
    throw new Error("Failed to retrieve Lizard options")
  }
}