export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, reg_no, qr_image } = req.body;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: "Event Team",
          email: "tickets.tantra26@gmail.com",
        },
        to: [{ email }],
        subject: "Your Event QR Code – Entry Pass",
        htmlContent: `
          <h3>Hello ${name},</h3>
          <p>Your registration is confirmed.</p>
          <p><b>Reg No:</b> ${reg_no}</p>
          <p>Please show this QR at entry:</p>
          <img src="${qr_image}" width="200"/>
          <p>Regards,<br>Event Team</p>
        `,
      }),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Email failed" });
  }
}
