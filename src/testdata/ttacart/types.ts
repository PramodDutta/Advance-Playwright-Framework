/**
 * Type declarations for the TTACart fixtures in this folder.
 *
 * Keep types close to the data: `src/testdata/ttacart/types.ts` ships with
 * `users.json`, `products.csv`, etc. so a reader can land on the data and
 * shape side-by-side.
 */

/**
 * One row of `src/testdata/ttacart/users.json`.
 *
 * `kind` is a discriminator used by spec files to branch behavioural
 * assertions (e.g. lockout users must show the lockout error, slow users
 * must take at least ~4s to log in).
 */
export interface TTAUser {
    username: string;
    password: string;
    kind: 'ok' | 'blocked' | 'broken-ui' | 'slow' | 'flaky' | 'visual';
}

/**
 * One row of `src/testdata/ttacart/products.csv`.
 *
 * `price` is stored as a string because `csv-parse` returns string cells; the
 * data-driven spec coerces to number when it needs to compare totals.
 */
export interface TTAProductRow {
    id: string;
    name: string;
    price: string;
}

/**
 * Optional `register.xlsx` fixture row. The XLSX file isn't committed to the
 * branch by default (binary fixtures bloat the repo), but the shape is
 * documented here so contributors can drop a workbook in and have the
 * data-driven specs pick it up via FileReader.readXLSX<TTARegisterRow>().
 */
export interface TTARegisterRow {
    firstName: string;
    lastName: string;
    postalCode: string;
    expectError?: string;
}
