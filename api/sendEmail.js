import PDFDocument from "pdfkit";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, reg_no, qr_image } = req.body;

  if (!name || !email || !reg_no || !qr_image) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    /* ================= CREATE PDF ================= */
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);
      const pdfBase64 = pdfBuffer.toString("base64");

      /* ================= SEND EMAIL ================= */
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY
        },
        body: JSON.stringify({
          sender: {
            name: "TANTRA 2026",
            email: "tickets.tantra26@gmail.com" // 🔴 must be verified
          },
          to: [{ email }],
          subject: "🎭 TANTRA 2026 | Your Entry QR Pass",
          htmlContent: `
            <p>Hello <b>${name}</b>,</p>
            <p>Your entry pass for <b>TANTRA 2026</b> is attached as a PDF.</p>
            <p>Please download and show it at the entry.</p>
            <p><b>Reg No:</b> ${reg_no}</p>
            <p>— Team TANTRA 2026</p>
          `,
          attachment: [
            {
              name: `TANTRA_2026_QR_${reg_no}.pdf`,
              content: pdfBase64
            }
          ]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(400).json({ error: "Brevo rejected", data });
      }

      return res.status(200).json({ success: true });
    });

    /* ================= PDF DESIGN ================= */

    // Background colour band
    doc.rect(0, 0, 600, 120).fill("#6A0DAD");

    doc
      .fillColor("white")
      .fontSize(30)
      .text("TANTRA 2026", 50, 40);

    doc
      .fontSize(14)
      .text("Cultural Fest Entry Pass", 50, 80);

    doc.moveDown(3);

    doc
      .fillColor("#000")
      .fontSize(16)
      .text(`Name: ${name}`);

    doc.text(`Reg No: ${reg_no}`);
    doc.text(`Email: ${email}`);

    doc.moveDown(2);

    // QR Image
    const base64Data = qr_image.replace(/^data:image\/png;base64,/, "");
    const qrBuffer = Buffer.from(base64Data, "base64");

    doc.image(qrBuffer, {
      fit: [220, 220],
      align: "center"
    });

    doc.moveDown(2);

    doc
      .fontSize(12)
      .fillColor("gray")
      .text("Show this QR code at the entry gate", {
        align: "center"
      });

    doc.end();

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      message: err.message
    });
  }
}
