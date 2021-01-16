const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    const error = new Error('User is not authenticated.');
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'someSuperHugeSecretFromHeaven');
  } catch (error) {
    err.statusCode = 500;
    throw err;
  }
  
  if (!decodedToken) {
    const error = new Error('User is not authenticated.');
    error.statusCode = 401;
    throw error;
  }

  // store the user from token and move on to the next middleware.
  req.userId = decodedToken.userId;
  next();
}