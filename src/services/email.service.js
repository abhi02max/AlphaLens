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
      from: 'WalletStack <onboarding@resend.dev>',
      to: [userEmail],
      subject: 'Welcome to WalletStack',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome, ${userName}!</h2>
          <p>Thank you for joining WalletStack. Your personal finance workspace is ready.</p>
          <p>Best,<br>The WalletStack Team</p>
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
      from: 'WalletStack Alerts <alerts@resend.dev>',
      to: [userEmail],
      subject: `WalletStack Alert: ${symbol} is ${direction}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Stock Alert: ${symbol}</h2>
          <p>The stock <strong>${symbol}</strong> has crossed your alert threshold.</p>
          <p>Current price: <strong>$${price}</strong></p>
          <p><a href="https://walletstack.app/stock/${symbol}">View on WalletStack</a></p>
        </div>
      `
    });
    return data;
  } catch (error) {
    console.error('Failed to send stock alert email:', error);
    throw error;
  }
};
