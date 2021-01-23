const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    req.isAuth = false;
    return next();
  }

  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'someSuperHugeSecretFromHeaven');
  } catch (error) {
    req.isAuth = false;
    return next();
  }
  
  if (!decodedToken) {
    req.isAuth = false;
    return next();
  }

  // store the user from token and move on to the next middleware.
  req.userId = decodedToken.userId;
  req.isAuth = true;
  next();
}