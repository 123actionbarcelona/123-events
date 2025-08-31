'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import toast from 'react-hot-toast'

export default function StripeTestPage() {
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)

  const testStripeDebug = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/stripe')
      const data = await response.json()
      setTestResults(data)
      
      if (data.success) {
        toast.success('✅ Stripe is working correctly!')
      } else {
        toast.error(`❌ Stripe error: ${data.message || 'Unknown error'}`)
      }
    } catch (error) {
      toast.error('Failed to test Stripe')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const testCheckout = async () => {
    setLoading(true)
    try {
      // Use the first event from database or create a dummy one
      const checkoutData = {
        eventId: 'dummy-event-id',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '+34600000000',
        quantity: 1,
        notes: 'Test booking from debug page',
        customFormData: {}
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData)
      })

      const data = await response.json()
      
      if (response.ok && data.checkoutUrl) {
        toast.success('✅ Checkout session created!')
        window.open(data.checkoutUrl, '_blank')
        setTestResults(data)
      } else {
        toast.error(`❌ Checkout failed: ${data.error || 'Unknown error'}`)
        setTestResults(data)
      }
    } catch (error) {
      toast.error('Failed to create checkout')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Stripe Integration Test</h1>
        <p className="text-gray-600">Test Stripe functionality independently</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Test Stripe Configuration</h3>
          <p className="text-gray-600 mb-4">
            Check if Stripe is properly configured and can create test sessions.
          </p>
          <Button 
            onClick={testStripeDebug}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test Stripe Config'}
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Test Checkout Flow</h3>
          <p className="text-gray-600 mb-4">
            Try to create a real checkout session (will not charge).
          </p>
          <Button 
            onClick={testCheckout}
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            {loading ? 'Creating...' : 'Test Checkout'}
          </Button>
        </Card>
      </div>

      {testResults && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Test Results</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  )
}