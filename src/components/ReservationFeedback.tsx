import DirectoryMotion from './DirectoryMotion'

interface Props {
  status: string | null
  busy: boolean
  error: string
  message: string
}

export default function ReservationFeedback({status, busy, error, message}: Props) {
  const requestAccepted = status === 'PENDING' || status === 'CONFIRMED'
  return <div className="receipt-status-heading">
    <p role="status" className="font-bold text-lg">{message}</p>
    {requestAccepted && !busy && !error && <DirectoryMotion kind="meal"/>}
  </div>
}
