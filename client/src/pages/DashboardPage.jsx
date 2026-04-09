import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../lib/api.js'
import { getOrCreateSessionId } from '../lib/session.js'
import { Card, CardHeader } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
  )
}

export function DashboardPage() {
  const sessionId = useMemo(() => getOrCreateSessionId(), [])
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const result = await api.analytics(sessionId)
      setData(result)
    } catch (e) {
      setError(e.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const chartData = Object.entries(data?.mistakeCounts || {})
    .filter(([k]) => k !== 'none')
    .map(([type, count]) => ({
      type:
        type === 'conceptual_error'
          ? 'Conceptual error'
          : type === 'arithmetic_error'
            ? 'Arithmetic error'
            : type.replaceAll('_', ' '),
      count,
    }))

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader
          title="Learning analytics"
          subtitle="Tracks your accuracy and common mistake types for this session."
          right={
            <Button variant="secondary" onClick={load} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </Button>
          }
        />

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Accuracy"
          value={data ? `${Math.round((data.accuracy || 0) * 100)}%` : '—'}
          sub="Correct steps / total steps"
        />
        <StatCard
          label="Attempts"
          value={data ? data.totalSteps : '—'}
          sub="Total submitted steps"
        />
        <StatCard
          label="Recommended difficulty"
          value={data ? data.recommendedDifficulty : '—'}
          sub={data?.suggestedProblem ? `Suggested: ${data.suggestedProblem}` : ''}
        />
      </section>

      <Card>
        <div className="text-sm font-semibold text-slate-900">Common mistake types</div>
        <div className="mt-1 text-sm text-slate-600">
          This helps the tutor adapt and helps you focus on patterns.
        </div>

        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" tick={{ fontSize: 12 }} interval={0} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#4f46e5" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {chartData.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
            No mistakes recorded yet. Start solving in the Tutor page.
          </div>
        ) : null}
      </Card>

      <Card>
        <div className="text-sm font-semibold text-slate-900">How to improve next</div>
        <div className="mt-1 text-sm text-slate-600">
          Personalized suggestions based on your recent attempts.
        </div>
        <div className="mt-4 grid gap-2">
          {(data?.improvementTips || []).map((t, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200/70 bg-white/70 p-3 text-sm text-slate-700"
            >
              {t}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

