"use client"

import { useRouter } from "next/router"
import Link from "next/link"

export default function ErrorPage() {
  const router = useRouter()
  const { error } = router.query

  const errors = {
    Configuration: {
      title: "Server Error",
      message: "There is a problem with the server configuration. Please contact the administrator.",
    },
    AccessDenied: {
      title: "Access Denied",
      message: "You do not have permission to sign in.",
    },
    Default: {
      title: "Authentication Error",
      message: "An error occurred during authentication. Please try again.",
    },
  }

  const { title, message } = error && errors[error] ? errors[error] : errors.Default

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-discord-not-quite-black text-white p-4">
      <div className="max-w-md w-full bg-discord-dark-but-not-black p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-red-500 mb-4">{title}</h1>
        <p className="mb-6">{message}</p>
        <div className="flex flex-col space-y-4">
          <Link
            href="/api/auth/signin"
            className="bg-discord-blurple hover:bg-opacity-80 text-white py-2 px-4 rounded text-center"
          >
            Try Again
          </Link>
          <Link href="/" className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded text-center">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

