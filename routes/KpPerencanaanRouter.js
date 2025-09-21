const express = require("express"),
  router = express.Router(),
  KpPerencanaanController = require("../controllers/KpPerencanaanController");

router
  .route("/kp-perencanaan/pagination")
  .post(KpPerencanaanController.getPaginationPerencanaanKp);

module.exports = router;
