import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 🔥 ENTRY ID ADDED HERE
  const { name, email, reg_no, qr_text, entry_id } = req.body;

  if (!name || !email || !reg_no || !qr_text || !entry_id) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const doc = new PDFDocument({ size: "A4", margin: 36 });
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
            email: "tickets.tantra26@gmail.com"
          },
          to: [{ email }],
          subject: "🎭 TANTRA 2026 | Entry Pass",
          htmlContent: `
            <p>Hello <b>${name}</b>,</p>
            <p>Your <b>TANTRA 2026</b> entry pass is attached.</p>
            <p><b>ENTRY ID:</b> <span style="font-size:16px">${entry_id}</span></p>
            <p>Please show the QR code or mention the Entry ID at the entry gate.</p>
          `,
          attachment: [{
            name: `TANTRA_2026_PASS_${reg_no}.pdf`,
            content: pdfBase64
          }]
        })
      });

      if (!response.ok) {
        const err = await response.json();
        return res.status(400).json({ error: "Brevo rejected", err });
      }

      res.status(200).json({ success: true });
    });

    /* ================= PAGE METRICS ================= */
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const centerX = pageW / 2;

    /* ================= BACKGROUND ================= */
    doc.rect(0, 0, pageW, pageH).fill("#0B1C2D");

    /* ================= HEADER ================= */
    doc.rect(20, 20, pageW - 40, 110).fill("#C9A44C");

    const logoPath = path.join(process.cwd(), "api", "logo.PNG");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, centerX - 40, 35, { width: 80 });
    }

    doc
      .fillColor("#0B1C2D")
      .fontSize(26)
      .text("ECA 2026", 0, 145, { align: "center" });

    doc
      .fontSize(14)
      .fillColor("#C9A44C")
      .text("TANTRA Cultural Fest – Entry Pass", { align: "center" });

    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("white")
      .text("Venue: Tamil Nadu Dr. Ambedkar Law University, Perungudi", { align: "center" })
      .text("Date: 27 March 2026", { align: "center" });

    doc.moveDown(0.8);
    doc.fontSize(13).fillColor("white")
      .text(`Name: ${name}`, { align: "center" })
      .text(`Reg No: ${reg_no}`, { align: "center" })
      .text(`Email: ${email}`, { align: "center" });

    /* ================= ENTRY ID (🔥 NEW 🔥) ================= */
    doc.moveDown(0.4);
    doc
      .fontSize(15)
      .fillColor("#C9A44C")
      .text(`ENTRY ID: ${entry_id}`, { align: "center" });

    /* ================= QR ================= */
    const qrDataUrl = await QRCode.toDataURL(qr_text, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 220
    });

    const qrBase64 = qrDataUrl.split(",")[1];
    const qrBuffer = Buffer.from(qrBase64, "base64");

    doc.moveDown(0.8);
    doc.image(qrBuffer, centerX - 110, doc.y, { width: 220 });

    doc.moveDown(0.6);
    doc.fontSize(10).fillColor("#C9A44C")
      .text("Show this QR code OR mention Entry ID at the entry gate", { align: "center" });

    /* ================= RULES ================= */
    doc.moveDown(0.8);
    const rulesTop = doc.y;
    const rulesHeight = pageH - rulesTop - 60;

    doc
      .lineWidth(1.2)
      .strokeColor("#C9A44C")
      .rect(50, rulesTop, pageW - 100, rulesHeight)
      .stroke();

    doc
      .fontSize(13)
      .fillColor("#C9A44C")
      .text("ENTRY RULES", 0, rulesTop + 10, { align: "center" });

    doc
      .fontSize(10.5)
      .fillColor("white")
      .text(
`1. Entry is permitted for ONE person only.
2. No re-entry is allowed.
3. Admission is reserved with the Committee and Faculty Coordinators.
4. No vehicle parking is allowed inside the campus.
5. Only the SIDE GATE shall be accessed by students.
6. Gates open at 8:00 AM and close at 11:00 AM sharp.
7. ID cards MUST be carried; entry will be rejected otherwise.`,
        70,
        rulesTop + 35,
        {
          width: pageW - 140,
          lineGap: 4
        }
      );

    /* ================= OUTER BORDER ================= */
    doc
      .lineWidth(3)
      .strokeColor("#C9A44C")
      .rect(20, 20, pageW - 40, pageH - 40)
      .stroke();

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
