import { config } from "@/lib/config";
import { SADAPAY_DETAILS } from "@/lib/cakestry";

export interface PaymentVerificationResult {
  status: "pending_payment" | "verifying" | "verified" | "rejected" | "manual_review";
  reason?: string;
  customerMessage: string;
  extractedDetails?: {
    recipientName?: string;
    accountNumber?: string;
    amount?: number;
    transactionId?: string;
  };
}

/**
 * Payment Verification Engine for SadaPay Screenshots & Transaction Details
 */
export async function verifyPaymentScreenshot(
  mediaUrlOrText: string,
  expectedTotal: number,
  isImage: boolean = false
): Promise<PaymentVerificationResult> {
  const officialOwner = SADAPAY_DETAILS.ownerName.toLowerCase(); // "ejaz ahmad"
  const officialAccount = SADAPAY_DETAILS.accountNumber.replace(/[^0-9]/g, ""); // "03293110006"

  // 1. If OpenAI Vision / Vision API key is configured, perform AI OCR extraction
  if (isImage && config.ai.openaiApiKey) {
    try {
      const visionResult = await analyzeScreenshotWithVision(mediaUrlOrText, expectedTotal);
      if (visionResult) return visionResult;
    } catch (err) {
      console.warn("[payment-verifier] Vision analysis failed, falling back to manual review:", err);
    }
  }

  // 2. Text / OCR Regex extraction fallback (for text transaction IDs or basic OCR strings)
  const text = mediaUrlOrText.toLowerCase();

  // Check for wrong recipient (e.g., "Ali Raza", "Khan", etc. without Ejaz Ahmad)
  const containsEjaz = text.includes("ejaz") || text.includes("ahmad");
  const containsWrongRecipient =
    (text.includes("ali raza") || text.includes("raza") || text.includes("khan") || text.includes("account title:")) &&
    !containsEjaz;

  if (containsWrongRecipient) {
    return {
      status: "rejected",
      reason: "Recipient account owner does not match official owner EJAZ AHMAD.",
      customerMessage:
        "❌ *Payment Rejected*\n" +
        "The payment recipient name on your receipt does not match official owner *EJAZ AHMAD* (Cakestry Bakery).\n\n" +
        `Please send payment to:\nAccount Title: *${SADAPAY_DETAILS.accountTitle}*\nAccount Number: *${SADAPAY_DETAILS.accountNumber}*\nOwner Name: *${SADAPAY_DETAILS.ownerName}*`,
    };
  }

  // Extract amount numbers from text
  const amountMatches = text.match(/(?:rs\.?|pkr|amount:?)\s*([\d,]+)/i) || text.match(/[\d,]{3,7}/g);
  if (amountMatches) {
    const extractedNum = parseInt(String(amountMatches[1] || amountMatches[0]).replace(/,/g, ""), 10);
    if (!isNaN(extractedNum) && extractedNum > 0 && Math.abs(extractedNum - expectedTotal) > 5) {
      return {
        status: "rejected",
        reason: `Payment amount Rs. ${extractedNum} does not match total Rs. ${expectedTotal}.`,
        customerMessage:
          `⚠️ *Payment Amount Mismatch*\n` +
          `Your payment receipt shows Rs. ${extractedNum.toLocaleString()}, but your order total is *Rs. ${expectedTotal.toLocaleString()}*.\n\n` +
          `Please check the payment amount and send the correct screenshot.`,
      };
    }
  }

  // Text-based receipts or transaction IDs must ALWAYS be manually reviewed by bakery staff
  // NEVER auto-verify payments based on simple keyword matches like "sadapay" or "ejaz"!
  return {
    status: "manual_review",
    reason: "Payment screenshot or transaction details require manual review by bakery staff.",
    customerMessage:
      "🔍 *Payment Receipt Received for Review*\n" +
      "Thank you! Your payment details have been submitted to the Cakestry Bakery team for verification. We will confirm your order as soon as our accounts team confirms the payment! 🎂",
  };

  // If unclear, default to manual review (Never auto-verify invalid images!)
  return {
    status: "manual_review",
    reason: "Screenshot requires manual verification by bakery staff.",
    customerMessage:
      "🔍 *Payment Receipt Received*\n" +
      "Your payment receipt has been submitted for verification. Our team will review it and confirm your order shortly! 🎂",
  };
}

async function analyzeScreenshotWithVision(
  imageUrl: string,
  expectedTotal: number
): Promise<PaymentVerificationResult | null> {
  const apiKey = config.ai.openaiApiKey;
  if (!apiKey) return null;

  const prompt = `Analyze this SadaPay payment receipt screenshot for Cakestry Bakery.
Official Recipient Details:
- Owner Name: EJAZ AHMAD
- Account Number: 0329-3110006
- Expected Amount: Rs. ${expectedTotal}

Return a strict JSON object:
{
  "recipientName": "extracted_name",
  "accountNumber": "extracted_acc",
  "amount": number_extracted,
  "transactionId": "extracted_trx",
  "isRecipientEjazAhmad": boolean,
  "isAmountCorrect": boolean,
  "isLegitimateReceipt": boolean
}`;

  const res = await fetch(`${config.ai.openaiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) return null;
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) return null;

  const parsed = JSON.parse(content);
  const isRecipientValid = parsed.isRecipientEjazAhmad || (parsed.recipientName && parsed.recipientName.toLowerCase().includes("ejaz"));
  const isAmountValid = parsed.amount ? Math.abs(parsed.amount - expectedTotal) <= 5 : parsed.isAmountCorrect;

  if (!isRecipientValid && parsed.recipientName) {
    return {
      status: "rejected",
      reason: `Recipient ${parsed.recipientName} is not EJAZ AHMAD.`,
      customerMessage:
        `❌ *Payment Rejected*\n` +
        `The payment screenshot shows recipient *${parsed.recipientName}*, which does NOT match official owner *EJAZ AHMAD* (Cakestry Bakery).\n\n` +
        `Please send payment to SadaPay Account: 0329-3110006 (EJAZ AHMAD).`,
    };
  }

  if (isRecipientValid && !isAmountValid && parsed.amount) {
    return {
      status: "rejected",
      reason: `Amount Rs. ${parsed.amount} does not match total Rs. ${expectedTotal}.`,
      customerMessage:
        `⚠️ *Payment Amount Mismatch*\n` +
        `Your receipt shows Rs. ${parsed.amount.toLocaleString()}, but order total is *Rs. ${expectedTotal.toLocaleString()}*.\n\n` +
        `Please send the correct amount screenshot.`,
    };
  }

  if (isRecipientValid && isAmountValid && parsed.isLegitimateReceipt) {
    return {
      status: "verified",
      customerMessage:
        "✅ *Payment Verified!* 🎉\n" +
        "Your payment to *EJAZ AHMAD* (Rs. " + expectedTotal.toLocaleString() + ") has been verified! Your order is now being processed. 🎂",
    };
  }

  return {
    status: "manual_review",
    customerMessage:
      "🔍 *Payment Received for Manual Review*\n" +
      "Our team is manually verifying your payment screenshot and will confirm your order in a few moments! 🎂",
  };
}
