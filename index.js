const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(
  cors({
    origin: "*", // Sesuaikan dengan port dan domain front-end
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Router
const homeRouter = require("./routes/homeRouter.js");
const BelanggananDanKepuasanMasyarakatRouter = require("./routes/BelanggananDanKepuasanMasyarakatRouter.js");
const monografiRouter = require("./routes/monografiRouter.js");
const beritaRouter = require("./routes/beritaRouter.js");
const putusanRouter = require("./routes/putusanRouter.js");
const agendaRouter = require("./routes/agendaRouter.js");
const artikelRouter = require("./routes/artikelRouter.js");
const tentangKamiRouter = require("./routes/tentangKamiRouter.js");
const prasyaratRouter = require("./routes/prasyaratRouter.js");

app.use(homeRouter);
app.use(BelanggananDanKepuasanMasyarakatRouter);
app.use(monografiRouter);
app.use(beritaRouter);
app.use(putusanRouter);
app.use(agendaRouter);
app.use(tentangKamiRouter);
app.use(artikelRouter);
app.use(prasyaratRouter);

// Menjalankan server Express.js
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
