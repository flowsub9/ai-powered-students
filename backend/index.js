require('dotenv').config();
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const express = require('express');
const { Pool } = require('pg'); // CHANGED: mysql2 → pg
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// CHANGED: mysql.createConnection → pg Pool, uses DATABASE_URL from .env
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required for Supabase
});

// CHANGED: pg connect syntax
db.connect(err => {
  if (err) throw err;
  console.log('PostgreSQL Connected!');
});

// ---------------------------
app.get('/students', async (req, res) => {
  const result = await db.query('SELECT * FROM students');
  res.json(result.rows); // CHANGED: result → result.rows (pg returns rows differently)
});

app.post('/students', async (req, res) => {
  const { name, roll_number } = req.body;
  const result = await db.query(
    'INSERT INTO students (name, roll_number) VALUES ($1, $2) RETURNING id', // CHANGED: ? → $1, $2 (pg uses $ placeholders)
    [name, roll_number]
  );
  res.json({ message: 'Student added!', id: result.rows[0].id }); // CHANGED: result.insertId → result.rows[0].id
});

app.put('/students/:id', async (req, res) => {
  const { name, roll_number } = req.body;
  await db.query(
    'UPDATE students SET name=$1, roll_number=$2 WHERE id=$3', // CHANGED: ? → $1, $2, $3
    [name, roll_number, req.params.id]
  );
  res.json({ message: 'Student updated!' });
});

app.delete('/students/:id', async (req, res) => {
  await db.query('DELETE FROM students WHERE id=$1', [req.params.id]); // CHANGED: ? → $1
  res.json({ message: 'Student deleted!' });
});

// ----------------------------------


app.post('/chat', async (req, res) => {
  const { question, history } = req.body;
  const result = await db.query('SELECT * FROM students');

  const messages = [
    { role: 'system', content: `You are a helpful assistant who is strong in calculations. who gives concise answer. Here is the students data: ${JSON.stringify(result.rows)}.` }, // CHANGED: students → result.rows
    ...history,
  ];

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: messages,
  });

  res.json({ answer: response.choices[0].message.content });
});

app.listen(5000, () => console.log('Server running on port 5000'));