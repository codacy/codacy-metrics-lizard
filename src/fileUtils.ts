import { readFile } from "fs/promises"

import { Codacyrc } from "codacy-seed"

export async function readCodacyrcFile(file: string): Promise<Codacyrc | undefined> {
    try {
        const content = await readFile(file, { encoding: 'utf8' })

        return parseCodacyrcFile(content)
    } catch (e) {
        console.error(`Error reading ${file} file`)
        return undefined
    }
}

export function parseCodacyrcFile(content: string): Codacyrc {
    return JSON.parse(content)
}
