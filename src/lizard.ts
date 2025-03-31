import { exec } from "child_process"
import fs from "fs"

import { LizardOptions } from "./configCreator"
import { debug } from "./logging"

export interface LizardMethodResult {
  "name": string;
  "fromLine": number;
  "toLine": number;
  "file": string;
  "nloc": number;
  "ccn": number;
  "params": number;
  "tokens": number;
}

export interface LizardFileResult {
  "file": string;
  "nloc": number;
  "maxCcn": number;
  "averageNloc": number;
  "averageCcn": number;
  "averageTokens": number;
  "methodsCount": number;
}

export interface LizardResults {
  "methods": LizardMethodResult[];
  "files": LizardFileResult[];
}

export const runLizardCommand = (
  options: LizardOptions
): Promise<LizardResults> => {
  if (options.files.length === 1 && options.files[0] === ".") {

    // run lizard command
    return new Promise((resolve, reject) => {
      exec(`lizard -V -l cpp -l objectivec -l rust`, (error, stdout, stderr) => {

        if (stdout.trim()) {
          // If stdout has content, resolve with the parsed results
          return resolve(parseLizardResults(stdout))
        }

        // If there's no useful stdout but there's an error, reject
        if (error) {
          return reject(error)
        }
        if (stderr) {
          return reject(stderr)
        }

        // Fallback: If neither stdout nor errors are meaningful, reject
        reject(new Error("Unknown error: No stdout and command failed"));
      })
    })

  } else {

    // create a file with the list of files to analyze
    const filesList = options.files.join("\n")
    const filesListPath = "/codacy/filesList.txt"
    fs.writeFileSync(filesListPath, filesList)

    // run lizard command
    return new Promise((resolve, reject) => {
      exec(`lizard -V -f ${filesListPath}`, (error, stdout, stderr) => {

        if (stdout.trim()) {
          // If stdout has content, resolve with the parsed results
          return resolve(parseLizardResults(stdout))
        }

        // If there's no useful stdout but there's an error, reject
        if (error) {
          return reject(error)
        }
        if (stderr) {
          return reject(stderr)
        }

        // Fallback: If neither stdout nor errors are meaningful, reject
        reject(new Error("Unknown error: No stdout and command failed"));
      })
    })
  }
}

const parseLizardResults = (output: string): LizardResults => {
  // NOTE: lizard supports generating the output in XML or CSV format, but both results lack some information
  // (files are not listed for the CSV output, and only starting line is included for the XML output); so the best
  // option is to parse the plain text output

  // parse the output in an array of lines
  const lines = output.split("\n")

  const results: LizardResults = {
    "methods": [],
    "files": []
  }

  let isMethodSection = false
  let isFileSection = false

  lines.forEach(line => {
    line = line.trim()

    if (line.startsWith("===")) {
      isMethodSection = false
      isFileSection = false
    }
    if (line.startsWith("===") || line.startsWith("---") || line === "" || line.includes("file analyzed")) return

    if (line.includes("NLOC    CCN   token  PARAM  length  location")) {
      isMethodSection = true
      return
    }

    if (line.includes("NLOC    Avg.NLOC  AvgCCN  Avg.token  function_cnt    file")) {
      isFileSection = true
      return
    }

    if (isMethodSection) {
      const lineSplitted = line.replaceAll(/\s+|@/g, " ")
        .trim()
        .split(" ")
      if (lineSplitted.length != 8) return
      const [nloc, ccn, tokens, params, , name, fromToLine, file] = lineSplitted
      const [fromLine, toLine] = fromToLine.split("-")

      results.methods.push({
        "name": name,
        "fromLine": parseInt(fromLine),
        "toLine": parseInt(toLine),
        "file": file.replace(/^.\//, ''),
        "nloc": parseInt(nloc),
        "ccn": parseInt(ccn),
        "params": parseInt(params),
        "tokens": parseInt(tokens)
      })
    }
    
    if (isFileSection) {
      const lineSplitted = line.replaceAll(/\s+/g, " ")
        .trim()
        .split(" ")
      if (lineSplitted.length != 6) return
      const [nloc, avgNloc, avgCcn, avgTokens, methodsCount, file] = lineSplitted

      results.files.push({
        file: file.replace(/^.\//, ''),
        "nloc": parseInt(nloc),
        "maxCcn": results.methods
          .filter((m) => m.file === file)
          .reduce((max, m) => Math.max(m.ccn, max), 0),
        "averageNloc": parseFloat(avgNloc),
        "averageCcn": parseFloat(avgCcn),
        "averageTokens": parseFloat(avgTokens),
        "methodsCount": parseInt(methodsCount)
      })
    }
  })

  return results
}
