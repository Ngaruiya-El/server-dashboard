const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const ping = require('ping');
const path = require('path');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../server-dashboard/build')));

app.get('/api/status', async (req, res) => {
  try {
    const data = await fs.readFile('./servers.json', 'utf8');
    const servers = JSON.parse(data);
    const serverStatus = {};
    for (const server of servers) {
      const pingResult = await ping.promise.probe(server.ip);
      serverStatus[server.name] = {
        ip: server.ip,
        status: pingResult.alive ? 'Online' : 'Offline',
        last_checked: new Date().toISOString(),
      };
    }
    res.json(serverStatus);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/add-server', async (req, res) => {
  try {
    console.log('Received body:', req.body);
    const { name, ip } = req.body;
    if (!name || !ip) {
      return res.status(400).json({ error: 'Name and IP are required' });
    }
    const data = await fs.readFile('./servers.json', 'utf8');
    const servers = JSON.parse(data);
    if (servers.some((server) => server.name === name)) {
      return res.status(400).json({ error: 'Server name already exists' });
    }
    const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$|^[a-zA-Z0-9.-]+$/;
    if (!ipRegex.test(ip)) {
      return res.status(400).json({ error: 'Invalid IP or hostname' });
    }
    servers.push({ name, ip });
    await fs.writeFile('./servers.json', JSON.stringify(servers, null, 2));
    res.status(201).json({ message: 'Server added successfully' });
  } catch (error) {
    console.error('Error adding server:', error);
    res.status(500).json({ error: 'Failed to add server' });
  }
});

app.delete('/api/remove-server', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Server name is required' });
    }
    const data = await fs.readFile('./servers.json', 'utf8');
    const servers = JSON.parse(data);
    const serverIndex = servers.findIndex((server) => server.name === name);
    if (serverIndex === -1) {
      return res.status(404).json({ error: 'Server not found' });
    }
    servers.splice(serverIndex, 1);
    await fs.writeFile('./servers.json', JSON.stringify(servers, null, 2));
    res.json({ message: 'Server removed successfully' });
  } catch (error) {
    console.error('Error removing server:', error);
    res.status(500).json({ error: 'Failed to remove server' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../server-dashboard/build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});