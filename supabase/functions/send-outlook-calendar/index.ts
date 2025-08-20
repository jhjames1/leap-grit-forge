import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";
import { toZonedTime } from "https://esm.sh/date-fns-tz@3.2.0";
import { format } from "https://esm.sh/date-fns@3.6.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const CST_TIMEZONE = 'America/Chicago';

interface CalendarEvent {
  specialistEmail: string;
  userEmail: string;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  specialistName: string;
  userName: string;
}

serve(async (req) => {
  console.log(`[send-outlook-calendar] Request received: ${req.method}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      specialistEmail, 
      userEmail, 
      title, 
      description, 
      startDateTime, 
      endDateTime,
      specialistName,
      userName
    }: CalendarEvent = await req.json();

    console.log(`[send-outlook-calendar] Creating calendar invite for ${specialistEmail}`);

    // Convert UTC times to CST for display
    const startDateUTC = new Date(startDateTime);
    const endDateUTC = new Date(endDateTime);
    const startDateCST = toZonedTime(startDateUTC, CST_TIMEZONE);
    const endDateCST = toZonedTime(endDateUTC, CST_TIMEZONE);

    // Create iCal format string for Outlook compatibility (keep in UTC for calendar standards)
    const formatDateTime = (dateTime: string) => {
      return new Date(dateTime).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const startFormatted = formatDateTime(startDateTime);
    const endFormatted = formatDateTime(endDateTime);
    const nowFormatted = formatDateTime(new Date().toISOString());

    const icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LEAP//Peer Support Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${crypto.randomUUID()}@leap-support.com`,
      `DTSTAMP:${nowFormatted}`,
      `DTSTART:${startFormatted}`,
      `DTEND:${endFormatted}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}\\n\\nWith: ${userName}\\nEmail: ${userEmail}`,
      `ORGANIZER;CN=${specialistName}:mailto:${specialistEmail}`,
      `ATTENDEE;CN=${userName};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${userEmail}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    // Send calendar invite via email
    const emailResponse = await resend.emails.send({
      from: "LEAP Support <noreply@leap-support.com>",
      to: [specialistEmail],
      cc: [userEmail],
      subject: `📅 Calendar Invite: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Appointment Scheduled</h2>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #334155;">${title}</h3>
            <p><strong>Date:</strong> ${format(startDateCST, 'MMMM dd, yyyy')}</p>
            <p><strong>Time:</strong> ${format(startDateCST, 'h:mm a')} - ${format(endDateCST, 'h:mm a')} CST</p>
            <p><strong>Duration:</strong> ${Math.round((endDateUTC.getTime() - startDateUTC.getTime()) / (1000 * 60))} minutes</p>
            <p><strong>With:</strong> ${userName} (${userEmail})</p>
            ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
          </div>
          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <p style="margin: 0; color: #1e40af;">
              📎 <strong>Calendar attachment included</strong> - Add this appointment to your Outlook calendar by opening the attached .ics file.
            </p>
          </div>
          <p style="margin-top: 20px; color: #64748b; font-size: 14px;">
            This appointment was automatically scheduled through the LEAP Peer Support system.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: 'appointment.ics',
          content: btoa(icalContent),
          contentType: 'text/calendar; charset=utf-8; method=REQUEST'
        }
      ]
    });

    if (emailResponse.error) {
      console.error('[send-outlook-calendar] Email error:', emailResponse.error);
      throw emailResponse.error;
    }

    console.log('[send-outlook-calendar] Calendar invite sent successfully:', emailResponse.data);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Calendar invite sent successfully',
        emailId: emailResponse.data?.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[send-outlook-calendar] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});