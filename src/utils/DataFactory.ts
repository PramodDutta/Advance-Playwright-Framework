import { faker } from '@faker-js/faker';

/**
 * Guest checkout payload for TTACart step-one form.
 */
export interface GuestUser {
    firstName: string;
    lastName: string;
    postalCode: string;
}

/**
 * Dummy card object - the TTACart UI does not collect card details, but the
 * lesson code shows how a real e-commerce flow would synthesise one.
 */
export interface CardInfo {
    number: string;
    expiry: string;
    cvc: string;
    holder: string;
}

/**
 * Product shape used by the TTACart inventory.
 */
export interface ProductInfo {
    id: string;
    name: string;
    price: number;
}

/**
 * Canonical TTACart catalogue. Kept here so factory + tests share a single
 * source of truth instead of drifting from the JSON/CSV fixtures.
 */
export const TTA_PRODUCTS: ProductInfo[] = [
    { id: 'tta-practice-backpack', name: 'TTA Practice Backpack', price: 29.99 },
    { id: 'tta-bike-light', name: 'TTA Bike Light', price: 9.99 },
    { id: 'tta-bolt-tshirt', name: 'TTA Bolt T-Shirt', price: 15.99 },
    { id: 'tta-fleece-jacket', name: 'TTA Fleece Jacket', price: 49.99 },
    { id: 'tta-junior-tester-onesie', name: 'TTA Junior Tester Onesie', price: 7.99 },
    { id: 'test-allthethings-tshirt-red', name: 'Test.allTheThings T-Shirt (Red)', price: 15.99 },
];

/**
 * 5-digit US zip. TTACart only validates "non-empty", but we use a realistic
 * value so the test reads like a real-world flow.
 */
export function randomZip(): string {
    return faker.location.zipCode('#####');
}

export function generateUser(): GuestUser {
    return {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        postalCode: randomZip(),
    };
}

export function generateCard(): CardInfo {
    return {
        // Faker's CC numbers pass Luhn but are not live PANs.
        number: faker.finance.creditCardNumber('visa'),
        expiry: '12/30',
        cvc: faker.finance.creditCardCVV(),
        holder: `${faker.person.firstName()} ${faker.person.lastName()}`,
    };
}

export function pickProduct(): ProductInfo {
    return faker.helpers.arrayElement(TTA_PRODUCTS);
}
