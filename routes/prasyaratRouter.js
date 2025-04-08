const express = require("express"),
  router = express.Router(),
  prasyaratController = require("../controllers/prasyaratController");

router.route("/prasyarat").get(prasyaratController.getDetail);

module.exports = router;
