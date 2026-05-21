import * as fs from 'fs';
import * as path from 'path';
import { parse as csvParse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

/**
 * Resolves a path relative to the project root so callers can pass
 * `'src/testdata/products.csv'` without worrying about CWD differences
 * between local runs, Jenkins, and GitHub Actions.
 */
function resolveFromRoot(p: string): string {
    return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}

/**
 * Read a JSON file and parse it as type T.
 *
 *   const users = readJSON<TestUser[]>('src/testdata/users.json');
 */
export function readJSON<T>(filePath: string): T {
    const raw = fs.readFileSync(resolveFromRoot(filePath), 'utf-8');
    return JSON.parse(raw) as T;
}

/**
 * Read a CSV file into a typed array. First row is treated as a header.
 *
 *   const products = readCSV<{ id: string; name: string; price: string }>(
 *     'src/testdata/products.csv',
 *   );
 *
 * NOTE: every cell comes back as a string. Cast/coerce in the caller.
 */
export function readCSV<T>(filePath: string): T[] {
    const raw = fs.readFileSync(resolveFromRoot(filePath), 'utf-8');
    return csvParse(raw, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    }) as T[];
}

/**
 * Read a sheet from an XLSX workbook and return its rows as typed objects.
 *
 *   const rows = readXLSX<{ user: string; role: string }>(
 *     'src/testdata/roles.xlsx',
 *     'roles',
 *   );
 */
export function readXLSX<T>(filePath: string, sheet?: string): T[] {
    const wb = XLSX.readFile(resolveFromRoot(filePath));
    const sheetName = sheet ?? wb.SheetNames[0];
    if (!sheetName) throw new Error(`No sheets found in ${filePath}`);
    const ws = wb.Sheets[sheetName];
    if (!ws) throw new Error(`Sheet ${sheetName} not found in ${filePath}`);
    return XLSX.utils.sheet_to_json<T>(ws, { defval: null });
}
