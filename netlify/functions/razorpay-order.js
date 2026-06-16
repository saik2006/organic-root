const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { amount, currency = 'INR', receipt } = JSON.parse(event.body);
  const KEY_ID = process.env.RAZORPAY_KEY_ID;
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

  const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');

  const orderData = JSON.stringify({
    amount: amount * 100, // Razorpay expects paise
    currency,
    receipt,
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.razorpay.com',
      path: '/v1/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Content-Length': Buffer.byteLength(orderData),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(data);
        if (res.statusCode === 200) {
          resolve({
            statusCode: 200,
            body: JSON.stringify({ success: true, orderId: parsed.id, amount: parsed.amount }),
          });
        } else {
          resolve({
            statusCode: 400,
            body: JSON.stringify({ success: false, error: parsed }),
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        statusCode: 500,
        body: JSON.stringify({ success: false, error: err.message }),
      });
    });

    req.write(orderData);
    req.end();
  });
};
