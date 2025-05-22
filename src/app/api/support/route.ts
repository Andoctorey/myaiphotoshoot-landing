import { NextRequest, NextResponse } from 'next/server';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { env } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { email, message } = body;
    
    // Validate inputs
    if (!email || !message) {
      return NextResponse.json(
        { error: 'Email and message are required' },
        { status: 400 }
      );
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!env.MAILERSEND_API_KEY) {
      console.error('MailerSend API key is not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Initialize MailerSend
    const mailerSend = new MailerSend({
      apiKey: env.MAILERSEND_API_KEY,
    });

    // Set up email parameters
    const sentFrom = new Sender(env.MAILERSEND_FROM_EMAIL, 'Support Form');
    const recipients = [new Recipient(env.MAILERSEND_TO_EMAIL, 'Support Team')];
    
    // Create email object with both plain text and HTML versions
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(new Sender(email, 'User'))
      .setSubject('New Support Request')
      .setHtml(`
        <div>
          <h2>New Support Request</h2>
          <p><strong>From:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
      `)
      .setText(`
New Support Request
From: ${email}
Message:
${message}
      `);

    // Send the email
    await mailerSend.email.send(emailParams);

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending support email:', error);
    
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 