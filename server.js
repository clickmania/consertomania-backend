import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Click from "./models/Click.js";
import User from "./models/User.js";
import History from "./models/History.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// Conexão com o MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/consertomania", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB conectado"))
  .catch((err) => console.error("❌ Erro ao conectar no MongoDB:", err));

// Login administrativo
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "Senha incorreta" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "conserto123", {
    expiresIn: "8h",
  });
  res.json({ token });
});

// Registrar clique (para rastrear visitas e links)
app.post("/api/track", async (req, res) => {
  const { url, page } = req.body;
  await Click.create({ url, page });
  res.json({ message: "Clique registrado com sucesso" });
});

// Buscar estatísticas do mês atual
app.get("/api/stats", async (req, res) => {
  const month = new Date().getMonth();
  const year = new Date().getFullYear();
  const clicks = await Click.countDocuments({
    date: {
      $gte: new Date(year, month, 1),
      $lt: new Date(year, month + 1, 1),
    },
  });

  res.json({ clicks });
});

// Resetar os cliques mensalmente (mantendo histórico)
app.post("/api/reset-month", async (req, res) => {
  const month = new Date().toLocaleString("pt-BR", { month: "long" });
  const year = new Date().getFullYear();
  const totalClicks = await Click.countDocuments();

  await History.create({ month, year, totalClicks });
  await Click.deleteMany({});
  res.json({ message: `Histórico salvo e cliques zerados para ${month}/${year}` });
});

// Usuário inicial
const criarUsuarioInicial = async () => {
  const existente = await User.findOne({ username: "consertomania" });
  if (!existente) {
    const hash = await bcrypt.hash("Fer231032", 10);
    await User.create({ username: "consertomania", password: hash });
    console.log("✅ Usuário admin criado: consertomania / Fer231032");
  }
};

criarUsuarioInicial();

// Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
