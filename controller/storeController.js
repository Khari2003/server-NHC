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
        const images = req.files?.map(file => `/uploads/attractions/${file.filename}`) || [];
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
        const images = req.files?.map(file => `/uploads/attractions/${file.filename}`) || [];
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
            return res.status(404).json({ message: 'Attraction not found' });
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
            return res.status(404).json({ message: 'Attraction not found' });
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