require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.ZENDESK_JWT_SECRET;

if (!JWT_SECRET) {
  console.error("Erro: variável ZENDESK_JWT_SECRET não configurada.");
  process.exit(1);
}

// Health check
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "JWT auth server online"
  });
});

// Endpoint para gerar JWT
app.post("/generate-jwt", (req, res) => {
  try {
    const { external_id, name, email } = req.body;

    if (!external_id) {
      return res.status(400).json({
        ok: false,
        error: "external_id é obrigatório"
      });
    }

    const payload = {
      external_id
    };

    if (name) payload.name = name;
    if (email) payload.email = email;

    // exp opcional
    const token = jwt.sign(payload, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "1h"
    });

    return res.json({
      ok: true,
      token
    });
  } catch (error) {
    console.error("Erro ao gerar JWT:", error);
    return res.status(500).json({
      ok: false,
      error: "Erro interno ao gerar JWT"
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});