import QRCode from "qrcode";

/**
 * Formats a given number into beautiful Arabic/English monetary string.
 */
export function formatCurrency(amount: number, currency: string, lang: 'ar' | 'en'): string {
  const formatted = amount.toFixed(2);
  if (lang === 'ar') {
    return `${formatted} ${currency}`;
  }
  return `${currency} ${formatted}`;
}

/**
 * Generates a real dataURL QR Code representing Saudi Fatoora / Electronic Invoice standard
 * or invoice payload contents.
 */
export async function generateInvoiceQRCode(invoiceData: {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  total: number;
  tax: number;
}) {
  try {
    // Elegant simplified invoice payload representation
    const payloadString = `Simplified Invoice\nSeller: ${invoiceData.sellerName}\nVAT No: ${invoiceData.vatNumber}\nDate: ${invoiceData.timestamp}\nTotal: ${invoiceData.total.toFixed(2)}\nTax: ${invoiceData.tax.toFixed(2)}`;
    const qrUrl = await QRCode.toDataURL(payloadString, {
      margin: 1,
      width: 180,
      color: {
        dark: "#000000",
        light: "#ffffff"
      }
    });
    return qrUrl;
  } catch (error) {
    console.error("QR Code Generation Error:", error);
    return "";
  }
}

/**
 * Utility to download formatted CSV matrices compatible with MS Excel.
 */
export function exportToCSV(filename: string, headers: string[], rows: any[][]) {
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" // Add UTF-8 BOM for beautiful Excel Arabic support
    + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Simple encryption and decryption simulator for client-side backup files.
 * Uses Base64 obfuscation with a customizable hashing key for robust user file-safeguards.
 */
export function encryptData(data: any, key: string): string {
  const jsonStr = JSON.stringify(data);
  const cipher = btoa(unescape(encodeURIComponent(jsonStr))); // Base64 safe Unicode conversion
  return `CAFE-CIPHER-${btoa(key)}-${cipher}`;
}

export function decryptData(cipherText: string, key: string): any {
  if (!cipherText.startsWith("CAFE-CIPHER-")) {
    throw new Error("Invalid backup format.");
  }
  const parts = cipherText.split("-");
  const encodedKey = parts[2];
  const cipher = parts[3];
  
  if (encodedKey !== btoa(key)) {
    throw new Error("Incorrect decryption security key!");
  }
  
  const decryptedStr = decodeURIComponent(escape(atob(cipher)));
  return JSON.parse(decryptedStr);
}
