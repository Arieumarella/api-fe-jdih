const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(cors({
  origin: '*', // Sesuaikan dengan port dan domain front-end
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));


// Router
const homeRouter = require("./routes/homeRouter.js");
const BelanggananDanKepuasanMasyarakatRouter = require("./routes/BelanggananDanKepuasanMasyarakatRouter.js");

app.use(homeRouter);
app.use(BelanggananDanKepuasanMasyarakatRouter);


// Menjalankan server Express.js
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
