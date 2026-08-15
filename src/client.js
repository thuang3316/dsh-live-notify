// dsh-live-notify: Client half (Dynamic Cordis Plugin)
// 以 code.client 形式交给 cordis_define。
return {
  inject: ['timer'],
  apply(ctx) {
    const slots = ctx.get('slots')
    if (slots === undefined) return
    const sessions = ctx.get('sessions')

    styles.insert(`
      .ln-live-root { position: fixed; right: 20px; bottom: 20px; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; pointer-events: none; z-index: 2000; }
      .ln-live-actions { display: flex; gap: 10px; pointer-events: none; align-items: center; }
      .ln-live-bell {
        pointer-events: auto; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
        border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.14)); border-radius: 50%; cursor: pointer; line-height: 1;
        background: var(--dsw-alias-bg-layer-2, rgba(30,34,46,0.92));
        color: var(--dsw-alias-label-primary, #e6e9ef);
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        font-size: 16px;
      }
      .ln-live-bell:hover { filter: brightness(1.08); }
      .ln-live-bell.ln-live-bell-muted {
        border-color: var(--dsw-alias-state-warn-primary, #e8b86d);
        color: var(--dsw-alias-state-warn-primary, #e8b86d);
      }
      .ln-live-status {
        pointer-events: auto; display: flex; align-items: center; gap: 8px; padding: 8px 14px;
        border-radius: 999px; font-size: 12px; line-height: 18px; cursor: pointer;
        background: var(--dsw-alias-bg-layer-2, rgba(30,34,46,0.92));
        color: var(--dsw-alias-label-primary, #e6e9ef);
        border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.14));
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      }
      .ln-live-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; border: 1.5px solid var(--dsw-alias-label-secondary, #9aa3b2); background: transparent; }
      .ln-live-state { font-weight: 600; }
      .ln-live-status.ln-live-status-on { border-color: var(--dsw-alias-state-success-primary, #7ee2a8); }
      .ln-live-status.ln-live-status-on .ln-live-dot { background: var(--dsw-alias-state-success-primary, #7ee2a8); border-color: var(--dsw-alias-state-success-primary, #7ee2a8); }
      .ln-live-status.ln-live-status-on .ln-live-state { color: var(--dsw-alias-state-success-primary, #7ee2a8); }
      .ln-live-status.ln-live-status-off { border-color: var(--dsw-alias-state-error-primary, #ff7b7b); }
      .ln-live-status.ln-live-status-off .ln-live-dot { border-color: var(--dsw-alias-state-error-primary, #ff7b7b); background: transparent; }
      .ln-live-status.ln-live-status-off .ln-live-state { color: var(--dsw-alias-state-error-primary, #ff7b7b); }
      .ln-live-status.ln-live-status-warn { border-color: var(--dsw-alias-state-warn-primary, #e8b86d); }
      .ln-live-status.ln-live-status-warn .ln-live-dot { border-color: var(--dsw-alias-state-warn-primary, #e8b86d); background: transparent; }
      .ln-live-status.ln-live-status-warn .ln-live-state { color: var(--dsw-alias-state-warn-primary, #e8b86d); }
      .ln-live-status.ln-live-status-blocked { border-color: var(--dsw-alias-state-error-primary, #ff7b7b); }
      .ln-live-status.ln-live-status-blocked .ln-live-dot { background: var(--dsw-alias-state-error-primary, #ff7b7b); border-color: var(--dsw-alias-state-error-primary, #ff7b7b); }
      .ln-live-status.ln-live-status-blocked .ln-live-state { color: var(--dsw-alias-state-error-primary, #ff7b7b); }
      .ln-live-stack { display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
      .ln-live-toast {
        pointer-events: auto; position: relative; display: flex; align-items: center; gap: 12px;
        max-width: 400px; padding: 14px 16px; border-radius: 14px;
        background: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-2, rgba(30,34,46,0.95)));
        color: var(--dsw-alias-label-primary, #e6e9ef);
        border: 1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.14));
        box-shadow: 0 8px 28px rgba(0,0,0,0.25);
        font-size: 14px; line-height: 22px; cursor: pointer;
        animation: ln-live-in 160ms ease-out;
        overflow: hidden;
      }
      .ln-live-toast::before {
        content: ''; position: absolute; left: 0; top: 10px; bottom: 10px; width: 3px;
        border-radius: 2px; background: var(--dsw-alias-state-success-primary, #7ee2a8);
      }
      .ln-live-toast.ln-live-error::before { background: var(--dsw-alias-state-error-primary, #ff7b7b); }
      .ln-live-toast.ln-live-hint::before { background: var(--dsw-alias-brand-primary, #4f7cff); }
      .ln-live-toast:hover { filter: brightness(1.04); }
      .ln-live-icon { flex: none; display: grid; place-items: center; font-size: 18px; font-weight: 700; }
      .ln-live-toast.ln-live-error .ln-live-icon { color: var(--dsw-alias-state-error-primary, #ff7b7b); }
      .ln-live-title { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .ln-live-kind { flex: none; font-size: 12px; color: var(--dsw-alias-label-secondary, #9aa3b2); }
      .ln-live-close { flex: none; border: none; background: transparent; color: inherit; opacity: 0.6; cursor: pointer; font-size: 16px; padding: 0 2px; line-height: 1; }
      .ln-live-close:hover { opacity: 1; }
      @keyframes ln-live-in {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .ln-live-toast { animation: none; }
      }
    `)

    let currentSessionId
    let mutedFlag = false
    let sysEnabledFlag = false
    let counter = 0
    let originalTitle = null
    let lastSystemAt = null
    let lastDropAt = null
    let lastHintAt = 0
    let lastAwayFlag = null
    const unread = new Map()

    function fmtTime(ts) {
      if (ts === null) return '无'
      const d = new Date(ts)
      const p = function (n) { return n < 10 ? '0' + n : String(n) }
      return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
    }

    slots.inject('shell.overlay', () => slots.register(
      { name: 'shell.overlay', id: 'live-notify', order: 0, label: 'Live notifications' },
      function ToastHost(props) {
        const useSessions = props !== undefined && props !== null ? props.useSessions : undefined
        const current = typeof useSessions === 'function'
          ? useSessions(function select(s) { return s === undefined || s === null ? undefined : s.current })
          : undefined
        currentSessionId = current

        const [muted, setMuted] = React.useState(false)
        const [toasts, setToasts] = React.useState([])
        const [sys, setSys] = React.useState({
          status: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
          enabled: typeof Notification !== 'undefined' && Notification.permission === 'granted',
        })
        mutedFlag = muted
        sysEnabledFlag = sys.enabled

        function isAway() {
          if (typeof document === 'undefined' || typeof document.hidden !== 'boolean') return null
          const hidden = document.hidden
          if (hidden) return true
          if (typeof document.hasFocus === 'function' && !document.hasFocus()) return true
          return false
        }

        function sysAvailable() {
          return sysEnabledFlag && typeof Notification !== 'undefined' && Notification.permission === 'granted'
        }

        function setTitleFlash(on) {
          if (typeof document === 'undefined') return
          if (on) {
            if (originalTitle === null) originalTitle = document.title
            if (document.title.indexOf('● ') !== 0) document.title = '● ' + originalTitle
          } else if (originalTitle !== null) {
            document.title = originalTitle
            originalTitle = null
          }
        }

        function fireSystem(title, kind, sessionId) {
          if (!sysAvailable()) return false
          try {
            const n = new Notification(title + (kind === 'error' ? ' 出错' : ' 完成'), {
              body: kind === 'error' ? '会话回合出错' : '会话回合已完成',
            })
            n.onclick = function () {
              if (typeof window !== 'undefined' && typeof window.focus === 'function') window.focus()
              if (sessions !== undefined && typeof sessions.open === 'function' && sessionId !== undefined
                && sessionId.indexOf('test:') !== 0 && sessionId.indexOf('hint:') !== 0) sessions.open(sessionId)
              try { n.close() } catch (e) { /* already closed */ }
            }
            lastSystemAt = Date.now()
            return true
          } catch (err) {
            console.error('system notification constructor threw: ' + (err && err.message ? err.message : String(err)))
            return false
          }
        }

        function addToast(item, now) {
          counter += 1
          const ttl = item.kind === 'error' ? 15000 : 8000
          setToasts(function (prev) {
            const next = prev.slice()
            next.unshift({
              id: item.sessionId + ':' + String(item.at) + ':' + String(counter),
              sessionId: item.sessionId,
              title: item.title,
              kind: item.kind,
              deadline: now + ttl,
              remaining: ttl,
              paused: false,
            })
            while (next.length > 3) next.pop()
            return next
          })
        }

        function mergeUnread(items) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i]
            if (item === null || typeof item !== 'object') continue
            if (typeof item.sessionId !== 'string' || typeof item.kind !== 'string') continue
            if (item.kind !== 'done' && item.kind !== 'error') continue
            const existing = unread.get(item.sessionId)
            if (existing !== undefined && existing.kind === 'error' && item.kind !== 'error') continue
            unread.set(item.sessionId, {
              sessionId: item.sessionId,
              title: typeof item.title === 'string' && item.title.length > 0 ? item.title : item.sessionId,
              kind: item.kind,
              at: typeof item.at === 'number' ? item.at : Date.now(),
            })
          }
        }

        function drainAway(now) {
          const out = []
          for (const [id, item] of unread) {
            unread.delete(id)
            if (now - item.at < 600000) out.push(item)
          }
          return out
        }

        function drainPresent(now, returning) {
          const out = []
          for (const [id, item] of unread) {
            if (id !== currentSessionId || returning === true) {
              unread.delete(id)
              out.push(item)
            }
          }
          return out
        }

        function pollOnce() {
          const away = isAway()
          const returning = away !== true && lastAwayFlag === true
          lastAwayFlag = away
          host.call('poll', {}).then(function (items) {
            if (Array.isArray(items)) mergeUnread(items)
            if (mutedFlag) { unread.clear(); return }
            const now = Date.now()
            if (away === true) {
              const drained = drainAway(now)
              for (let i = 0; i < drained.length; i++) {
                fireSystem(drained[i].title, drained[i].kind, drained[i].sessionId)
                addToast(drained[i], now)
              }
              if (drained.length > 0 && !sysAvailable()) {
                setTitleFlash(true)
                lastDropAt = now
                console.error('away notification dropped: permission='
                  + String(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission) + ', enabled=' + String(sysEnabledFlag))
                if (now - lastHintAt > 60000) {
                  lastHintAt = now
                  addToast({ sessionId: 'hint:sys', title: '离开期间有回合完成。点击右下角状态胶囊开启系统通知,离开也能收到提醒', kind: 'hint', at: now }, now)
                }
              }
            } else {
              const drained = drainPresent(now, returning)
              for (let i = 0; i < drained.length; i++) addToast(drained[i], now)
            }
          }, function (err) {
            console.error('poll failed', err && err.message ? err.message : String(err))
          })
        }

        React.useEffect(function pollEffect() {
          pollOnce()
          return ctx.interval(pollOnce, 500)
        }, [])

        React.useEffect(function visibilityEffect() {
          if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return
          function onVis() {
            setTitleFlash(document.hidden !== true)
            pollOnce()
          }
          document.addEventListener('visibilitychange', onVis)
          if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('focus', function () { setTitleFlash(false); pollOnce() })
          }
          return function () {
            document.removeEventListener('visibilitychange', onVis)
            if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
              window.removeEventListener('focus', function () {})
            }
          }
        }, [])

        React.useEffect(function sweepEffect() {
          return ctx.interval(function sweep() {
            setToasts(function (prev) {
              if (prev.length === 0) return prev
              const now = Date.now()
              const away = isAway() === true
              let changed = false
              const next = prev.map(function (t) {
                if (t.paused) return t
                if (away && t.deadline < now + 3000) {
                  changed = true
                  return Object.assign({}, t, { deadline: now + 3000 })
                }
                return t
              }).filter(function (t) {
                return t.paused || t.deadline > now
              })
              if (!changed && next.length === prev.length) return prev
              return next
            })
          }, 250)
        }, [])

        function onEnter(t) {
          return function () {
            setToasts(function (prev) {
              return prev.map(function (x) {
                if (x.id !== t.id) return x
                return Object.assign({}, x, { paused: true, remaining: Math.max(0, x.deadline - Date.now()) })
              })
            })
          }
        }
        function onLeave(t) {
          return function () {
            setToasts(function (prev) {
              return prev.map(function (x) {
                if (x.id !== t.id) return x
                return Object.assign({}, x, { paused: false, deadline: Date.now() + x.remaining })
              })
            })
          }
        }
        function dismiss(id) {
          return function () {
            setToasts(function (prev) { return prev.filter(function (x) { return x.id !== id }) })
          }
        }
        function onSysClick() {
          if (typeof Notification === 'undefined') return
          if (Notification.permission === 'granted') {
            setSys(function (s) { return Object.assign({}, s, { enabled: !s.enabled }) })
            return
          }
          if (Notification.permission === 'denied') return
          Notification.requestPermission().then(function (p) {
            setSys({ status: p, enabled: p === 'granted' })
          })
        }
        function openToast(t) {
          return function () {
            if (t.sessionId.indexOf('hint:') === 0) {
              onSysClick()
              dismiss(t.id)()
              return
            }
            if (sessions !== undefined && typeof sessions.open === 'function'
              && t.sessionId.indexOf('test:') !== 0) sessions.open(t.sessionId)
            dismiss(t.id)()
          }
        }

        const toastEls = toasts.map(function (t) {
          const kindClass = t.kind === 'error' ? ' ln-live-error' : (t.kind === 'hint' ? ' ln-live-hint' : '')
          return React.createElement('div', {
            key: t.id,
            className: 'ln-live-toast' + kindClass,
            onClick: openToast(t),
            onMouseEnter: onEnter(t),
            onMouseLeave: onLeave(t),
            role: 'button',
          },
            React.createElement('span', { className: 'ln-live-icon' },
              t.kind === 'error' ? '✕' : (t.kind === 'hint' ? '💡' : '✓')),
            React.createElement('span', { className: 'ln-live-title' }, t.title),
            React.createElement('span', { className: 'ln-live-kind' },
              t.kind === 'error' ? '出错' : (t.kind === 'hint' ? '提示' : '完成')),
            React.createElement('button', {
              className: 'ln-live-close',
              onClick: function (ev) { ev.stopPropagation(); dismiss(t.id)() },
              'aria-label': '关闭通知',
            }, '×'),
          )
        })

        let stateText
        let statusClass = 'ln-live-status'
        let statusTitle
        if (sys.status === 'denied') {
          stateText = '被阻止'
          statusClass += ' ln-live-status-blocked'
          statusTitle = '浏览器已阻止通知,请在浏览器设置中允许'
        } else if (sys.status === 'default') {
          stateText = '点击授权'
          statusClass += ' ln-live-status-warn'
          statusTitle = '点击授权系统通知(离开页面时提醒)'
        } else if (sys.enabled) {
          stateText = '已开启'
          statusClass += ' ln-live-status-on'
          statusTitle = '系统通知已开启,点击关闭'
        } else {
          stateText = '已关闭'
          statusClass += ' ln-live-status-off'
          statusTitle = '系统通知已关闭,点击开启'
        }
        const statusPill = React.createElement('div', {
          className: statusClass,
          onClick: onSysClick,
          title: statusTitle + ' | 上次系统通知: ' + fmtTime(lastSystemAt) + ' | 上次丢弃: ' + fmtTime(lastDropAt),
          role: 'button',
        },
          React.createElement('span', { className: 'ln-live-dot' }),
          React.createElement('span', null, '系统通知'),
          React.createElement('span', { className: 'ln-live-state' }, stateText),
        )

        const bell = React.createElement('button', {
          className: 'ln-live-bell' + (muted ? ' ln-live-bell-muted' : ''),
          onClick: function () { setMuted(function (m) { return !m }) },
          title: muted ? '通知已静音,点击恢复' : '通知开启,点击静音',
          'aria-label': muted ? '恢复通知' : '静音通知',
        }, muted ? '🔕' : '🔔')

        return React.createElement('div', { className: 'ln-live-root' },
          React.createElement('div', { className: 'ln-live-stack', role: 'status', 'aria-live': 'polite' }, toastEls),
          React.createElement('div', { className: 'ln-live-actions' }, statusPill, bell),
        )
      },
    ))
  },
}
