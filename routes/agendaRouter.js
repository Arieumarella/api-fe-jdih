const express = require("express"),
  router = express.Router(),
  agendaController = require("../controllers/agendaController");

router.route("/agenda/pagination").post(agendaController.pagination);

module.exports = router;
