const { User } = require('../models/userModel');
const { Store } = require('../models/storeModel');
const { upload, deleteImage } = require('../helper/mediaHepler');
const { body } = require('express-validator');

exports.uploadImages = upload.array('images', 10);

exports.validateStore = [
    body('name').optional().notEmpty().withMessage('Name is required'),
    body('type')
        .optional()
        .isIn([
            'chay-phat-giao',        // Nhà hàng chay Phật giáo (thuần chay)
            'chay-a-au',             // Nhà hàng chay Âu - Á
            'chay-hien-dai',         // Nhà hàng thuần chay hiện đại (vegan bistro/cafe)
            'com-chay-binh-dan',     // Quán cơm chay bình dân
            'buffet-chay',           // Nhà hàng buffet chay
            'chay-ton-giao-khac'     // Nhà hàng chay theo tôn giáo khác (Ấn Độ, Jain, v.v.)
        ])
        .withMessage('Invalid attraction type'),
    body('priceRange')
        .optional()
        .isIn(['Low', 'Moderate', 'High'])
        .withMessage('Invalid price range')
];

exports.createStore = async (req, res) => {
    try {
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

        let images = store.images;
        if (req.body.images && Array.isArray(req.body.images)) {
            const imagesToDelete = store.images.filter(url => !req.body.images.includes(url));
            if (imagesToDelete.length > 0) {
                await deleteImage(imagesToDelete);
            }
            images = req.body.images;
        } else if (req.files && req.files.length > 0) {
            if (store.images.length > 0) {
                await deleteImage(store.images);
            }
            images = req.files.map(file => `/uploads/attractions/${file.filename}`);
        }

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