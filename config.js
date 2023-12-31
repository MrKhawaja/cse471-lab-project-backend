const multer = require("multer");

const jwt_secret = "secret";
const port = 3001;
const host = "http://localhost:" + port;
const uploads = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
      cb(
        null,
        file.fieldname + Date.now() + file.originalname.replace(/\s/g, "-")
      );
    },
  }),
});

module.exports = { jwt_secret, port, uploads, host };
