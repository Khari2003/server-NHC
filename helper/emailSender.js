const nodemailer = require('nodemailer');

exports.sendMail = async (email, subject, body) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASS_EMAIL
            }
        });

        const mailOptions = {
            from: `"YourApp" <${process.env.EMAIL}>`,
            to: email,
            subject,
            html: body
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${email}: ${info.response}`);
        return { message: 'Email sent successfully', statusCode: 200 };
    } catch (error) {
        console.error(`Error sending email to ${email}:`, error);
        return { message: `Failed to send email: ${error.message}`, statusCode: 500 };
    }
};