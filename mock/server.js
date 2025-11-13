// mock/server.js

const jsonServer = require('json-server');
const fs = require('fs');
const path = require('path');
const { Buffer } = require('buffer');
const process = require('process');

// __dirname is available in CommonJS by default

const loadJson = (fileName) => {
  const absolutePath = path.join(__dirname, '../public/data', fileName);
  const fileContents = fs.readFileSync(absolutePath, 'utf-8');
  return JSON.parse(fileContents);
}

const data = {
  stores: loadJson('stores.json'),
  books: loadJson('books.json'),
  authors: loadJson('authors.json'),
  inventory: loadJson('inventory.json'),
  users: [
    {
      id: 1,
      name: 'Store Manager',
      email: 'admin@ovarc.io',
      password: 'admin123',
      role: 'admin',
    },
  ],
}

const server = jsonServer.create();
const router = jsonServer.router(data);
const middlewares = jsonServer.defaults({
  static: path.join(__dirname, '../public'),
});

server.use(jsonServer.bodyParser);
server.use(middlewares);

// Simulate small latency
server.use((req, res, next) => setTimeout(next, 200));

server.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = router.db.get('users').find({ email, password }).value();

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const { password: _PASSWORD, ...sanitizedUser } = user;
  const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

  return res.json({ token, user: sanitizedUser });
});

// Fallback to JSON Server router
server.use(router);

const PORT = process.env.MOCK_PORT || 4000;

server.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
});
