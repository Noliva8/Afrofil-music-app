import { GraphQLScalarType, Kind } from 'graphql';

// Define the custom Date scalar
const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'A valid date',
  serialize(value) {
    return value instanceof Date ? value.toISOString() : null; // Convert outgoing Date to string
  },
  parseValue(value) {
    return new Date(value); // Convert incoming string to Date
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value); // Convert hard-coded AST string to Date
    }
    return null; // Invalid hard-coded value (not a string)
  },
});

// Export both the Date and Upload scalars
export { DateScalar };