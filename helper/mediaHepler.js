const multer = require('multer');
const path = require('path');
const { unlink } = require('fs/promises');

const ALLOWED_EXTENSIONS = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
    'image/webp': 'webp'
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(process.cwd(), 'public/uploads'));
    },
    filename: function (req, file, cb) {
        const filename = file.originalname
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/\.(png|jpeg|jpg|webp)$/, '');
        const extension = ALLOWED_EXTENSIONS[file.mimetype];
        cb(null, `${filename}-${Date.now()}.${extension}`);
    }
});

exports.upload = multer({
    storage: storage,
    limits: { fileSize: 2000000 },
    fileFilter: function (req, file, cb) {
        const isValid = ALLOWED_EXTENSIONS[file.mimetype];
        if (!isValid) {
            return cb(new Error(
                `Invalid file type. Only ${Object.keys(ALLOWED_EXTENSIONS).join(', ')} are allowed.`
            ));
        }
        return cb(null, true);
    }
});

exports.deleteImage = async (imageUrls, continueOnErrorName = 'ENOENT') => {
    await Promise.all(
        imageUrls.map(async (url) => {
            const imagePath = path.join(process.cwd(), 'public/uploads', path.basename(url));
            try {
                await unlink(imagePath);
            } catch (error) {
                if (error.code === continueOnErrorName) {
                    console.warn(`File not found: ${imagePath}`);
                } else {
                    console.error(`Error deleting file ${imagePath}:`, error);
                    throw error;
                }
            }
        })
    );
};