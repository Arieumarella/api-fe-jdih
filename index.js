const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(cors({
  origin: '*', // Sesuaikan dengan port dan domain front-end
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));


// Router
const homeRouter = require("./routes/homeRouter.js");

app.use(homeRouter);


// Menjalankan server Express.js
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
