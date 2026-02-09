export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, reg_no, qr_image } = req.body;

  // BASIC VALIDATION
  if (!name || !email || !reg_no || !qr_image) {
    return res.status(400).json({
      error: "Missing required fields",
    });
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "accept": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: "Event Team",
          email: "tickets.tantra26@gmail.com" // ⚠️ MUST be verified in Brevo
        },
        to: [
          {
            email: email
          }
        ],
        subject: "Your Event QR Code – Entry Pass",
        htmlContent: `
          <h3>Hello ${name},</h3>

          <p>Your registration is confirmed.</p>

          <p>
            <b>Reg No:</b> ${reg_no}<br/>
            <b>Email:</b> ${email}
          </p>

          <p>Please show the QR code below at the entry:</p>

          <img src="${qr_image}" width="220"/>

          <p><br/>Regards,<br/>Event Team</p>
        `
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({
        error: "Brevo rejected email",
        brevo: data
      });
    }

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
      brevo: data
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      message: err.message
    });
  }
}
