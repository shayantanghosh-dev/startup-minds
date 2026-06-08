import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@startupminds.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://startupminds.com";

export async function sendWelcomeEmail(email: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Welcome to StartupMinds!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366f1;">Welcome to StartupMinds, ${name}!</h1>
        <p>You're now part of India's premier startup-investor ecosystem.</p>
        <p>Get started by completing your profile and exploring opportunities.</p>
        <a href="${APP_URL}/dashboard" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
          Go to Dashboard
        </a>
      </div>
    `,
  });
}

export async function sendPitchStatusEmail(
  email: string,
  name: string,
  startupName: string,
  status: string,
  notes?: string
) {
  const statusMessages: Record<string, { subject: string; message: string }> = {
    approved: {
      subject: `🎉 Your pitch for ${startupName} has been approved!`,
      message: "Congratulations! Your startup pitch has been approved and is now visible to verified investors.",
    },
    rejected: {
      subject: `Update on your pitch for ${startupName}`,
      message: "After careful review, we were unable to approve your pitch at this time.",
    },
    published: {
      subject: `🚀 ${startupName} is now live on StartupMinds!`,
      message: "Your startup is now discoverable by our network of verified investors.",
    },
    changes_requested: {
      subject: `Action required: Changes requested for ${startupName}`,
      message: "Our reviewers have requested some changes to your pitch. Please review the feedback and resubmit.",
    },
    under_review: {
      subject: `Your pitch for ${startupName} is under review`,
      message: "Our expert reviewers are evaluating your pitch. We'll notify you once the review is complete.",
    },
  };

  const info = statusMessages[status] ?? {
    subject: `Update on your pitch: ${status}`,
    message: `Your pitch status has been updated to: ${status}`,
  };

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: info.subject,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Hello ${name},</h2>
        <p>${info.message}</p>
        ${notes ? `<div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;"><strong>Reviewer Notes:</strong><p>${notes}</p></div>` : ""}
        <a href="${APP_URL}/dashboard/founder/pitches" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
          View Pitch Details
        </a>
      </div>
    `,
  });
}

export async function sendConnectionRequestEmail(
  email: string,
  receiverName: string,
  senderName: string,
  message?: string
) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `${senderName} wants to connect with you on StartupMinds`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">New Connection Request</h2>
        <p>Hi ${receiverName}, <strong>${senderName}</strong> wants to connect with you on StartupMinds.</p>
        ${message ? `<blockquote style="border-left: 4px solid #6366f1; padding-left: 16px; margin: 16px 0;">${message}</blockquote>` : ""}
        <a href="${APP_URL}/dashboard/connections" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
          View Request
        </a>
      </div>
    `,
  });
}

export async function sendKYCStatusEmail(
  email: string,
  name: string,
  status: "approved" | "rejected",
  notes?: string
) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: status === "approved" ? "✅ KYC Approved - You can now access startup pitches" : "KYC Update Required",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">KYC Verification ${status === "approved" ? "Approved" : "Update Required"}</h2>
        <p>Hi ${name},</p>
        ${status === "approved"
          ? "<p>Your KYC verification has been approved. You now have full access to startup pitches and investor features.</p>"
          : `<p>Your KYC documents require attention.</p>${notes ? `<div style="background: #fef3c7; padding: 16px; border-radius: 8px;">${notes}</div>` : ""}`
        }
        <a href="${APP_URL}/dashboard/investor/kyc" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">
          Go to KYC Dashboard
        </a>
      </div>
    `,
  });
}
