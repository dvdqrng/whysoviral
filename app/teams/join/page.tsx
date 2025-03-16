'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { dynamic } from './dynamic'

export default function JoinTeamPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [teamId, setTeamId] = useState<string | null>(null)
  const [teamName, setTeamName] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No invitation token provided')
      return
    }

    const processInvitation = async () => {
      try {
        const response = await fetch('/api/teams/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (!response.ok) {
          setStatus('error')
          setMessage(data.error || 'Failed to process invitation')
          return
        }

        setStatus('success')
        setMessage(data.message)

        if (data.teamId) {
          setTeamId(data.teamId)
          setTeamName(data.teamName || 'your team')

          // Redirect to the team page after 3 seconds
          setTimeout(() => {
            router.push(`/teams/${data.teamId}`)
          }, 3000)
        }
      } catch (error) {
        setStatus('error')
        setMessage('An error occurred while processing the invitation')
        console.error('Error processing invitation:', error)
      }
    }

    processInvitation()
  }, [token, router])

  return (
    <div className="container max-w-md py-12">
      <Card className="mx-auto">
        <CardHeader>
          <CardTitle>{status === 'success' ? 'Welcome to the Team!' : 'Team Invitation'}</CardTitle>
          <CardDescription>
            {status === 'loading' ? 'Processing your invitation...' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center py-6">
          {status === 'loading' && (
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
          )}
          {status === 'success' && (
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          )}
          {status === 'error' && (
            <XCircle className="h-16 w-16 text-red-500 mb-4" />
          )}

          <p className="text-lg font-medium">{message}</p>

          {status === 'success' && teamId && (
            <p className="text-sm text-gray-500 mt-4">
              You have successfully joined {teamName}. You will be redirected to the team page in a few seconds.
            </p>
          )}

          {status === 'error' && (
            <p className="text-sm text-gray-500 mt-4">
              If you believe this is an error, please contact the team administrator who sent you the invitation.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          {status === 'success' && teamId && (
            <Link href={`/teams/${teamId}`}>
              <Button>Go to Team Page</Button>
            </Link>
          )}
          {(status === 'error' || !token) && (
            <Link href="/teams">
              <Button variant="outline">Go to Teams</Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  )
} 