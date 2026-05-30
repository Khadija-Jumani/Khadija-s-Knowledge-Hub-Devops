const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/knowledgehub';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db = null;
let client = null;
let dbStatus = 'Disconnected';
let connectionError = null;

// Retry connecting to MongoDB
async function connectWithRetry() {
  console.log(`Attempting to connect to MongoDB at: ${MONGO_URI}`);
  dbStatus = 'Connecting...';
  try {
    client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    await client.connect();
    db = client.db();
    dbStatus = 'Connected';
    connectionError = null;
    console.log('Successfully connected to MongoDB!');
  } catch (error) {
    dbStatus = 'Error Connecting';
    connectionError = error.message;
    console.error('Failed to connect to MongoDB. Retrying in 5 seconds...', error.message);
    setTimeout(connectWithRetry, 5000);
  }
}

connectWithRetry();

// API: Get database connection status and application stats
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: dbStatus,
    error: connectionError,
    uptime: process.uptime(),
    podName: process.env.HOSTNAME || 'Local-Machine',
  });
});

// API: Get all notes
app.get('/api/notes', async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Database is not connected yet.' });
  }
  try {
    const notes = await db.collection('notes')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Add a new note
app.post('/api/notes', async (req, res) => {
  if (!db) {
    return res.status(530).json({ error: 'Database is not connected yet.' });
  }
  const { title, content, category, author } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const newNote = {
      title,
      content,
      category: category || 'General',
      author: author || 'Anonymous',
      createdAt: new Date()
    };
    const result = await db.collection('notes').insertOne(newNote);
    res.status(201).json({ ...newNote, _id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Delete a note
app.delete('/api/notes/:id', async (req, res) => {
  if (!db) {
    return res.status(503).json({ error: 'Database is not connected yet.' });
  }
  const { id } = req.params;
  try {
    const result = await db.collection('notes').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fallback to serving the HTML index file for any other requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Web application is listening on port ${PORT}`);
});
