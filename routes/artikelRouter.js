const express = require("express"),
  router = express.Router(),
  artikelController = require("../controllers/artikelController");

router.route("/artikel/pagination").post(artikelController.pagination);

module.exports = router;
