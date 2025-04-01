'use client'

export default function Error({
  error,
  reset,
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">Something went wrong!</h2>
        <button
          onClick={() => reset()}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Try again
        </button>
      </div>
    </div>
  )
} 