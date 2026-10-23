/**
 * Real-world Free Notification Service for GuideConnect
 * Integrates real email dispatch via FormSubmit.co free API,
 * Official WhatsApp Direct Click-to-Chat API (wa.me & api.whatsapp.com),
 * and Official Gmail Web Compose protocol.
 */

export interface RealContact {
  id: string;
  name: string;
  email: string;
  phone: string;       // Display format: "+91 8108064052"
  cleanPhone: string;  // WhatsApp API format: "918108064052"
  role: 'TOURIST' | 'CLIENT';
}

export const REAL_WORLD_CONTACTS: RealContact[] = [
  {
    id: 'client-005',
    name: 'Prince Gupta',
    email: 'guptaprince0408@gmail.com',
    phone: '+91 8108064052',
    cleanPhone: '918108064052',
    role: 'CLIENT'
  },
  {
    id: 'client-004',
    name: 'Rohan Dasari',
    email: 'newstartcod2007@gmail.com',
    phone: '+91 9766884243',
    cleanPhone: '919766884243',
    role: 'CLIENT'
  },
  {
    id: 'client-003',
    name: 'Tushar Chavan',
    email: 'tusharchavan1234u7@gmail.com',
    phone: '+91 7710886640',
    cleanPhone: '917710886640',
    role: 'CLIENT'
  },
  {
    id: 'client-006',
    name: 'Vedant Ruchke',
    email: 'vedantruchke07@gmail.com',
    phone: '+91 99874 55046',
    cleanPhone: '919987455046',
    role: 'CLIENT'
  },
  {
    id: 'client-008',
    name: 'Deepti Bhere',
    email: 'deeptibhere07@gmail.com',
    phone: '+91 724 906 8205',
    cleanPhone: '917249068205',
    role: 'CLIENT'
  },
  {
    id: 'client-007',
    name: 'Prachi Bhere',
    email: 'prachibhere3@gmail.com',
    phone: '+91 73507 55376',
    cleanPhone: '917350755376',
    role: 'CLIENT'
  }
];

export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

/**
 * 1. WhatsApp Official Direct API Link
 * Free official API by Meta/WhatsApp, no business account or billing needed.
 * Opens WhatsApp Web (desktop) or WhatsApp App (Android/iOS) with the pre-filled message.
 */
export function getWhatsAppDirectLink(phone: string, message: string): string {
  const clean = cleanPhoneNumber(phone);
  return `https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(message)}`;
}

export function getWhatsAppShortLink(phone: string, message: string): string {
  const clean = cleanPhoneNumber(phone);
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

/**
 * 2. Gmail Official Web Compose Protocol
 * Opens the user's Gmail client with recipient, subject, and pre-formatted body loaded.
 */
export function getGmailComposeLink(toEmail: string, subject: string, body: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function getMailtoLink(toEmail: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * 3. Free Real-World Background Email Dispatch via FormSubmit AJAX API
 * 100% Free, NO API key required. Sends actual real emails directly to the recipient's Gmail inbox.
 */
export async function sendRealWorldEmailViaFreeApi(params: {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  messageText: string;
  bookingRef?: string;
  details?: Record<string, any>;
}): Promise<{ success: boolean; message: string; method: string }> {
  try {
    const targetEmail = params.recipientEmail.trim().toLowerCase();
    
    // Call FormSubmit free public AJAX endpoint
    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: params.subject,
        _template: 'box',
        Recipient: `${params.recipientName} (${targetEmail})`,
        Notification: params.messageText,
        BookingReference: params.bookingRef || 'GuideConnect Reservation',
        Platform: 'GuideConnect - Multilingual Tourist Platform',
        Timestamp: new Date().toLocaleString(),
        ...params.details
      })
    });

    if (response.ok) {
      return {
        success: true,
        method: 'FormSubmit.co Free Public Mail Gateway',
        message: `Real email successfully dispatched to ${targetEmail} via FormSubmit gateway.`
      };
    } else {
      return {
        success: false,
        method: 'FormSubmit.co',
        message: `Gateway responded with status ${response.status}. Opened 1-click Gmail Web fallback.`
      };
    }
  } catch (err: any) {
    return {
      success: false,
      method: 'FormSubmit.co',
      message: `Direct dispatch note (${err?.message || 'network'}); 1-click Gmail Web link is ready.`
    };
  }
}

/**
 * Dispatch real-world notification to both WhatsApp and Gmail
 */
export async function dispatchRealWorldTourNotification(params: {
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  title: string;
  message: string;
  referenceId: string;
  tourDetails?: {
    tourDate?: string;
    destinationCity?: string;
    guideName?: string;
    guidePhone?: string;
    agreedPrice?: number;
    currency?: string;
    meetingLocation?: string;
  };
}): Promise<{
  whatsappUrl: string;
  gmailUrl: string;
  mailtoUrl: string;
  emailApiResult: { success: boolean; message: string; method: string };
}> {
  const whatsappMsg = `🔔 *GuideConnect Tour Update*\n\nHello ${params.recipientName}!\n${params.message}\n\n*Reference:* ${params.referenceId}\n${params.tourDetails?.guideName ? `*Guide:* ${params.tourDetails.guideName} (${params.tourDetails.guidePhone || 'N/A'})\n` : ''}${params.tourDetails?.destinationCity ? `*Destination:* ${params.tourDetails.destinationCity}\n` : ''}${params.tourDetails?.tourDate ? `*Date:* ${params.tourDetails.tourDate}\n` : ''}${params.tourDetails?.meetingLocation ? `*Meeting Point:* ${params.tourDetails.meetingLocation}\n` : ''}\n_Powered by GuideConnect Multilingual Platform_`;

  const emailSubject = `[GuideConnect] ${params.title} [${params.referenceId}]`;
  const emailBody = `Dear ${params.recipientName},\n\n${params.message}\n\n--- TOUR DETAILS ---\nBooking / Request ID: ${params.referenceId}\nDestination: ${params.tourDetails?.destinationCity || 'N/A'}\nDate: ${params.tourDetails?.tourDate || 'N/A'}\nMeeting Location: ${params.tourDetails?.meetingLocation || 'N/A'}\nGuide: ${params.tourDetails?.guideName || 'N/A'} (Phone: ${params.tourDetails?.guidePhone || 'N/A'})\n${params.tourDetails?.agreedPrice ? `Agreed Price: ${params.tourDetails.currency || ''} ${params.tourDetails.agreedPrice}\n` : ''}\n\nWarm regards,\nGuideConnect Platform Team`;

  const whatsappUrl = getWhatsAppDirectLink(params.recipientPhone, whatsappMsg);
  const gmailUrl = getGmailComposeLink(params.recipientEmail, emailSubject, emailBody);
  const mailtoUrl = getMailtoLink(params.recipientEmail, emailSubject, emailBody);

  // Trigger background real email dispatch via FormSubmit free API
  const emailApiResult = await sendRealWorldEmailViaFreeApi({
    recipientEmail: params.recipientEmail,
    recipientName: params.recipientName,
    subject: emailSubject,
    messageText: params.message,
    bookingRef: params.referenceId,
    details: params.tourDetails
  });

  return {
    whatsappUrl,
    gmailUrl,
    mailtoUrl,
    emailApiResult
  };
}
