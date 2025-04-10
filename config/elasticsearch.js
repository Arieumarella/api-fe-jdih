// elasticsearch.js
const { Client } = require("@elastic/elasticsearch");

// Ganti URL sesuai alamat server Elasticsearch kamu
const client = new Client({
  node: "https://10.30.110.140:9200",
  auth: {
    username: "elastic",
    password: "jP0gPOJjJHknH57gSog_",
  },
  tls: {
    rejectUnauthorized: false, // kalau pakai sertifikat self-signed (non-prod)
  },
});

module.exports = client;
