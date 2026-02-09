export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, reg_no, qr_image } = req.body;

  if (!name || !email || !reg_no || !qr_image) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "accept": "application/json",
        "api-key": process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: {
          name: "Event Team",
          email: "tickets.tantra26@10612947.brevosend.com" // 🔴 MUST MATCH BREVO VERIFIED SENDER
        },
        replyTo: {
          email: "tickets.tantra26@10612947.brevosend.com",
          name: "Event Team"
        },
        to: [
          { email: email }
        ],
        subject: "Your Event QR Code – Entry Pass",
        htmlContent: `
          <h3>Hello ${name},</h3>
          <p>Your registration is confirmed.</p>
          <p><b>Reg No:</b> ${reg_no}</p>
          <p>Show this QR at entry:</p>
          <img src="${qr_image}" width="220"/>
          <p><br/>Event Team</p>
        `,
        textContent: `
Hello ${name},
Your registration is confirmed.
Reg No: ${reg_no}
Please show the QR code sent in this mail at entry.
        `
      })
    });

    const brevoResponse = await response.json();

    if (!response.ok) {
      return res.status(400).json({
        error: "Brevo rejected request",
        brevo: brevoResponse
      });
    }

    return res.status(200).json({
      success: true,
      brevo: brevoResponse
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      message: err.message
    });
  }
}
