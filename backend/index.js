require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());


const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
db.connect(err => {
  if (err) throw err;
  console.log('MySQL Connected!');
});

// ---------------------------
app.get('/students', (req, res) => {

  // when frontend hits http://localhost:5000/students with GET request
  // this function runs

  db.query('SELECT * FROM students', (err, results) => {
    // runs SELECT * FROM students in your MySQL database
    // err = if something went wrong
    // results = the data that came back from database

    if (err) throw err;
    // if there's an error, stop and show it

    res.json(results);
    // send the results back to frontend as JSON
  });
});



app.post('/students', (req, res) => {
  // get name and roll_number from the request body (sent by React)
  const { name, roll_number } = req.body;

  // insert into database
  db.query('INSERT INTO students (name, roll_number) VALUES (?, ?)', 
    [name, roll_number], (err, result) => {
      if (err) throw err;

      // send back success message and the new student's id
      res.json({ message: 'Student added!', id: result.insertId });
  });
});

app.put('/students/:id', (req, res) => {
  // :id means the student id we want to update
  // example: /students/1 means update student with id 1
  const { name, roll_number } = req.body;
  // get the new name and roll_number from React

  db.query('UPDATE students SET name=?, roll_number=? WHERE id=?',
    [name, roll_number, req.params.id], (err) => {
      if (err) throw err;
      res.json({ message: 'Student updated!' });
      // send back success message
  });
});

app.delete('/students/:id', (req, res) => {
  // :id = the student we want to delete
  // example: /students/1 means delete student with id 1

  db.query('DELETE FROM students WHERE id=?', [req.params.id], (err) => {
    if (err) throw err;
    res.json({ message: 'Student deleted!' });
    // send back success message
  });
});


// ----------------------------------
app.post('/chat', async (req, res) => {
  const { question, history } = req.body;

  db.query('SELECT * FROM students', async (err, students) => {
    if (err) throw err;

    // build messages array with history
    const messages = [
      // system context
      { role: 'system', content: `You are a helpful assistant who is strong in calculations, who knows numbers well, who is aware what is greater than what. who gives concise answer, answers in simple english not object like data, Here is the students data: ${JSON.stringify(students)}.` },
      // previous conversation history
      ...history,
    ];

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        messages: messages,
        stream: false
      })
    });

    const data = await response.json();
    res.json({ answer: data.message.content });
  });
});
app.listen(5000, () => console.log('Server running on port 5000'));