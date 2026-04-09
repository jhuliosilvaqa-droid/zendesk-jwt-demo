require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.ZENDESK_JWT_SECRET;
const USERS_API_BASE_URL = "https://68d19424e6c0cbeb39a544ec.mockapi.io/api/v1/users";

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

// Gera JWT buscando dados reais do usuário na API
app.post("/generate-jwt", async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        ok: false,
        error: "user_id é obrigatório"
      });
    }

    const apiUrl = `${USERS_API_BASE_URL}/${encodeURIComponent(user_id)}`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: `Erro ao consultar API do usuário. Status: ${response.status}`
      });
    }

    const user = await response.json();

    if (!user || !user.id || !user.name || !user.email) {
      return res.status(404).json({
        ok: false,
        error: "Usuário não encontrado ou dados incompletos"
      });
    }

    const payload = {
      scope: "user",
      external_id: String(user.id),
      name: user.name,
      email: user.email,
      email_verified: true
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "1h"
    });

    return res.json({
      ok: true,
      token,
      user: {
        external_id: String(user.id),
        name: user.name,
        email: user.email
      }
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