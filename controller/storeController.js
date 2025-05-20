const { User } = require('../models/userModel');
const { Store } = require('../models/storeModel');
const { upload, deleteImage } = require('../helper/mediaHepler');
const { body } = require('express-validator');

exports.uploadImages = upload.array('images', 10);

exports.validateStore = [
    body('name').notEmpty().withMessage('Name is required'),
    body('type').isIn([
        'historical_site',
        'museum',
        'natural_landmark',
        'amusement_park',
        'beach',
        'park',
        'cultural_site',
        'religious_site',
        'zoo',
        'aquarium',
        'market',
        'festival',
        'viewpoint',
        'other'
    ]).withMessage('Invalid attraction type'),
    body('priceRange').isIn(['$', '$$', '$$$', '$$$$']).withMessage('Invalid price range')
];

exports.createStore = async (req, res) => {
    try {
        // Ưu tiên images từ req.body (URL Cloudinary), nếu không có thì dùng req.files
        const images = req.body.images && Array.isArray(req.body.images)
            ? req.body.images
            : req.files?.map(file => `/uploads/attractions/${file.filename}`) || [];
        
        console.log('Received store data:', { ...req.body, images }); // Ghi log để kiểm tra

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
        if (store.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        // Ưu tiên images từ req.body, nếu không có thì dùng req.files
        const images = req.body.images && Array.isArray(req.body.images)
            ? req.body.images
            : req.files?.map(file => `/uploads/attractions/${file.filename}`) || [];
        if (images.length && images !== store.images) {
            await deleteImage(store.images);
            store.images = images;
        }
        Object.assign(store, req.body);
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
        await deleteImage(store.images);
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