import { useState, useEffect } from 'react'
import { SystemType, TroubleshootingMode, StandardReadings } from '../types'

interface Draft {
  id: string
  timestamp: string
  locationAddress: string
  systemType: SystemType
  refrigerant: string
  troubleshootingMode: TroubleshootingMode
  readings: StandardReadings
  userNotes: string
}

interface DraftsPageProps {
  onLoadDraft: () => void
}

export default function DraftsPage({ onLoadDraft }: DraftsPageProps) {
  const [drafts, setDrafts] = useState<Draft[]>([])

  useEffect(() => {
    loadDrafts()
  }, [])

  const loadDrafts = () => {
    const savedDrafts = JSON.parse(localStorage.getItem('hvac_diagnostic_drafts') || '[]')
    setDrafts(savedDrafts)
  }

  const deleteDraft = (id: string) => {
    const updatedDrafts = drafts.filter(d => d.id !== id)
    localStorage.setItem('hvac_diagnostic_drafts', JSON.stringify(updatedDrafts))
    setDrafts(updatedDrafts)
    window.dispatchEvent(new Event('draftsUpdated'))
  }

  const loadDraftToForm = (draft: Draft) => {
    localStorage.setItem('hvac_current_draft', JSON.stringify(draft))
    onLoadDraft()
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getModeIcon = (mode: TroubleshootingMode) => {
    switch (mode) {
      case 'cooling': return '❄️'
      case 'heating': return '🔥'
      case 'both': return '🔄'
      default: return '📋'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Saved Drafts
            </h1>
            <p className="text-gray-300">
              Your saved diagnostic drafts. Click to load or delete.
            </p>
          </div>

          {/* Drafts List */}
          {drafts.length === 0 ? (
            <div className="bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-black mb-2">
                No Drafts Saved
              </h3>
              <p className="text-gray-800">
                Save a draft from the diagnostics page to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Draft Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getModeIcon(draft.troubleshootingMode)}</span>
                        <div>
                          <h3 className="text-lg font-bold text-black">
                            {draft.systemType}
                          </h3>
                          <p className="text-sm text-gray-700">
                            Saved {formatDate(draft.timestamp)}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-black">
                            {draft.locationAddress || 'No address'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-black">
                            {Object.keys(draft.readings).length} readings
                          </span>
                        </div>

                        {draft.refrigerant && (
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="text-black">
                              {draft.refrigerant}
                            </span>
                          </div>
                        )}
                      </div>

                      {draft.userNotes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-black line-clamp-2">
                            {draft.userNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => loadDraftToForm(draft)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-semibold whitespace-nowrap"
                      >
                        Load Draft
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this draft?')) {
                            deleteDraft(draft.id)
                          }
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
