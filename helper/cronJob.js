const cron = require('node-cron');
const { User } = require('../models/userModel');
const { Conversation } = require('../models/conversationModel');

cron.schedule('0 0 * * *', async () => {
    try {
        await User.updateMany(
            { resetPasswordOtpExpiration: { $lte: new Date() } },
            { $unset: { resetPasswordOtp: 1, resetPasswordOtpExpiration: 1 } }
        );
        console.log('Expired OTPs cleaned up successfully:', new Date());
    } catch (error) {
        console.error('Error cleaning up OTPs:', error);
    }
});

cron.schedule('0 0 1 * *', async () => {
    try {
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        await Conversation.updateMany(
            { updatedAt: { $lte: ninetyDaysAgo }, isArchived: { $ne: true } },
            { $set: { isArchived: true } }
        );
        console.log('Old conversations archived successfully:', new Date());
    } catch (error) {
        console.error('Error archiving conversations:', error);
    }
});