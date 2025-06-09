const { User } = require('../models/userModel');
const { Store } = require('../models/storeModel');
const { Review } = require('../models/reviewModel');
const { buildReviewEmail } = require('../helper/reviewEmailBuilder');
const emailSender = require('../helper/emailSender');
const { upload } = require('../helper/mediaHepler');
const { body } = require('express-validator');

exports.uploadImages = upload.array('images', 5);

exports.validateReview = [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().withMessage('Comment must be a string')
];

exports.leaveReview = async function (req, res) {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tìm thấy' });
        }
        const store = await Store.findById(req.params.id);
        if (!store) {
            return res.status(404).json({ message: 'Nhà hàng không tìm thấy' });
        }
        const images = req.files?.map(file => `/uploads/restaurants/${file.filename}`) || [];
        const review = await new Review({
            user: user._id,
            userName: user.name,
            store: store._id,
            comment: req.body.comment,
            rating: req.body.rating,
            images
        }).save();

        // Khởi tạo reviews nếu không tồn tại
        store.reviews = store.reviews || [];
        store.reviews.push(review._id);

        // Tính lại điểm đánh giá trung bình
        const reviews = await Review.find({ store: store._id });
        const averageRating = reviews.length > 0
            ? parseFloat((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
            : 0;
        store.rating = averageRating;

        await store.save();
        res.status(201).json(review);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getStoreReviews = async function (req, res) {
    try {
        const store = await Store.findById(req.params.id);
        if (!store) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        const page = parseInt(req.query.page) || 1;
        const pageSize = 10;
        const reviews = await Review.find({ store: store._id })
            .populate('user', 'name')
            .sort({ date: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize);
        res.status(200).json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};