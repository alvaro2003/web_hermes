require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS produtos (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      data_validade TEXT NOT NULL,
      data_entrada TEXT NOT NULL,
      localizacao TEXT NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Banco de dados pronto!');
}

app.get('/api/produtos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM produtos ORDER BY criado_em DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
});

app.post('/api/produtos', async (req, res) => {
  const { nome, quantidade, data_validade, data_entrada, localizacao } = req.body;
  if (!nome || !quantidade || !data_validade || !data_entrada || !localizacao) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO produtos (nome, quantidade, data_validade, data_entrada, localizacao) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nome, quantidade, data_validade, data_entrada, localizacao]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar produto.' });
  }
});

app.delete('/api/produtos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }
    await pool.query('DELETE FROM produtos WHERE id = $1', [id]);
    res.json({ message: `Produto #${id} removido com sucesso.` });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover produto.' });
  }
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}\n`);
  });
});