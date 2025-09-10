const { Story } = require('../models/storyModel');
const { User } = require('../models/userModel');
const { validationResult } = require('express-validator');

exports.createStory = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { caption, blurHash, isImage, storyUrl } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const story = new Story({
            publisher: user._id,
            caption,
            blurHash,
            isImage,
            storyId: `story_${Date.now()}`,
            storyUrl,
            likes: [],
            comments: []
        });
        await story.save();
        user.stories.push(story.storyId);
        await user.save();
        res.status(201).json(story);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.deleteStory = async (req, res) => {
    try {
        const story = await Story.findOne({ storyId: req.params.storyId });
        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }
        if (story.publisher.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        await User.updateMany(
            { stories: story.storyId },
            { $pull: { stories: story.storyId } }
        );
        await Story.findOneAndDelete({ storyId: req.params.storyId });
        res.status(204).end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getStoriesInfo = async (req, res) => {
    try {
        const { userIds } = req.body;
        const users = await User.find({ _id: { $in: userIds } })
            .select('stories name userName profileImageUrl');
        let storiesInfo = [];
        for (const user of users) {
            const stories = await Story.find({ storyId: { $in: user.stories } })
                .populate('publisher', 'name userName profileImageUrl');
            storiesInfo = storiesInfo.concat(stories.filter(story => story.storyUrl));
        }
        if (!storiesInfo.length) {
            return res.status(404).json({ message: 'No stories found' });
        }
        res.status(200).json(storiesInfo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};