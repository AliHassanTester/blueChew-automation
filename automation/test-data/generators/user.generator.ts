import { faker } from '@faker-js/faker';
import { UserRole } from '../../enums/user-role.enum';
import type { User, LoginCredentials } from '../../interfaces/user.interface';
import { uniqueEmail } from '../../helpers/test-data.helper';

/**
 * Generates typed User objects with realistic fake data via Faker.
 * All generated emails are unique across parallel test runs.
 */
export const userGenerator = {
  /**
   * Generates a complete User object. All fields are populated with
   * realistic values unless overridden via the partial parameter.
   */
  generate(overrides: Partial<User> = {}): User & { password: string } {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return {
      firstName,
      lastName,
      email: uniqueEmail(),
      password: faker.internet.password({ length: 12, memorable: false }),
      role: UserRole.USER,
      ...overrides,
    };
  },

  /** Generates a User with the admin role. */
  generateAdmin(overrides: Partial<User> = {}): User & { password: string } {
    return this.generate({ role: UserRole.ADMIN, ...overrides });
  },

  /** Generates minimal LoginCredentials (email + password only). */
  generateCredentials(): LoginCredentials {
    const user = this.generate();
    return { email: user.email, password: user.password };
  },

  /** Generates an array of N users. */
  generateMany(count: number, overrides: Partial<User> = {}): Array<User & { password: string }> {
    return Array.from({ length: count }, () => this.generate(overrides));
  },

  /** Generates a user with an intentionally invalid email for negative testing. */
  withInvalidEmail(): User & { password: string } {
    return this.generate({ email: 'not-a-valid-email' });
  },

  /** Generates a user with a password that is too short (< 8 chars). */
  withWeakPassword(): User & { password: string } {
    return this.generate({ password: 'abc' });
  },
};
