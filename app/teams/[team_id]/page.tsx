'use client'

import TeamPageDirect from './page-direct'

export default function TeamPage({ params }: { params: { team_id: string } }) {
  return <TeamPageDirect params={params} />
} 