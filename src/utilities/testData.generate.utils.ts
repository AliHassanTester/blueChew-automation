export class TestDataUtils {
  private static readonly firstNames = [
    'James', 'Mary', 'John', 'Patricia', 'Robert',
    'Jennifer', 'Michael', 'Linda', 'William', 'Barbara',
    'David', 'Susan', 'Richard', 'Jessica', 'Thomas',
  ];

  private static readonly lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
    'Garcia', 'Miller', 'Davis', 'Martinez', 'Wilson',
  ];

  private static readonly cities = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
    'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
  ];

  private static readonly states = [
    'CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI',
  ];

  private static readonly streets = [
    'Oak', 'Main', 'Maple', 'Cedar', 'Pine',
    'Elm', 'Washington', 'Lake', 'Hill', 'Park',
  ];

  static generateRandomName(): string {
    return this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
  }

  static generateRandomLastName(): string {
    return this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
  }

  static generateRandomCity(): string {
    return this.cities[Math.floor(Math.random() * this.cities.length)];
  }

  static generateRandomZip(): string {
    return String(Math.floor(10000 + Math.random() * 90000));
  }

  static generateRandomState(): string {
    return this.states[Math.floor(Math.random() * this.states.length)];
  }

  static generateRandomAddress(): string {
    const num = Math.floor(100 + Math.random() * 9900);
    const street = this.streets[Math.floor(Math.random() * this.streets.length)];
    return `${num} ${street} St`;
  }
}
