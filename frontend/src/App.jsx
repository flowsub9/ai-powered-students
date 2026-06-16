import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:5000/students";

export default function App() {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [editId, setEditId] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  useEffect(() => {
    fetchStudents();
  }, []);

  // -----------------------------------
  const fetchStudents = async () => {
    const res = await axios.get(API);
    setStudents(res.data);
  };

  // ------------------------------
  const handleSubmit = async () => {
    if (editId) {
      // if editId has a value, means we are EDITING an existing student
      await axios.put(`${API}/${editId}`, { name, roll_number: roll });
      // sends PUT request to http://localhost:5000/students/1 (for example)
      // with the new name and roll number
      setEditId(null);
      // resets editId back to null after updating
    } else {
      // if editId is null, means we are ADDING a new student
      await axios.post(API, { name, roll_number: roll });
      // sends POST request to http://localhost:5000/students
      // with the name and roll number user typed
    }
    setName("");
    setRoll("");
    // clears the input fields after submitting

    fetchStudents();
    // refreshes the list to show latest data
  };

  // -----------------------

  const handleEdit = (s) => {
    setEditId(s.id);
    setName(s.name);
    setRoll(s.roll_number);
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API}/${id}`);
    fetchStudents();
  };
const handleChat = async () => {
  // add user question to history
  const newHistory = [...chatHistory, { role: 'user', content: question }];
  setChatHistory(newHistory);

  // send question and history to backend
  const res = await axios.post('http://localhost:5000/chat', { 
    question, 
    history: newHistory 
  });

  // add AI answer to history
  setChatHistory([...newHistory, { role: 'assistant', content: res.data.answer }]);
  setAnswer(res.data.answer);
  setQuestion('');
};
  return (
    <>
      <div style={{ padding: 30 }}>
        <h2>Students CRUD</h2>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Roll Number"
          value={roll}
          onChange={(e) => setRoll(e.target.value)}
        />
        <button onClick={handleSubmit}>{editId ? "Update" : "Add"}</button>
      </div>

      <table border="1" style={{ marginTop: 20, width: "100%" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Roll No</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.name}</td>
              <td>{s.roll_number}</td>
              <td>
                <button onClick={() => handleEdit(s)}>Edit</button>
                <button onClick={() => handleDelete(s.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
<h2>Ask AI about students</h2>
<div style={{ border: '1px solid #ccc', padding: 10, height: 200, overflowY: 'scroll' }}>
  {chatHistory.map((msg, i) => (
    <p key={i}>
      <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
    </p>
  ))}
</div>
<input
  placeholder="Ask a question..."
  value={question}
  onChange={e => setQuestion(e.target.value)}
/>
<button onClick={handleChat}>Ask</button>
    </>
  );
}
