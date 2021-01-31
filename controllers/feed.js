const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');

const io = require('../socket');
const Post = require('../models/post');
const User = require('../models/user');

const { clearImage } = require('./util//file');

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate('creator')
      .sort({createAt: -1})
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200)
      .json({ message: 'Fetched posts successfully.', posts: posts, totalItems: totalItems });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    };
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed. Entered data is invalid.');
    error.statusCode = 422; // this is an arbitrary named variable
    throw error;
  }
  if (!req.file) {
    const error = new Error('Image not informed.');
    error.statusCode = 422; // this is an arbitrary named variable
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.file.path;
  const post = new Post({
    title: title, 
    content: content,
    imageUrl: imageUrl,
    creator: req.userId
  });
    
  try {
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    io.getIO().emit('newPost', {
      action: 'create', 
      post: {
        ...post._doc, 
        creator: {_id: req.userId, name: user.name }
      } 
    });
    res.status(201)
      .json({ message: 'Post created successfully', post: post, creator: { _id: user._id, name: user.name }}); 
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    };
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error('Post does not exist.');
      error.statusCode = 404; // this is an arbitrary named variable
      throw error;
    }

    res.status(200).json({ message: 'Post fetched', post: post });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    };
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed. Entered data is invalid.');
    error.statusCode = 422; // this is an arbitrary named variable
    throw error;
  }
  const content = req.body.content;
  const title = req.body.title;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  };
  if (!imageUrl) {
    const error = new Error('Image not informed.');
    error.statusCode = 422;  
    throw error;
  }

  try {
    const post = await Post.findById(postId).populate('creator');
    if (!post) {
      const error = new Error('Post does not exist.');
      error.statusCode = 404; // this is an arbitrary named variable
      throw error;
    }
    if (post.creator._id.toString() !== req.userId) {
      const error = new Error('You are not authorized.');
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }
    
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;
    const updPost = await post.save();
    io.getIO().emit('newPost', { action: 'update', post: updPost });

    res.status(200).json({ message: 'Post updated successfully.', post: updPost });
  } catch (error) {
    if (!err.statusCode) {
      err.statusCode = 500;
    };
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId)
    if (!post) {
      const error = new Error('Post does not exist.');
      error.statusCode = 404; // this is an arbitrary named variable
      throw error;
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error('You are not authorized.');
      error.statusCode = 403;
      throw error;
    }
    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId);
    
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();
    io.getIO().emit('newPost', { action: 'delete', post: postId });

    res.status(200).json({ message: 'Post deleted successfully.' });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    };
    next(err);
  }
};
