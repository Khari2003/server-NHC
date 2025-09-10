const router = require('express').Router();
const StoryController = require('../controller/storyController');

// Story Routes
router.post('/', StoryController.createStory);
router.delete('/:storyId', StoryController.deleteStory);
router.post('/specific', StoryController.getStoriesInfo);

module.exports = router;