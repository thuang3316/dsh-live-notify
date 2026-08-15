// dsh-live-notify: Host half (Dynamic Cordis Plugin)
// 以 code.host 形式交给 cordis_define。
return {
  apply(ctx) {
    const sessionQuery = ctx.get('sessionQuery')
    if (sessionQuery === undefined) return

    // sessionId -> latest unread event (backlog policy: latest per session wins)
    const pending = new Map()

    const record = (kind) => (payload) => {
      if (payload === undefined || payload === null) return
      const agent = payload.agent
      if (agent === undefined || agent === null) return
      const id = String(agent.id)
      if (id === undefined || id.length === 0) return
      const existing = pending.get(id)
      if (existing !== undefined && existing.kind === 'error' && kind !== 'error') return
      pending.set(id, { sessionId: id, title: null, kind, at: Date.now() })
    }

    ctx.on('agent/status', ({ agent, status }) => {
      if (status !== 'idle') return
      record('done')({ agent })
    })
    ctx.on('agent/error', record('error'))

    harness.handle('poll', async (args) => {
      const current = args !== null && typeof args === 'object' && typeof args.current === 'string'
        ? args.current
        : undefined
      const out = []
      for (const entry of pending.values()) {
        if (entry.sessionId === current) continue
        if (entry.title === null) {
          try {
            const snap = await sessionQuery.readTitle(entry.sessionId)
            if (snap !== undefined && snap !== null && typeof snap.title === 'string' && snap.title.length > 0) {
              entry.title = snap.title
            }
          } catch (err) {
            // keep null -> client falls back to session id
          }
        }
        out.push({
          sessionId: entry.sessionId,
          title: entry.title === null ? entry.sessionId : entry.title,
          kind: entry.kind,
          at: entry.at,
        })
      }
      pending.clear()
      return out
    })
  },
}
