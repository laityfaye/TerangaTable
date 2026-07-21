import { registerDecorator, ValidationOptions } from 'class-validator';

const LOOSE_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// `@IsUUID()` de class-validator impose les nibbles de version/variante (RFC 4122).
// Nos IDs seedés à la main (plans, tenant plateforme, rôles système — cf.
// packages/database/prisma/seed.ts) sont au format 8-4-4-4-12 mais ne respectent
// pas ces nibbles ; Postgres (colonne `uuid` native) les accepte sans problème,
// seule cette validation stricte les rejetait. Ce validateur ne vérifie que la forme.
export function IsLooseUuid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isLooseUuid',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && LOOSE_UUID_REGEX.test(value);
        },
        defaultMessage(): string {
          return `${propertyName} must be a UUID`;
        },
      },
    });
  };
}
