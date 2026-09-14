import { generateRandomAlphanumeric } from './random.utils';
import { MedicalDetails, ShippingDetails } from '@interfaces/signup-to-approved-order.interface';

const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert',
  'Jennifer', 'Michael', 'Linda', 'William', 'Barbara',
  'David', 'Susan', 'Richard', 'Jessica', 'Thomas',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
  'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore',
];

const CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
  'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Atlanta',
];

const STATES = ['New York', 'California', 'Texas', 'Florida', 'Georgia'];

const STREETS = ['Main', 'Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Washington', 'Lake', 'Hill', 'Park'];

const STREET_TYPES = ['St', 'Ave', 'Blvd', 'Ln', 'Rd', 'Dr', 'Ct', 'Way'];

const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

export interface GeneratedTestAccount {
  email: string;
  firstName: string;
  lastName: string;
  birthday: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  medical: MedicalDetails;
  shipping: ShippingDetails;
}

/**
 * Generates a random Date of Birth (MM/DD/YYYY) for an adult between minAge and maxAge (defaults: 18–80).
 */
export function generateRandomDOB(minAge = 18, maxAge = 80): string {
  const now = new Date();
  const oldest = new Date(now.getFullYear() - maxAge, now.getMonth(), now.getDate()).getTime();
  const youngest = new Date(now.getFullYear() - minAge, now.getMonth(), now.getDate()).getTime();
  const d = new Date(oldest + Math.random() * (youngest - oldest));
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}

/**
 * Builds a fresh, correlated test account with realistic demographic data.
 * A single runId (random alphanumeric + timestamp) is embedded into the email,
 * name, and address so every field can be easily tracked and audited in databases/admin portals.
 *
 * @param suffix Optional suffix attached to the email address (e.g. 'stripe', 'sildenafil', 'gold')
 */
export function buildTestAccount(suffix = 'test'): GeneratedTestAccount {
  const runId = `${generateRandomAlphanumeric(4)}.${Date.now()}`;
  const firstName = `${pick(FIRST_NAMES)}.${runId}`;
  const lastName = `${pick(LAST_NAMES)}.${runId}`;
  const birthday = generateRandomDOB();
  const streetAddress = `${Math.floor(Math.random() * 9999) + 1} ${pick(STREETS)} ${pick(STREET_TYPES)} ${runId}`;
  const city = 'New York';
  const state = 'New York';
  const zip = '10001';
  const phone = '2125550100';
  const email = `test.${runId}+${suffix}@meds.com`;

  return {
    email,
    firstName,
    lastName,
    birthday,
    streetAddress,
    city,
    state,
    zip,
    phone,
    medical: {
      firstName,
      lastName,
      birthday,
    },
    shipping: {
      streetAddress,
      city,
      state,
      zip,
      phone,
    },
  };
}

/**
 * TestDataUtils
 * Reusable static helpers for ad-hoc random demographic generation.
 */
export class TestDataUtils {
  static generateRandomName(): string {
    return pick(FIRST_NAMES);
  }

  static generateRandomLastName(): string {
    return pick(LAST_NAMES);
  }

  static generateRandomCity(): string {
    return pick(CITIES);
  }

  static generateRandomZip(): string {
    return String(Math.floor(10000 + Math.random() * 90000));
  }

  static generateRandomState(): string {
    return pick(STATES);
  }

  static generateRandomAddress(): string {
    const num = Math.floor(100 + Math.random() * 9900);
    return `${num} ${pick(STREETS)} ${pick(STREET_TYPES)}`;
  }

  static generateRandomDOB(minAge = 18, maxAge = 80): string {
    return generateRandomDOB(minAge, maxAge);
  }

  static buildAccount(suffix = 'test'): GeneratedTestAccount {
    return buildTestAccount(suffix);
  }
}
