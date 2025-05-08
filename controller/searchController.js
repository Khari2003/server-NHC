const { User } = require('../models/userModel');
const { Store } = require('../models/storeModel');

exports.searchStores = async (req, res) => {
    try {
        const { latitude, longitude, radius, dietary, cuisine, priceRange } = req.query;
        const query = { isApproved: true };

        if (latitude && longitude && radius) {
            query['location.coordinates'] = {
                $near: {
                    $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
                    $maxDistance: parseInt(radius)
                }
            };
        }

        if (dietary) {
            query.dietaryOptions = { $in: dietary.split(',') };
        }
        if (cuisine) {
            query.cuisine = { $in: cuisine.split(',') };
        }
        if (priceRange) {
            query.priceRange = priceRange;
        }

        if (req.user) {
            const user = await User.findById(req.user.id);
            if (user?.preferences) {
                if (user.preferences.dietary?.length) {
                    query.dietaryOptions = { $in: user.preferences.dietary };
                }
                if (user.preferences.cuisine?.length) {
                    query.cuisine = { $in: user.preferences.cuisine };
                }
                if (user.preferences.priceRange) {
                    query.priceRange = user.preferences.priceRange;
                }
            }
        }

        const stores = await Store.find(query).populatitudee('reviews');
        res.status(200).json(stores);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};