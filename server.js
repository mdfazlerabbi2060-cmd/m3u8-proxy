const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('দয়া করে ?url= প্যারামিটার দিন');
  }
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*'
      }
    });
    const data = await response.text();
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(data);
  } catch (error) {
    res.status(500).send(`প্রোক্সি এরর: ${error.message}`);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`প্রোক্সি চালু on port ${port}`));
