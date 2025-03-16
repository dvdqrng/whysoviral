import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Send an email
 * Note: This is a placeholder implementation. In a real application, 
 * you would integrate with an email service like SendGrid, Mailgun, etc.
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<void> {
  // For testing purposes, we'll just log the email details
  console.log('Sending email:')
  console.log('To:', to)
  console.log('Subject:', subject)
  console.log('HTML Body:', htmlBody)
  console.log('Text Body:', textBody)

  // In a real implementation, you would use an email service like:
  // return sendgrid.send({
  //   to,
  //   from: 'noreply@whysoviral.com',
  //   subject,
  //   html: htmlBody,
  //   text: textBody,
  // })

  // For now, we'll just simulate a successful email send
  return Promise.resolve()
}
