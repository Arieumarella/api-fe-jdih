const express = require("express"),
  router = express.Router(),
  SiMPeLController = require("../controllers/SiMPeLController");

router
  .route("/SiMPeL")
  .post(SiMPeLController.getDataSimpel);

module.exports = router;
