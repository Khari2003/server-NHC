const { LocalVideo } = require('../models/localVideoModel');
const fs = require('fs');

exports.getAllVideos = async (req, res) => {
    try {
        const videos = await LocalVideo.find();
        res.status(200).json(videos);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách video:', error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.streamVideo = (req, res) => {
    LocalVideo.findOne({ filename: req.params.filename })
        .then(video => {
            if (!video) {
                return res.status(404).json({ message: 'Không tìm thấy video' });
            }
            // Dùng trực tiếp video.path, chuẩn hóa dấu \ thành /
            const videoPath = video.path.replace(/\\/g, '/');
            if (!fs.existsSync(videoPath)) {
                return res.status(404).json({ message: 'Không tìm thấy file video' });
            }
            const stat = fs.statSync(videoPath);
            const fileSize = stat.size;
            const range = req.headers.range;

            if (range) {
                const parts = range.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                const chunksize = (end - start) + 1;
                const file = fs.createReadStream(videoPath, { start, end });
                const head = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'video/mp4',
                };
                res.writeHead(206, head);
                file.pipe(res);
            } else {
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': 'video/mp4',
                };
                res.writeHead(200, head);
                fs.createReadStream(videoPath).pipe(res);
            }
        })
        .catch(error => {
            console.error('Lỗi khi stream video:', error);
            res.status(500).json({ type: error.name, message: error.message });
        });
};