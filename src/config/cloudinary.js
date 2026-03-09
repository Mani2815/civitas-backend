const cloudinary = require('cloudinary').v2;

const configureCloudinary = () => {
    if (process.env.USE_CLOUDINARY === 'true') {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        console.log('Cloudinary configured successfully');
    }
};

module.exports = { cloudinary, configureCloudinary };
