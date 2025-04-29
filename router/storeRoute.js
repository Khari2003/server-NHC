const router = require('express').Router();
const storeController = require('../controller/storeController');
const searchController = require('../controller/searchController');

router.get('/', storeController.getAllStores);
router.get('/search', searchController.searchStores);
router.get('/:id', storeController.getStore);
router.post('/', storeController.validateStore, storeController.uploadImages, storeController.createStore);
router.put('/:id', storeController.validateStore, storeController.uploadImages, storeController.updateStore);
router.delete('/:id', storeController.deleteStore);

module.exports = router;