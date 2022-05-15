const multer = require('multer');

const storage = multer.diskStorage({
  destination: 'public/storage/files',
  filename: (req, file, cb) => {
    const name = file.originalname.toLocaleLowerCase().split(' ').join('-');
    const fileName = `${Date.now()}-${name}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });

module.exports = upload;
