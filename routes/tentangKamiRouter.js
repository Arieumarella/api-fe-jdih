const express = require("express"),
  router = express.Router(),
  tentangKamiController = require("../controllers/tentangKamiController");

router.route("/tentangKami").get(tentangKamiController.getDetail);

module.exports = router;
