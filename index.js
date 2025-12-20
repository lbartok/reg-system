const express = require('express');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:5000';
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
  <p>Order ID: <strong id="orderId">${orderId}</strong></p>
  <button id="sendBtn">Send random TMF622 product order to backend</button>
  <pre id="result" style="background:#eee;padding:10px;margin-top:10px;white-space:pre-wrap;border:1px solid #ccc"></pre>

  <script>
    // generate a simple TMF622-like ProductOrder payload with random values
    function randInt(len){ return Array.from({length:len},()=>Math.floor(Math.random()*10)).join(''); }
    function randomProductOrder(){
      const id = randInt(8);
      const now = new Date().toISOString();
      return {
        '@type': 'ProductOrder',
        'id': id,
        'externalId': 'ext-' + id,
        'priority': 'normal',
        'requestedStartDate': now,
        'requestedCompletionDate': new Date(Date.now()+3600*1000).toISOString(),
        'orderItem': [
          {
            'id': 'oi-' + randInt(6),
            'action': 'add',
            'product': {
              'id': 'prd-' + randInt(6),
              'productSpecification': {
                'id': 'spec-' + randInt(5),
                'name': 'Demo product'
              }
            }
          }
        ]
      };
    }

    document.getElementById('sendBtn').addEventListener('click', async ()=>{
      const payload = randomProductOrder();
      document.getElementById('result').textContent = 'Sending...';
      try{
        const res = await fetch('/api/order', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const j = await res.json();
        document.getElementById('result').textContent = JSON.stringify({status:res.status,body:j}, null, 2);
      }catch(e){
        document.getElementById('result').textContent = 'Error: '+e.message;
      }
    });
  </script>
</body>
</html>`);
});

app.post('/order', authPlaceholder, (req, res) => {
  const orderId = req.body.orderId || 'unknown';
  res.send(`<!doctype html><html><body><h1>Order received</h1><p>Order ID: ${orderId}</p><a href="/">Back</a></body></html>`);
});

// Proxy endpoint: receive JSON from frontend and forward to backend service
app.post('/api/order', authPlaceholder, async (req, res) => {
  try{
    const payload = req.body;
    const fetchRes = await fetch(`${BACKEND_URL}/orders`, {method:'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)});
    const json = await fetchRes.json().catch(()=>null);
    res.status(fetchRes.status).json(json || { forwarded: true });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Reg System listening on port ${PORT}`));
