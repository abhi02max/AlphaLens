import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send a welcome email to new users
 */
export const sendWelcomeEmail = async (userEmail, userName) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Mock] Welcome email simulated for ${userEmail}`);
    return { id: 'mock-id' };
  }

  try {
    const data = await resend.emails.send({
      from: 'AlphaLens <onboarding@resend.dev>',
      to: [userEmail],
      subject: 'Welcome to AlphaLens Enterprise',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome, ${userName}!</h2>
          <p>Thank you for joining AlphaLens. We are excited to help you achieve your financial goals with enterprise-grade tools.</p>
          <p>Best,<br>The AlphaLens Team</p>
        </div>
      `
    });
    return data;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
};

/**
 * Send a stock price alert (example scaffold)
 */
export const sendStockAlert = async (userEmail, symbol, price, direction) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Mock] Alert simulated for ${userEmail} regarding ${symbol}`);
    return { id: 'mock-id' };
  }

  try {
    const data = await resend.emails.send({
      from: 'AlphaLens Alerts <alerts@resend.dev>',
      to: [userEmail],
      subject: `AlphaLens Alert: ${symbol} is ${direction}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Stock Alert: ${symbol}</h2>
          <p>The stock <strong>${symbol}</strong> has crossed your alert threshold.</p>
          <p>Current price: <strong>$${price}</strong></p>
          <p><a href="https://alphalens-app.vercel.app/stock/${symbol}">View on AlphaLens</a></p>
        </div>
      `
    });
    return data;
  } catch (error) {
    console.error('Failed to send stock alert email:', error);
    throw error;
  }
};
