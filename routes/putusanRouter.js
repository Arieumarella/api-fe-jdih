const express = require("express"),
  router = express.Router(),
  putusanController = require("../controllers/putusanController");

router.route("/putusan/detail").post(putusanController.getDetail);

router
  .route("/putusan/pagination")
  .post(putusanController.getPaginationPutusan);

router
  .route("/putusan/insertViews")
  .post(putusanController.insertViews);

module.exports = router;
