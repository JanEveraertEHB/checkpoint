interface LoadingProps {
  message?: string
}

export default function Loading({ message = 'Loading...' }: LoadingProps) {
  return (
    <div className="container">
      <p>{message}</p>
    </div>
  )
}
