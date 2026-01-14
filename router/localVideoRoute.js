const router = require('express').Router();
const localVideoController = require('../controller/localVideoController');

router.get('/', localVideoController.getAllVideos);
router.get('/stream/:filename', localVideoController.streamVideo);

module.exports = router;