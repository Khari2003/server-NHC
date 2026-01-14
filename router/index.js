const express = require('express');
const router = express.Router();
const { authJwt } = require('../middleware/jwt');
const authorizeRequests = require('../middleware/authorization');
const errorHandler = require('../middleware/errorHandler');

const authRoutes = require('./authRoute');
const userRoutes = require('./userRoute');
const messageRoutes = require('./messageRoute');
const adminRoutes = require('./adminRoute');
const storeRoutes = require('./storeRoute');
const chatRoutes = require('./chatRoute');
const commentRoutes = require('./commentRoute');
const postRoutes = require('./postRoute');
const storiesRoutes = require('./storiesRoute');
const localVideoRoutes = require('./localVideoRoute'); 
const ocrMenuRouter = require('./ocrMenuRouter');

router.get('/', (req, res) => {
    res.send('Hello World')
  })

router.use('/api/auth', authRoutes);
router.use('/api/users', authJwt(), userRoutes);
router.use('/api/messages', authJwt(), messageRoutes);
router.use('/api/admin', authJwt(), adminRoutes);
router.use('/api/stores', storeRoutes);
router.use('/api/chat', authJwt(), chatRoutes);
router.use('/api/comments', authJwt(), commentRoutes);
router.use('/api/posts', postRoutes);
router.use('/api/stories', authJwt(), storiesRoutes);
router.use('/api/local-videos', localVideoRoutes); 
router.use('/api/ocr', ocrMenuRouter);
router.use(errorHandler);

module.exports = router;