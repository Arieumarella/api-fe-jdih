const express = require("express"),
  router = express.Router(),
  KPController = require("../controllers/KPController");

router.route("/KP/pagination").post(KPController.getPaginationKP);
router.route("/KP/detail").post(KPController.getDetailKP);
router.route("/KP/addView").post(KPController.addView);

module.exports = router;
