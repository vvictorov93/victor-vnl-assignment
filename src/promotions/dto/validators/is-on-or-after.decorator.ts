import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsOnOrAfter(
  propertyName: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyKey: string) {
    registerDecorator({
      name: 'isOnOrAfter',
      target: object.constructor,
      propertyName: propertyKey,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const constraints = args.constraints as unknown[];
          const relatedPropertyName = constraints[0];

          if (typeof relatedPropertyName !== 'string') {
            return false;
          }

          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];

          if (typeof value !== 'string' || typeof relatedValue !== 'string') {
            return false;
          }

          return new Date(value).getTime() >= new Date(relatedValue).getTime();
        },
      },
    });
  };
}
