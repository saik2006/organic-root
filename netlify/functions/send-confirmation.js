exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { to_name, to_email, order_id, items, total } = JSON.parse(event.body);
const RESEND_API_KEY = process.env.RESEND_API_KEY;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'OrganicRoot <onboarding@resend.dev>',
        to: [to_email],
        subject: `Order Confirmed — #${order_id}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f9f4ec;border-radius:16px">
            <div style="text-align:center;margin-bottom:24px">
              <h1 style="font-size:28px;color:#3d2b1f;margin-bottom:4px">🌿 OrganicRoot</h1>
              <p style="color:#8a6a50;font-size:14px">Pure. Natural. Delivered.</p>
            </div>
            <div style="background:#fff;border-radius:12px;padding:24px;margin-bottom:16px">
              <h2 style="font-size:20px;color:#3d2b1f;margin-bottom:8px">Thank you, ${to_name}!</h2>
              <p style="color:#8a6a50;font-size:14px;line-height:1.6">Your order has been confirmed and is being prepared with care.</p>
            </div>
            <div style="background:#fff;border-radius:12px;padding:24px;margin-bottom:16px">
              <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#8a6a50;margin-bottom:12px">Order Details</p>
              <p style="font-size:14px;color:#3d2b1f;margin-bottom:8px"><strong>Order ID:</strong> #${order_id}</p>
              <p style="font-size:14px;color:#3d2b1f;margin-bottom:8px"><strong>Items:</strong></p>
              <p style="font-size:14px;color:#8a6a50;white-space:pre-line;line-height:1.8">${items}</p>
              <hr style="border:none;border-top:1px solid #e2d5c3;margin:16px 0">
              <p style="font-size:16px;font-weight:700;color:#3d2b1f"><strong>Total Paid: ${total}</strong></p>
            </div>
            <div style="background:#eef1e6;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center">
              <p style="font-size:14px;color:#5a6e3a;font-weight:600">Your order will be delivered within 48 hours.</p>
            </div>
            <p style="text-align:center;font-size:12px;color:#8a6a50">
              Questions? Reply to this email or contact us at hello@organicroot.in<br>
              OrganicRoot · Ambattur, Chennai, Tamil Nadu
            </p>
          </div>
        `,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      console.log('Email sent successfully:', data);
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } else {
      console.error('Resend rejected email. Status:', response.status, 'Response:', JSON.stringify(data));
      return { statusCode: 400, body: JSON.stringify({ success: false, error: data }) };
    }
  } catch (err) {
    console.error('send-confirmation crashed:', err.message);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  }
};
