exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { sessionId, otp } = JSON.parse(event.body);
  const API_KEY = '63bc5c00-533a-11f1-9800-0200cd936042';

  try {
    const response = await fetch(
      `https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY/${sessionId}/${otp}`,
      { method: 'GET' }
    );
    const data = await response.json();

    if (data.Status === 'Success') {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: data.Details })
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
