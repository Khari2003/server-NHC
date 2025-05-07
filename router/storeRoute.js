const router = require('express').Router();
const storeController = require('../controller/storeController');
const searchController = require('../controller/searchController');
const { authJwt } = require('../middleware/jwt');
const authorizeRequests = require('../middleware/authorization');

router.get('/', storeController.getAllStores);
router.get('/search', searchController.searchStores);
router.get('/:id', storeController.getStore);
router.post('/', authJwt(), authorizeRequests, storeController.validateStore, storeController.uploadImages, storeController.createStore);
router.put('/:id', authJwt(), authorizeRequests, storeController.validateStore, storeController.uploadImages, storeController.updateStore);
router.delete('/:id', authJwt(), authorizeRequests, storeController.deleteStore);

module.exports = router;