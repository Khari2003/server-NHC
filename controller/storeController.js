const { User } = require('../models/userModel');
const { Store } = require('../models/storeModel');
const { upload, deleteImage } = require('../helper/mediaHepler');
const { body } = require('express-validator');

exports.uploadImages = upload.array('images', 10);

exports.validateStore = [
    body('name').notEmpty().withMessage('Name is required'),
    body('cuisine').isArray().withMessage('Cuisine must be an array'),
    body('priceRange').isIn(['$', '$$', '$$$', '$$$$']).withMessage('Invalid price range')
];

exports.createStore = async (req, res) => {
    try {
        const images = req.files?.map(file => `/uploads/restaurants/${file.filename}`) || [];
        const store = await new Store({
            ...req.body,
            images,
            owner: req.user.id
        }).save();
        res.status(201).json(store);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

// Giữ nguyên các hàm khác
exports.updateStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        if (!store) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        if (!req.user.isAdmin && store.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const images = req.files?.map(file => `/uploads/restaurants/${file.filename}`) || [];
        if (images.length) {
            await deleteImage(store.images);
            store.images = images;
        }
        Object.assign(store, req.body);
        await store.save();
        res.status(200).json(store);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.deleteStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        if (!store) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        if (!req.user.isAdmin && store.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        await deleteImage(store.images);
        await store.deleteOne();
        res.status(204).end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id).populate('reviews');
        if (!store) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        res.status(200).json(store);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getAllStores = async (req, res) => {
    try {
        const stores = await Store.find().populate('reviews');
        res.status(200).json(stores);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};