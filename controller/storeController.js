const { User } = require('../models/userModel');
const { Store } = require('../models/storeModel');
const { upload, deleteImage } = require('../helper/mediaHepler');
const { body } = require('express-validator');

exports.uploadImages = upload.array('images', 10);

exports.validateStore = [
    body('name').notEmpty().withMessage('Tên cửa hàng không được để trống'),
    body('type')
        .isIn([
            'chay-phat-giao',        // Nhà hàng chay Phật giáo (thuần chay)
            'chay-a-au',             // Nhà hàng chay Âu - Á
            'chay-hien-dai',         // Nhà hàng thuần chay hiện đại (vegan bistro/cafe)
            'com-chay-binh-dan',     // Quán cơm chay bình dân
            'buffet-chay',           // Nhà hàng buffet chay
            'chay-ton-giao-khac'     // Nhà hàng chay theo tôn giáo khác (Ấn Độ, Jain, v.v.)
        ])
        .withMessage('Loại cửa hàng không hợp lệ'),
    body('priceRange')
        .isIn(['Low', 'Moderate', 'High'])
        .withMessage('Khoảng giá không hợp lệ'),
    body('location.address').notEmpty().withMessage('Địa chỉ không được để trống')
];

exports.createStore = async (req, res) => {
    try {
        console.log('Dữ liệu nhận được:', req.body); // Log để debug

        // Kiểm tra địa chỉ trùng lặp
        const existingStore = await Store.findOne({ 
            'location.address': req.body.location.address,
            'location.city': req.body.location.city,
            'location.country': req.body.location.country
        });
        
        if (existingStore) {
            return res.status(400).json({ message: 'Đã tồn tại một cửa hàng với địa chỉ này' });
        }

        const images = req.body.images && Array.isArray(req.body.images)
            ? req.body.images
            : req.files?.map(file => `/uploads/attractions/${file.filename}`) || [];
        
        const menu = req.body.menu && Array.isArray(req.body.menu)
            ? req.body.menu
            : [];
        
        const description = req.body.description || null;

        console.log('Dữ liệu cửa hàng nhận được:', { ...req.body, images, menu, description });

        const store = await new Store({
            ...req.body,
            images,
            menu,
            description,
            owner: req.user.id
        }).save();
        res.status(201).json(store);
    } catch (error) {
        console.error('Lỗi khi tạo cửa hàng:', error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

// ... phần còn lại của file giữ nguyên
exports.updateStore = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Yêu cầu xác thực' });
        }
        const store = await Store.findById(req.params.id);
        if (!store) {
            return res.status(404).json({ message: 'Không tìm thấy cửa hàng' });
        }
        if (!req.user.isAdmin && store.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Không được phép' });
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
            menu: req.body.menu && Array.isArray(req.body.menu) ? req.body.menu : store.menu,
            description: req.body.description !== undefined ? req.body.description : store.description,
            updatedAt: Date.now()
        };
        Object.assign(store, updateData);
        await store.save();
        res.status(200).json(store);
    } catch (error) {
        console.error('Lỗi khi cập nhật cửa hàng:', error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.deleteStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        if (!store) {
            return res.status(404).json({ message: 'Không tìm thấy cửa hàng' });
        }
        if (!req.user.isAdmin && store.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Không được phép' });
        }
        if (store.images.length > 0) {
            await deleteImage(store.images);
        }
        await store.deleteOne();
        res.status(204).end();
    } catch (error) {
        console.error('Lỗi khi xóa cửa hàng:', error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id).populate('reviews');
        if (!store) {
            return res.status(404).json({ message: 'Không tìm thấy cửa hàng' });
        }
        res.status(200).json(store);
    } catch (error) {
        console.error('Lỗi khi lấy thông tin cửa hàng:', error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getAllStores = async (req, res) => {
    try {
        const stores = await Store.find().populate('reviews');
        res.status(200).json(stores);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách cửa hàng:', error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};