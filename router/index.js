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
const reviewController = require('../controller/reviewController');

router.get('/', (req, res) => {
    res.send('Hello World')
  })

router.use('/api/auth', authRoutes);
router.use('/api/users', authJwt(), userRoutes);
router.use('/api/messages', authJwt(), messageRoutes);
router.use('/api/admin', authJwt(), adminRoutes);
router.use('/api/stores', storeRoutes);
router.get('/api/stores/:id/reviews', reviewController.getStoreReviews);
router.post('/api/stores/:id/reviews', authJwt(), authorizeRequests, reviewController.uploadImages, reviewController.validateReview, reviewController.leaveReview);
router.use(errorHandler);

module.exports = router;