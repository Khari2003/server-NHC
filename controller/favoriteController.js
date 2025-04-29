const { User } = require('../models/userModel');
const { Store } = require('../models/storeModel');

exports.getUserFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('favoriteStores');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user.favoriteStores);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.addToFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const store = await Store.findById(req.body.storeId);
        if (!user || !store) {
            return res.status(404).json({ message: 'User or restaurant not found' });
        }
        if (user.favoriteStores.includes(store._id)) {
            return res.status(400).json({ message: 'Restaurant already in favorites' });
        }
        user.favoriteStores.push(store._id);
        await user.save();
        res.status(200).json({ message: 'Restaurant added to favorites' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.removeFromFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const storeId = req.body.storeId;
        if (!user.favoriteStores.includes(storeId)) {
            return res.status(400).json({ message: 'Restaurant not in favorites' });
        }
        user.favoriteStores = user.favoriteStores.filter(id => id.toString() !== storeId);
        await user.save();
        res.status(200).json({ message: 'Restaurant removed from favorites' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};