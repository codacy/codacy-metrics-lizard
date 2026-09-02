import { Codacyrc } from "./model/codacyInput"

export interface LizardOptions {
  "files": string[];
  "returnMetrics": boolean;
  "languages": string[]; // lizard's "-l" flag values; empty means let lizard search all languages it knows
}

// maps Codacy's language names (see Language.scala) to the "-l" flag values lizard expects
const codacyLanguageToLizardLanguage: Record<string, string> = {
  "CPP": "cpp",
  "C": "cpp",
  "Java": "java",
  "CSharp": "csharp",
  "Javascript": "javascript",
  "Python": "python",
  "Objective C": "objectivec",
  "Ruby": "ruby",
  "PHP": "php",
  "Swift": "swift",
  "Scala": "scala",
  "Go": "go",
  "TypeScript": "typescript",
  "Rust": "rust",
  "Kotlin": "kotlin",
  "Solidity": "solidity",
  "Erlang": "erlang",
  "Fortran": "fortran",
  "Perl": "perl",
  "R": "r",
  "PLSQL": "plsql",
}

export const getLizardOptions = async function (
    codacyrc: Codacyrc
): Promise<LizardOptions> {
  try {
    const defaultFilesToAnalyze = ["."]
    const lizardLanguage = codacyrc?.language && codacyLanguageToLizardLanguage[codacyrc.language]

    return {
      files: codacyrc?.files?.length > 0 ? codacyrc.files : defaultFilesToAnalyze,
      returnMetrics: true,
      languages: lizardLanguage ? [lizardLanguage] : [],
    }
  } catch (error) {
    console.error("Error in getLizardOptions:", error)
    throw new Error("Failed to retrieve Lizard options")
  }
}