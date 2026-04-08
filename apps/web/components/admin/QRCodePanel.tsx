"use client";

export function QRCodePanel({ slug, clientName }: { slug: string; clientName: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const pageUrl = `${appUrl}/${slug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pageUrl)}&bgcolor=ffffff&color=1e1b4b&margin=10`;

  function handlePrint() {
    const win = window.open("", "_blank");
    win?.document.write(`
      <html dir="rtl">
      <head>
        <title>QR Code — ${clientName}</title>
        <style>
          body { font-family: system-ui; text-align: center; padding: 40px; direction: rtl; }
          h1 { font-size: 24px; margin-bottom: 8px; }
          p { color: #6b7280; margin-bottom: 20px; }
          img { width: 250px; height: 250px; }
          .url { font-size: 14px; color: #6366f1; margin-top: 16px; word-break: break-all; }
        </style>
      </head>
      <body>
        <h1>${clientName}</h1>
        <p>סרוק לדף הנחיתה שלנו</p>
        <img src="${qrUrl}" />
        <div class="url">${pageUrl}</div>
      </body>
      </html>
    `);
    win?.document.close();
    win?.print();
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mt-4 flex flex-col items-center gap-4">
      <h4 className="text-base font-semibold text-slate-900 flex items-center gap-2">
        📲 QR Code לדף הנחיתה
      </h4>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrUrl}
        alt="QR Code"
        className="w-40 h-40 rounded-xl border border-slate-200"
      />
      <p className="text-xs text-slate-500 text-center">הדפס והצב בעסק שלך</p>
      <div className="flex items-center gap-3">
        <a
          href={qrUrl}
          download={`qr-${slug}.png`}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          ⬇️ הורד PNG
        </a>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg border border-slate-200 transition-colors"
        >
          🖨️ הדפס
        </button>
      </div>
    </div>
  );
}
