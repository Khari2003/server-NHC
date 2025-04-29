exports.buildReviewEmail = (userName, review, storeName, isReply = false) => {
    const subject = isReply ? `New Reply to Your Review for ${storeName}` : `Your Review for ${storeName}`;
    const message = isReply
        ? `Your review for ${storeName} has received a reply.`
        : `Thank you for reviewing ${storeName}! Your feedback helps others discover great restaurants.`;

    const imageHtml = review.images?.length
        ? review.images.map(img => `<img src="${img}" alt="Review Image" style="max-width: 100px; margin: 5px;" />`).join('')
        : '';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${subject}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .review { border: 1px solid #ddd; padding: 15px; margin: 10px 0; background: #fff; }
            .rating { color: #f39c12; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Hello ${userName},</h2>
            <p>${message}</p>
            <div class="review">
                <p><strong>Restaurant:</strong> ${storeName}</p>
                <p><strong>Rating:</strong> <span class="rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span></p>
                <p><strong>Comment:</strong> ${review.comment}</p>
                ${imageHtml ? `<p><strong>Images:</strong><br>${imageHtml}</p>` : ''}
                ${isReply ? `<p><strong>Reply:</strong> ${review.reply || 'No reply yet'}</p>` : ''}
            </div>
            <p><a href="https://your-app.com" style="color: #007bff;">Explore more restaurants!</a></p>
            <div class="footer">This email was sent by YourApp. &copy; ${new Date().getFullYear()}</div>
        </div>
    </body>
    </html>
    `;
};