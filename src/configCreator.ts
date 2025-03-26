import { Codacyrc } from "./model/codacyInput"

export interface LizardOptions {
  "files": string[];
  "returnMetrics": boolean;
}

export const getLizardOptions = async function (
    codacyrc: Codacyrc
): Promise<LizardOptions> {
  try {

    return {
      files: codacyrc.files,
      returnMetrics: true,
    }
  } catch (error) {
    console.error("Error in getLizardOptions:", error)
    throw new Error("Failed to retrieve Lizard options")
  }
}