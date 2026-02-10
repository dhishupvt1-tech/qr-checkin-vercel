import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, reg_no, qr_image } = req.body;

  if (!name || !email || !reg_no || !qr_image) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));

    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);
      const pdfBase64 = pdfBuffer.toString("base64");

      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY
        },
        body: JSON.stringify({
          sender: {
            name: "TANTRA 2026",
            email: "tickets.tantra26@gmail.com" // must be verified in Brevo
          },
          to: [{ email }],
          subject: "🎭 TANTRA 2026 | Entry Pass",
          htmlContent: `
            <p>Hello <b>${name}</b>,</p>
            <p>Your <b>TANTRA 2026</b> entry pass is attached.</p>
            <p>Please carry this PDF to the event.</p>
            <p>— Team TANTRA 2026</p>
          `,
          attachment: [
            {
              name: `TANTRA_2026_PASS_${reg_no}.pdf`,
              content: pdfBase64
            }
          ]
        })
      });

      if (!response.ok) {
        const err = await response.json();
        return res.status(400).json({ error: "Brevo rejected", err });
      }

      return res.status(200).json({ success: true });
    });

    /* ================= PDF DESIGN ================= */

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const centerX = pageWidth / 2;

    // Background (Royal Blue)
    doc.rect(0, 0, pageWidth, pageHeight).fill("#0B1C2D");

    // Gold border frame
    doc
      .lineWidth(4)
      .strokeColor("#C9A44C")
      .rect(20, 20, pageWidth - 40, pageHeight - 40)
      .stroke();

    // Gold header band
    doc.rect(20, 20, pageWidth - 40, 120).fill("#C9A44C");

    // Logo
    const logoPath = path.join(process.cwd(), "api", "logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, centerX - 45, 35, { width: 90 });
    }

    // Title
    doc
      .fillColor("#0B1C2D")
      .fontSize(28)
      .text("EXCELLENCE CULTURAL ASSOCIATION 2026", 0, 155, { align: "center" });

    doc
      .fontSize(15)
      .fillColor("#C9A44C")
      .text("TANTRA 2026 Fest – Entry Pass", { align: "center" });

    doc.moveDown(0.8);

    // Venue & Date (NEW)
    doc
      .fontSize(13)
      .fillColor("white")
      .text(
        "Venue: Tamil Nadu Dr. Ambedkar Law University, Perungudi",
        { align: "center" }
      );

    doc
      .fontSize(13)
      .fillColor("white")
      .text(
        "Date: 27 March 2026",
        { align: "center" }
      );

    doc.moveDown(1.2);

    // Participant details
    doc
      .fontSize(15)
      .fillColor("white")
      .text(`Name: ${name}`, { align: "center" });

    doc.text(`Reg No: ${reg_no}`, { align: "center" });
    doc.text(`Email: ${email}`, { align: "center" });

    doc.moveDown(1.5);

    // QR Code
    const base64Data = qr_image.replace(/^data:image\/png;base64,/, "");
    const qrBuffer = Buffer.from(base64Data, "base64");

    doc.image(qrBuffer, centerX - 105, doc.y, { width: 210 });

    doc.moveDown(1.2);

    doc
      .fontSize(12)
      .fillColor("#C9A44C")
      .text("Show this QR code at the entry gate", { align: "center" });

    doc.moveDown(1.5);

    /* ================= RULES BOX ================= */

    const rulesY = doc.y;
    doc
      .lineWidth(1.5)
      .strokeColor("#C9A44C")
      .rect(60, rulesY, pageWidth - 120, 220)
      .stroke();

    doc
      .fontSize(14)
      .fillColor("#C9A44C")
      .text("ENTRY RULES", 0, rulesY + 10, { align: "center" });

    doc
      .fontSize(12)
      .fillColor("white")
      .text(
`1. Entry is permitted for ONE person only.
2. No re-entry is allowed.
3. Admission is reserved with the Committee and Faculty Coordinators.
4. No vehicle parking is allowed inside the campus.
5. Only the SIDE GATE shall be accessed by students.
6. Gates open at 8:00 AM and close at 11:00 AM sharp.
7. ID cards MUST be carried; entry will be rejected otherwise.`,
        80,
        rulesY + 45,
        {
          width: pageWidth - 160,
          align: "left",
          lineGap: 6
        }
      );

    doc.end();

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      message: err.message
    });
  }
}
