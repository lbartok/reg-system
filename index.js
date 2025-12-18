const express = require('express');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.urlencoded({ extended: true }));

// Simple placeholder for authentication integration.
// If you integrate an IdP (Authentik / other), add middleware here.
function authPlaceholder(req, res, next) { return next(); }

app.get('/', authPlaceholder, (req, res) => {
  const orderId = Array.from({length:8}, () => Math.floor(Math.random()*10)).join('');
  res.send(`<!doctype html>
<html>
<head><meta charset="utf-8"><title>Reg System - Hello</title></head>
<body>
  <h1>Reg System</h1>
  <form method="post" action="/order">
    <input type="hidden" name="orderId" value="${orderId}">
    <p>Order ID: <strong>${orderId}</strong></p>
    <button type="submit">Order</button>
  </form>
</body>
</html>`);
});

app.post('/order', authPlaceholder, (req, res) => {
  const orderId = req.body.orderId || 'unknown';
  res.send(`<!doctype html><html><body><h1>Order received</h1><p>Order ID: ${orderId}</p><a href="/">Back</a></body></html>`);
});

app.listen(PORT, () => console.log(`Reg System listening on port ${PORT}`));
