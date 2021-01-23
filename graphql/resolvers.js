const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post')

module.exports = {
  createUser: async function({ userInput }, req) {
    //validating inputs
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({message: 'E-mail is not valid.'});
    }
    if (
        validator.isEmpty(userInput.password) || 
        !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({message: 'Password min length is 5.'});
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input.');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    //process user creation
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
  },

  login: async function({ email, password }) {
    //finds user
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error('User not found or incorrect password.');
      error.code= 401;
      throw error;
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error('User not found or incorrect password.');
      error.code= 401;
      throw error;
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email
      }, 
      'someSuperHugeSecretFromHeaven', 
      { expiresIn: '30m' }
    );
    return { token: token, userId: user._id.toString() };
  },

  createPost: async function({ postInput }, req) {
    console.log(postInput.title, postInput.title.length);
    console.log(validator.isEmpty(postInput.title));
    console.log(validator.isLength(postInput.title, { min: 5 }));
    
    console.log(postInput.content, postInput.content.length);
    console.log(validator.isEmpty(postInput.content));
    console.log(validator.isLength(postInput.content, { min: 5 }));
    const errors = [];
    if (
      validator.isEmpty(postInput.title) || 
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: 'Title is invalid.' });
    }
    if (
      validator.isEmpty(postInput.content) || 
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({ message: 'Content is invalid.' });
    }
  
    if (errors.length > 0) {
      //const error = new Error('Invalid input.');
      const error = new Error(errors[0].message);
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl
    });
    const createdPost = await post.save();

    //add post to user

    return {
      ...createdPost._doc, 
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString()
    }
  }
}
