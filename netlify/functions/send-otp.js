exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { phone } = JSON.parse(event.body);
  const API_KEY = 'YOUR_2FACTOR_API_KEY';

  try {
    const response = await fetch(
      `https://2factor.in/API/V1/${API_KEY}/SMS/${phone}/AUTOGEN`,
      { method: 'GET' }
    );
    const data = await response.json();

    if (data.Status === 'Success') {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, sessionId: data.Details })
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
