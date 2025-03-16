import { TeamService } from './team-service'
import { TeamInvitation } from './db/models/team'
import supabase, { getSupabaseClient } from './supabase'

/**
 * Team Invitation Service
 * 
 * Handles the creation and processing of team invitations.
 */
export class TeamInvitationService {
  /**
   * Invite a user to a team via email
   */
  static async inviteUserByEmail(
    teamId: string,
    email: string,
    role: 'admin' | 'member',
    invitedBy: string
  ): Promise<TeamInvitation> {
    // Create the invitation in the database
    const invitation = await TeamService.createTeamInvitation(teamId, email, role, invitedBy)

    // Get team details for the email
    const team = await TeamService.getTeamById(teamId)
    if (!team) {
      throw new Error('Team not found')
    }

    // Generate invitation URL
    const invitationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/teams/join?token=${invitation.token}`

    try {
      // Send invitation email using Supabase
      await this.sendInvitationEmail(email, team.name, invitationUrl, role)
      return invitation
    } catch (error) {
      console.error('Error sending invitation email:', error)
      // Still return the invitation even if email fails
      return invitation
    }
  }

  /**
   * Send an invitation email
   * @private
   */
  private static async sendInvitationEmail(
    email: string,
    teamName: string,
    invitationUrl: string,
    role: string
  ): Promise<void> {
    // HTML email template
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You've been invited to join ${teamName}</h2>
        <p>You've been invited to join ${teamName} as a ${role}.</p>
        <p>
          <a href="${invitationUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
            Accept Invitation
          </a>
        </p>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${invitationUrl}</p>
        <p>This invitation will expire in 7 days.</p>
      </div>
    `

    // Plain text version
    const textBody = `
      You've been invited to join ${teamName} as a ${role}.
      Accept invitation by visiting this URL: ${invitationUrl}
      This invitation will expire in 7 days.
    `

    try {
      // IMPLEMENTATION OPTIONS:
      
      // OPTION 1: Use Supabase Auth to create a signup link
      // Note: This doesn't provide customized team invitation emails
      // But creates a standard signup/invite flow
      /*
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'invite',
        email: email,
        options: {
          redirectTo: invitationUrl
        }
      })
      
      if (error) throw error
      */
      
      // OPTION 2: Call a Supabase Edge Function (recommended for production)
      // This requires setting up an Edge Function in your Supabase project
      // that connects to an email service like SendGrid, Mailgun, etc.
      /*
      const { data, error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          email,
          teamName, 
          invitationUrl,
          role
        }
      })
      
      if (error) throw error
      */
      
      // For development purposes, log the email content
      console.log('Email invitation would be sent:')
      console.log('To:', email)
      console.log('Subject: Invitation to join ' + teamName)
      console.log('HTML Body:', htmlBody)
      console.log('Text Body:', textBody)
      
      // OPTION 3: Use a direct API call to an email service
      // This could be set up with environment variables for SendGrid, etc.
      /*
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: 'noreply@yourdomain.com', name: 'Your App' },
          subject: `Invitation to join ${teamName}`,
          content: [
            { type: 'text/plain', value: textBody },
            { type: 'text/html', value: htmlBody }
          ]
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to send email: ${error}`);
      }
      */
      
      // For now, simulate a successful email send
      return Promise.resolve()
    } catch (error) {
      console.error('Error sending invitation email:', error)
      throw error
    }
  }

  /**
   * Validate and process an invitation
   */
  static async processInvitation(token: string, userId: string): Promise<{ success: boolean; message: string; teamId?: string; teamName?: string }> {
    try {
      // Get the invitation
      const invitation = await TeamService.getTeamInvitationByToken(token)

      if (!invitation) {
        return { success: false, message: 'Invitation not found or has already been used.' }
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        return { success: false, message: 'This invitation has expired.' }
      }

      // Check if invitation is already accepted
      if (invitation.accepted) {
        return { success: false, message: 'This invitation has already been accepted.' }
      }

      // Get team details
      const team = await TeamService.getTeamById(invitation.team_id)
      if (!team) {
        return { success: false, message: 'Team not found.' }
      }

      // Accept the invitation
      await TeamService.acceptTeamInvitation(token, userId)

      return {
        success: true,
        message: `You have successfully joined ${team.name}!`,
        teamId: invitation.team_id,
        teamName: team.name
      }
    } catch (error) {
      console.error('Error processing invitation:', error)
      return { success: false, message: 'An error occurred while processing the invitation.' }
    }
  }

  /**
   * Resend an invitation
   */
  static async resendInvitation(invitationId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get the invitation
      const { data: invitation, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('id', invitationId)
        .single()

      if (error || !invitation) {
        return { success: false, message: 'Invitation not found.' }
      }

      // Get team details
      const team = await TeamService.getTeamById(invitation.team_id)
      if (!team) {
        return { success: false, message: 'Team not found.' }
      }

      // Generate invitation URL
      const invitationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/teams/join?token=${invitation.token}`

      // Send invitation email
      await this.sendInvitationEmail(invitation.email, team.name, invitationUrl, invitation.role)

      return { success: true, message: 'Invitation has been resent.' }
    } catch (error) {
      console.error('Error resending invitation:', error)
      return { success: false, message: 'An error occurred while resending the invitation.' }
    }
  }
} 