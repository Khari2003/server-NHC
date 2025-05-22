const { User } = require('../models/userModel');
const { Store } = require('../models/storeModel');
const { upload, deleteImage } = require('../helper/mediaHepler');
const { body } = require('express-validator');

exports.uploadImages = upload.array('images', 10);

exports.validateStore = [
    // For POST: All fields are required
    body('name').optional().notEmpty().withMessage('Name is required'),
    body('type')
        .optional()
        .isIn([
            'Di tích lịch sử',
            'Bảo tàng',
            'Di tích tự nhiên',
            'Trung tâm giải trí',
            'Công viên',
            'Di tích văn hóa',
            'Di tích tôn giáo',
            'Sở thú',
            'Thủy cung',
            'Nhà hàng',
            'Địa điểm ngắm cảnh',
            'Rạp chiếu phim',
            'Khác'
        ])
        .withMessage('Invalid attraction type'),
    body('priceRange')
        .optional()
        .isIn(['Miễn phí', 'Thấp', 'Tầm trung', 'Cao cấp', 'Sang trọng'])
        .withMessage('Invalid price range')
];

exports.createStore = async (req, res) => {
    try {
        // Validate required fields for creation
        if (!req.body.name || !req.body.type || !req.body.priceRange) {
            return res.status(400).json({ message: 'Name, type, and priceRange are required' });
        }

        const images = req.body.images && Array.isArray(req.body.images)
            ? req.body.images
            : req.files?.map(file => `/uploads/attractions/${file.filename}`) || [];
        
        console.log('Received store data:', { ...req.body, images });

        const store = await new Store({
            ...req.body,
            images,
            owner: req.user.id
        }).save();
        res.status(201).json(store);
    } catch (error) {
        console.error('Error creating store:', error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.updateStore = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const store = await Store.findById(req.params.id);
        if (!store) {
            return res.status(404).json({ message: 'Attraction not found' });
        }
        if (!req.user.isAdmin && store.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Handle images: Prioritize req.body.images, fallback to req.files or keep existing
        let images = store.images;
        if (req.body.images && Array.isArray(req.body.images)) {
            // Compare new images with old ones to delete unused images
            const imagesToDelete = store.images.filter(url => !req.body.images.includes(url));
            if (imagesToDelete.length > 0) {
                await deleteImage(imagesToDelete);
            }
            images = req.body.images;
        } else if (req.files && req.files.length > 0) {
            // If new files are uploaded, delete all old images
            if (store.images.length > 0) {
                await deleteImage(store.images);
            }
            images = req.files.map(file => `/uploads/attractions/${file.filename}`);
        }

        // Update only provided fields
        const updateData = {
            ...req.body,
            images,
            updatedAt: Date.now()
        };
        Object.assign(store, updateData);
        await store.save();
        res.status(200).json(store);
    } catch (error) {
        console.error('Error updating store:', error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.deleteStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        if (!store) {
            return res.status(404).json({ message: 'Attraction not found' });
        }
        if (!req.user.isAdmin && store.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        if (store.images.length > 0) {
            await deleteImage(store.images);
        }
        await store.deleteOne();
        res.status(204).end();
    } catch (error) {
        console.error('Error deleting store:', error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id).populate('reviews');
        if (!store) {
            return res.status(404).json({ message: 'Attraction not found' });
        }
        res.status(200).json(store);
    } catch (error) {
        console.error('Error getting store:', error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getAllStores = async (req, res) => {
    try {
        const stores = await Store.find().populate('reviews');
        res.status(200).json(stores);
    } catch (error) {
        console.error('Error getting stores:', error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};