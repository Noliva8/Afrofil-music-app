import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';

const secret = 'ndicunguyemutoniazabe';
const expiration = '2h';

export const AuthenticationError = new GraphQLError('Could not authenticate artist.', {
  extensions: {
    code: 'UNAUTHENTICATED',
  },
});

export const artist_authMiddleware = ({ req }) => {
  let token = req.body.token || req.query.token || req.headers.authorization;

  if (req.headers.authorization) {
    token = token.split(' ').pop().trim();
  }

  if (!token) {
    return req;
  }

  try {
    const { data } = jwt.verify(token, secret, { maxAge: expiration });
    req.artist = data;
  } catch {
    console.log('Invalid token');
  }

  return req;
};

export const signToken = ({ email, username, role, artistAka, _id,}) => {
  const payload = { email, username, role, artistAka, _id };
  return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
};
