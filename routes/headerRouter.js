const express = require("express"),
  router = express.Router(),
  headerController = require("../controllers/headerController");

router
  .route("/header/getJenisPeraturan")
  .get(headerController.getJenisPeraturan);

module.exports = router;
