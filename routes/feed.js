const express = require('express');
const { body } =  require('express-validator');
const feedController = require('../controllers/feed');
const isAuth = require('../middleware/isAuth');

const router = express.Router();

//GET All /feed/posts
router.get('/posts', isAuth, feedController.getPosts);    

//POST /feed/post
router.post(
  '/post', 
  isAuth, 
  [
    body('title').trim().isLength({min: 5}),
    body('content').trim().isLength({min: 5})
  ], 
  feedController.createPost
);  

//GET One /feed/post
router.get('/post/:postId', isAuth, feedController.getPost);

//PUT Update One /feed/post
router.put(
  '/post/:postId', 
  isAuth, 
  [
    body('title').trim().isLength({min: 5}),
    body('content').trim().isLength({min: 5})
  ],
  feedController.updatePost
);

//DELETE Delete One /feed/post
router.delete('/post/:postId', isAuth, feedController.deletePost);

module.exports = router;