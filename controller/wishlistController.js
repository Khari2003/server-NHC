const { User } = require('../models/userModel');
const { Store } = require('../models/storeModel');

exports.getUserWishList = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('wishList');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user.wishList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.addToWishList = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const store = await Store.findById(req.body.storeId);
        if (!user || !store) {
            return res.status(404).json({ message: 'User or restaurant not found' });
        }
        if (user.wishList.includes(store._id)) {
            return res.status(400).json({ message: 'Restaurant already in wishlist' });
        }
        user.wishList.push(store._id);
        await user.save();
        res.status(200).json({ message: 'Restaurant added to wishlist' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.removeFromWishList = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const storeId = req.body.storeId;
        if (!user.wishList.includes(storeId)) {
            return res.status(400).json({ message: 'Restaurant not in wishlist' });
        }
        user.wishList = user.wishList.filter(id => id.toString() !== storeId);
        await user.save();
        res.status(200).json({ message: 'Restaurant removed from wishlist' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};