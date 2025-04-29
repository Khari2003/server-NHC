const router = require('express').Router();
const adminController = require('../controller/adminController/adminController');

router.get('/user/count', adminController.getUserCount);
router.delete('/user/:id', adminController.deleteUser);
router.get('/stores', adminController.getStores);
router.put('/stores/:storeId/approve', adminController.approveStore);
router.delete('/stores/:storeId', adminController.deleteStore);
router.get('/reviews', adminController.getReviews);

module.exports = router;