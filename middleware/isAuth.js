const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    req.isAuth = false;
    req.next();
  }

  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'someSuperHugeSecretFromHeaven');
  } catch (error) {
    req.isAuth = false;
    req.next();
  }
  
  if (!decodedToken) {
    req.isAuth = false;
    req.next();
  }

  // store the user from token and move on to the next middleware.
  req.userId = decodedToken.userId;
  req.isAuth = true;
  next();
}