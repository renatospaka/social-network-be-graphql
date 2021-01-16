const bcrypt = require('bcryptjs');
const User = require('../models/user');

module.exports = {
  createUser: async function({ userInput }, req) {
    const existingUser = await User.findOne({email: userInput.email});
    if (existingUser) {
      const error = new Error('E-mail already exists!');
      throw error;
    }

    const hashPassword = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      name: userInput.name,
      email: userInput.email,
      password: hashPassword
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  }
};
