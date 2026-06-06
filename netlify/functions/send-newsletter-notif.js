exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { email } = JSON.parse(event.body);
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
        to: ['saikarthi2006@gmail.com'],
        subject: '🌿 New Newsletter Subscriber — OrganicRoot',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f4ec;border-radius:16px">
            <h2 style="color:#3d2b1f;margin-bottom:8px">New Subscriber 🌿</h2>
            <p style="color:#8a6a50;font-size:14px;margin-bottom:20px">Someone just subscribed to the OrganicRoot newsletter.</p>
            <div style="background:#fff;border-radius:12px;padding:20px">
              <p style="font-size:15px;color:#3d2b1f"><strong>Email:</strong> ${email}</p>
              <p style="font-size:13px;color:#8a6a50;margin-top:8px">Subscribed at: ${new Date().toLocaleString('en-IN')}</p>
            </div>
          </div>
        `,
      }),
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  }
};
