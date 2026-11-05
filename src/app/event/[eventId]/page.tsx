'use client'
import React from 'react'
import { EventDetails } from '@/components/Event/EventDetails'

interface EventPageProps {
  params: Promise<{ eventId: string }>
}

const SingleEventPage = ({ params }: EventPageProps) => {
  const { eventId } = React.use(params)
  return <EventDetails eventId={eventId} />
}

export default SingleEventPage
