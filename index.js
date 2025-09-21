const express = require("express");
const cors = require("cors");
const app = express();
const port = 9000;

app.use(
  cors({
    origin: "*",
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
const kontakKamiRouter = require("./routes/kontakKamiRouter.js");
const headerRouter = require("./routes/headerRouter.js");
const searchRouter = require("./routes/searchRouter.js");
const statistikRouter = require("./routes/statistikRouter.js");
const SiMPeLRouter = require("./routes/SiMPeLRouter.js");
const pengunjungJdih = require("./routes/pengunjungJdih.js");
const aiRouter = require("./routes/aiRouter.js");
const infografishRouter = require("./routes/infografishRouter.js");
const mouRouter = require("./routes/mouRouter.js");
const dokumenLangkaRouter = require("./routes/dokumenLangkaRouter.js");
const KPRouter = require("./routes/KPRouter.js");
const KpPerencanaanRouter = require("./routes/KpPerencanaanRouter.js");

app.use(homeRouter);
app.use(BelanggananDanKepuasanMasyarakatRouter);
app.use(monografiRouter);
app.use(beritaRouter);
app.use(putusanRouter);
app.use(agendaRouter);
app.use(tentangKamiRouter);
app.use(artikelRouter);
app.use(prasyaratRouter);
app.use(kontakKamiRouter);
app.use(headerRouter);
app.use(searchRouter);
app.use(statistikRouter);
app.use(SiMPeLRouter);
app.use(pengunjungJdih);
app.use(aiRouter);
app.use(infografishRouter);
app.use(mouRouter);
app.use(dokumenLangkaRouter);
app.use(KPRouter);
app.use(KpPerencanaanRouter);

// Menjalankan server Express.js
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
