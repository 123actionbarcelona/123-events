'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import toast from 'react-hot-toast'

export default function TestAPIsPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testingIndividual, setTestingIndividual] = useState<string | null>(null)

  // Run all tests on page load
  useEffect(() => {
    runAllTests()
  }, [])

  const runAllTests = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-apis')
      const data = await response.json()
      setTestResults(data)
      
      if (data.summary?.failed === 0) {
        toast.success('✅ All API tests passed!')
      } else {
        toast.error(`⚠️ ${data.summary?.failed} test(s) failed`)
      }
    } catch (error) {
      toast.error('Failed to run tests')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const runIndividualTest = async (testType: string) => {
    setTestingIndividual(testType)
    try {
      const response = await fetch('/api/test-apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType })
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message || 'Test completed successfully')
        if (data.checkoutUrl) {
          window.open(data.checkoutUrl, '_blank')
        }
      } else {
        toast.error(data.error || 'Test failed')
      }
    } catch (error) {
      toast.error('Failed to run test')
      console.error(error)
    } finally {
      setTestingIndividual(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'failed': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusEmoji = (status: string) => {
    switch(status) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'failed': return '⚠️'
      default: return '⏳'
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Integration Testing</h1>
        <p className="text-gray-600">Test all API integrations and verify they're working correctly</p>
      </div>

      {/* Summary Card */}
      {testResults?.summary && (
        <Card className="p-6 mb-6 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold mb-2">Test Summary</h2>
              <p className="text-gray-700">
                {testResults.summary.passed} passed, {testResults.summary.failed} failed out of {testResults.summary.totalTests} tests
              </p>
            </div>
            <div className="text-3xl">
              {testResults.summary.failed === 0 ? '🎉' : '⚠️'}
            </div>
          </div>
          <div className="mt-4">
            <Button 
              onClick={runAllTests}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? 'Running Tests...' : 'Re-run All Tests'}
            </Button>
          </div>
        </Card>
      )}

      {/* Individual Test Results */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Gmail Test */}
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📧</span>
              <h3 className="text-lg font-semibold">Gmail API</h3>
            </div>
            <span className={`font-medium ${testResults?.tests?.gmail ? getStatusColor(testResults.tests.gmail.status) : ''}`}>
              {testResults?.tests?.gmail ? getStatusEmoji(testResults.tests.gmail.status) : '⏳'}
            </span>
          </div>
          
          {testResults?.tests?.gmail && (
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">{testResults.tests.gmail.message}</p>
              {testResults.tests.gmail.credentials && (
                <div className="bg-gray-50 p-3 rounded space-y-1">
                  <p>Client ID: {testResults.tests.gmail.credentials.hasClientId ? '✅' : '❌'}</p>
                  <p>Client Secret: {testResults.tests.gmail.credentials.hasClientSecret ? '✅' : '❌'}</p>
                  <p>Refresh Token: {testResults.tests.gmail.credentials.hasRefreshToken ? '✅' : '❌'}</p>
                  <p>From: {testResults.tests.gmail.credentials.fromEmail || 'Not set'}</p>
                </div>
              )}
            </div>
          )}
          
          <Button 
            onClick={() => runIndividualTest('sendTestEmail')}
            disabled={testingIndividual === 'sendTestEmail'}
            className="mt-4 w-full"
            variant="outline"
          >
            {testingIndividual === 'sendTestEmail' ? 'Sending...' : 'Send Test Email'}
          </Button>
        </Card>

        {/* Google Calendar Test */}
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <h3 className="text-lg font-semibold">Google Calendar API</h3>
            </div>
            <span className={`font-medium ${testResults?.tests?.googleCalendar ? getStatusColor(testResults.tests.googleCalendar.status) : ''}`}>
              {testResults?.tests?.googleCalendar ? getStatusEmoji(testResults.tests.googleCalendar.status) : '⏳'}
            </span>
          </div>
          
          {testResults?.tests?.googleCalendar && (
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">{testResults.tests.googleCalendar.message}</p>
              {testResults.tests.googleCalendar.calendarsFound !== undefined && (
                <div className="bg-gray-50 p-3 rounded space-y-1">
                  <p>Calendars found: {testResults.tests.googleCalendar.calendarsFound}</p>
                  <p>Primary: {testResults.tests.googleCalendar.primaryCalendar}</p>
                </div>
              )}
            </div>
          )}
          
          <Button 
            onClick={() => runIndividualTest('createTestEvent')}
            disabled={testingIndividual === 'createTestEvent'}
            className="mt-4 w-full"
            variant="outline"
          >
            {testingIndividual === 'createTestEvent' ? 'Creating...' : 'Create Test Event'}
          </Button>
        </Card>

        {/* Stripe Test */}
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💳</span>
              <h3 className="text-lg font-semibold">Stripe API</h3>
            </div>
            <span className={`font-medium ${testResults?.tests?.stripe ? getStatusColor(testResults.tests.stripe.status) : ''}`}>
              {testResults?.tests?.stripe ? getStatusEmoji(testResults.tests.stripe.status) : '⏳'}
            </span>
          </div>
          
          {testResults?.tests?.stripe && (
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">{testResults.tests.stripe.message}</p>
              <div className="bg-gray-50 p-3 rounded space-y-1">
                <p className="font-semibold text-purple-600">{testResults.tests.stripe.mode}</p>
                {testResults.tests.stripe.accountCountry && (
                  <>
                    <p>Country: {testResults.tests.stripe.accountCountry}</p>
                    <p>Charges: {testResults.tests.stripe.chargesEnabled ? '✅' : '❌'}</p>
                    <p>Payouts: {testResults.tests.stripe.payoutsEnabled ? '✅' : '❌'}</p>
                  </>
                )}
              </div>
            </div>
          )}
          
          <Button 
            onClick={() => runIndividualTest('createTestCheckout')}
            disabled={testingIndividual === 'createTestCheckout'}
            className="mt-4 w-full"
            variant="outline"
          >
            {testingIndividual === 'createTestCheckout' ? 'Creating...' : 'Test Checkout (10€)'}
          </Button>
        </Card>

        {/* Database Test */}
        <Card className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🗄️</span>
              <h3 className="text-lg font-semibold">Database</h3>
            </div>
            <span className={`font-medium ${testResults?.tests?.database ? getStatusColor(testResults.tests.database.status) : ''}`}>
              {testResults?.tests?.database ? getStatusEmoji(testResults.tests.database.status) : '⏳'}
            </span>
          </div>
          
          {testResults?.tests?.database && (
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">{testResults.tests.database.message}</p>
              {testResults.tests.database.stats && (
                <div className="bg-gray-50 p-3 rounded space-y-1">
                  <p>Events: {testResults.tests.database.stats.events}</p>
                  <p>Bookings: {testResults.tests.database.stats.bookings}</p>
                  <p>Vouchers: {testResults.tests.database.stats.vouchers}</p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Environment Info */}
      {testResults?.environment && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Environment Configuration</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-medium mb-1">Node Environment</p>
              <p className="text-gray-700">{testResults.environment.nodeEnv || 'Not set'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-medium mb-1">App URL</p>
              <p className="text-gray-700">{testResults.environment.appUrl || 'Not set'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-medium mb-1">NextAuth Secret</p>
              <p className="text-gray-700">{testResults.environment.hasNextAuthSecret ? '✅ Configured' : '❌ Missing'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-medium mb-1">Admin Credentials</p>
              <p className="text-gray-700">{testResults.environment.hasAdminCredentials ? '✅ Configured' : '❌ Missing'}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Raw JSON (for debugging) */}
      <details className="mt-6">
        <summary className="cursor-pointer text-gray-600 hover:text-gray-900">View Raw JSON Response</summary>
        <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-xs">
          {JSON.stringify(testResults, null, 2)}
        </pre>
      </details>
    </div>
  )
}