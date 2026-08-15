// dsh-live-notify: Client half (Dynamic Cordis Plugin)
// 以 code.client 形式交给 cordis_define。
return {
  inject: ['timer'],
  apply(ctx) {
    const slots = ctx.get('slots')
    if (slots === undefined) return
    const sessions = ctx.get('sessions')
    const localeSvc = ctx.get('locale')

    const STR = {
      zh: {
        done: '完成', error: '出错', hint: '提示',
        sysDoneSuffix: ' 完成', sysErrorSuffix: ' 出错',
        sysDoneBody: '会话回合已完成', sysErrorBody: '会话回合出错',
        sysLabel: '系统通知',
        on: '已开启', off: '已关闭', allow: '点击授权', blocked: '被阻止',
        onTitle: '系统通知已开启,点击关闭',
        offTitle: '系统通知已关闭,点击开启',
        allowTitle: '点击授权系统通知(离开页面时提醒)',
        blockedTitle: '浏览器已阻止通知,请在浏览器设置中允许',
        hintToast: '离开期间有回合完成。点击侧边栏底部的系统通知按钮开启,离开也能收到提醒',
        muteLabel: '静音', mutedLabel: '已静音',
        bellOnTitle: '通知开启,点击静音', bellOffTitle: '通知已静音,点击恢复',
        bellOnAria: '静音通知', bellOffAria: '恢复通知',
        closeAria: '关闭通知',
        diagLast: '上次系统通知', diagDrop: '上次丢弃', none: '无',
      },
      en: {
        done: 'Done', error: 'Error', hint: 'Hint',
        sysDoneSuffix: ' done', sysErrorSuffix: ' error',
        sysDoneBody: 'Turn completed', sysErrorBody: 'Turn errored',
        sysLabel: 'Notifications',
        on: 'Enabled', off: 'Disabled', allow: 'Tap to allow', blocked: 'Blocked',
        onTitle: 'System notifications on, click to turn off',
        offTitle: 'System notifications off, click to turn on',
        allowTitle: 'Click to allow system notifications (alerts when you leave the page)',
        blockedTitle: 'Notifications are blocked by the browser; allow them in browser settings',
        hintToast: 'A turn completed while you were away. Enable system notifications from the sidebar button',
        muteLabel: 'Mute', mutedLabel: 'Muted',
        bellOnTitle: 'Notifications on, click to mute', bellOffTitle: 'Muted, click to unmute',
        bellOnAria: 'Mute notifications', bellOffAria: 'Unmute notifications',
        closeAria: 'Close notification',
        diagLast: 'Last system notification', diagDrop: 'Last dropped', none: 'none',
      },
    }

    let uiLang = 'zh'
    function detectLang() {
      if (localeSvc === undefined) return 'zh'
      try {
        const snap = localeSvc.getLocale()
        const active = snap === undefined || snap === null ? undefined : snap.active
        if (typeof active === 'string' && active.indexOf('en') === 0) return 'en'
        return 'zh'
      } catch (err) {
        return 'zh'
      }
    }
    uiLang = detectLang()
    const langSetters = []
    ctx.on('locale/change', function () {
      const next = detectLang()
      if (next !== uiLang) {
        uiLang = next
        for (let i = 0; i < langSetters.length; i++) langSetters[i]()
      }
    })
    function T() { return uiLang === 'en' ? STR.en : STR.zh }

    styles.insert(`
      .ln-live-root { position: fixed; right: 20px; bottom: 20px; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; pointer-events: none; z-index: 2000; }
      .ln-live-stack { display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
      .ln-live-toast {
        pointer-events: auto; position: relative; display: flex; align-items: center; gap: 12px;
        max-width: min(400px, calc(100vw - 40px)); padding: 14px 16px; border-radius: 14px;
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
      @media (max-width: 1480px) {
        .ln-live-root { bottom: 150px; right: 16px; }
      }
      /* Sidebar footer actions (match the shipped Cordis panel badge). */
      .ln-side-btn {
        display: inline-flex; align-items: center; gap: 8px; width: 100%; height: 49px;
        padding: 0 8px 0 6px; border: none; border-radius: 12px; background: transparent;
        color: var(--dsw-alias-label-primary, #e6e9ef); font-family: inherit; font-size: 14px;
        cursor: pointer; overflow: hidden;
      }
      .ln-side-btn:hover { background: var(--dsw-alias-interactive-bg-hover-solid, rgba(0,0,0,0.05)); }
      .ln-side-icon { flex: none; position: relative; display: grid; place-items: center; font-size: 15px; }
      .ln-side-dot { position: absolute; top: -2px; right: -4px; width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid var(--dsw-alias-bg-base, #fff); background: transparent; }
      .ln-side-btn-on .ln-side-dot { background: var(--dsw-alias-state-success-primary, #7ee2a8); }
      .ln-side-btn-off .ln-side-dot { background: var(--dsw-alias-state-error-primary, #ff7b7b); }
      .ln-side-btn-warn .ln-side-dot { background: var(--dsw-alias-state-warn-primary, #e8b86d); }
      .ln-side-btn-blocked .ln-side-dot { background: var(--dsw-alias-state-error-primary, #ff7b7b); }
      .ln-side-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .ln-side-state { flex: none; margin-left: auto; color: var(--dsw-alias-label-tertiary, #9aa3b2); font-size: 12px; line-height: 16px; }
      .ln-side-btn-muted { color: var(--dsw-alias-state-warn-primary, #e8b86d); }
      .ln-side-circle {
        display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px;
        padding: 0; border: none; border-radius: 50%; background: transparent;
        color: var(--dsw-alias-label-primary, #e6e9ef); cursor: pointer; position: relative; font-size: 15px;
      }
      .ln-side-circle:hover { background: var(--dsw-alias-interactive-bg-hover-solid, rgba(0,0,0,0.05)); }
      .ln-side-circle .ln-side-dot { top: 1px; right: 1px; border-color: var(--dsw-alias-bg-base, #fff); }
      .ln-side-circle.ln-side-btn-muted { color: var(--dsw-alias-state-warn-primary, #e8b86d); }
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
    let resizing = false
    let resizeDisposer = null
    let sysClickHandler = null
    const unread = new Map()

    function fmtTime(ts) {
      if (ts === null) return T().none
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

        const [toasts, setToasts] = React.useState([])
        const [langTick, setLangTick] = React.useState(0)
        const t = T()
        if (langTick >= 0) { /* locale changed: re-render with new strings */ }

        React.useEffect(function langEffect() {
          const setter = function () { setLangTick(function (x) { return x + 1 }) }
          langSetters.push(setter)
          return function () {
            const idx = langSetters.indexOf(setter)
            if (idx >= 0) langSetters.splice(idx, 1)
          }
        }, [])

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
            const n = new Notification(title + (kind === 'error' ? t.sysErrorSuffix : t.sysDoneSuffix), {
              body: kind === 'error' ? t.sysErrorBody : t.sysDoneBody,
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
          if (resizing) return
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
                  addToast({ sessionId: 'hint:sys', title: T().hintToast, kind: 'hint', at: now }, now)
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

        function onWindowResize() {
          resizing = true
          if (resizeDisposer !== null) resizeDisposer()
          resizeDisposer = ctx.timeout(function () {
            resizing = false
            resizeDisposer = null
            pollOnce()
          }, 300)
        }

        React.useEffect(function pollEffect() {
          pollOnce()
          return ctx.interval(pollOnce, 1000)
        }, [])

        React.useEffect(function resizeEffect() {
          if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return
          window.addEventListener('resize', onWindowResize)
          return function () {
            window.removeEventListener('resize', onWindowResize)
            if (resizeDisposer !== null) { resizeDisposer(); resizeDisposer = null }
            resizing = false
          }
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
            if (resizing) return
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
          }, 500)
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
        function openToast(t) {
          return function () {
            if (t.sessionId.indexOf('hint:') === 0) {
              if (sysClickHandler !== null) sysClickHandler()
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
              t.kind === 'error' ? t.error : (t.kind === 'hint' ? t.hint : t.done)),
            React.createElement('button', {
              className: 'ln-live-close',
              onClick: function (ev) { ev.stopPropagation(); dismiss(t.id)() },
              'aria-label': t.closeAria,
            }, '×'),
          )
        })

        return React.createElement('div', { className: 'ln-live-root' },
          React.createElement('div', { className: 'ln-live-stack', role: 'status', 'aria-live': 'polite' }, toastEls),
        )
      },
    ))

    slots.inject('sidebar.footer.action', () => slots.register(
      { name: 'sidebar.footer.action', id: 'live-notify-sys', order: 10, label: () => T().sysLabel },
      function SysButton(props) {
        const wide = props !== undefined && props.wide === true
        const [tick, setTick] = React.useState(0)
        const [sys, setSys] = React.useState({
          status: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
          enabled: typeof Notification !== 'undefined' && Notification.permission === 'granted',
        })
        const t = T()
        if (tick >= 0) { /* locale changed */ }
        React.useEffect(function () {
          const setter = function () { setTick(function (x) { return x + 1 }) }
          langSetters.push(setter)
          sysClickHandler = onSysClick
          return function () {
            const idx = langSetters.indexOf(setter)
            if (idx >= 0) langSetters.splice(idx, 1)
            sysClickHandler = null
          }
        }, [])

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
        sysEnabledFlag = sys.enabled

        let stateText
        let stateClass
        let title
        if (sys.status === 'denied') {
          stateText = t.blocked; stateClass = 'ln-side-btn-blocked'; title = t.blockedTitle
        } else if (sys.status === 'default') {
          stateText = t.allow; stateClass = 'ln-side-btn-warn'; title = t.allowTitle
        } else if (sys.enabled) {
          stateText = t.on; stateClass = 'ln-side-btn-on'; title = t.onTitle
        } else {
          stateText = t.off; stateClass = 'ln-side-btn-off'; title = t.offTitle
        }
        title = title + ' | ' + t.diagLast + ': ' + fmtTime(lastSystemAt) + ' | ' + t.diagDrop + ': ' + fmtTime(lastDropAt)

        if (!wide) {
          return React.createElement('button', {
            className: 'ln-side-circle ' + stateClass,
            onClick: onSysClick,
            title,
            'aria-label': t.sysLabel + ' ' + stateText,
          },
            React.createElement('span', { className: 'ln-side-icon' }, '📢'),
            React.createElement('span', { className: 'ln-side-dot' }),
          )
        }
        return React.createElement('button', {
          className: 'ln-side-btn ' + stateClass,
          onClick: onSysClick,
          title,
          'aria-label': t.sysLabel + ' ' + stateText,
        },
          React.createElement('span', { className: 'ln-side-icon' }, '📢', React.createElement('span', { className: 'ln-side-dot' })),
          React.createElement('span', { className: 'ln-side-label' }, t.sysLabel),
          React.createElement('span', { className: 'ln-side-state' }, stateText),
        )
      },
    ))

    slots.inject('sidebar.footer.action', () => slots.register(
      { name: 'sidebar.footer.action', id: 'live-notify-mute', order: 20, label: () => T().muteLabel },
      function MuteButton(props) {
        const wide = props !== undefined && props.wide === true
        const [tick, setTick] = React.useState(0)
        const [muted, setMuted] = React.useState(false)
        const t = T()
        if (tick >= 0) { /* locale changed */ }
        React.useEffect(function () {
          const setter = function () { setTick(function (x) { return x + 1 }) }
          langSetters.push(setter)
          return function () {
            const idx = langSetters.indexOf(setter)
            if (idx >= 0) langSetters.splice(idx, 1)
          }
        }, [])
        mutedFlag = muted
        const title = muted ? t.bellOffTitle : t.bellOnTitle
        const label = muted ? t.mutedLabel : t.muteLabel
        if (!wide) {
          return React.createElement('button', {
            className: 'ln-side-circle' + (muted ? ' ln-side-btn-muted' : ''),
            onClick: function () { setMuted(function (m) { return !m }) },
            title,
            'aria-label': muted ? t.bellOffAria : t.bellOnAria,
          }, muted ? '🔕' : '🔔')
        }
        return React.createElement('button', {
          className: 'ln-side-btn' + (muted ? ' ln-side-btn-muted' : ''),
          onClick: function () { setMuted(function (m) { return !m }) },
          title,
          'aria-label': muted ? t.bellOffAria : t.bellOnAria,
        },
          React.createElement('span', { className: 'ln-side-icon' }, muted ? '🔕' : '🔔'),
          React.createElement('span', { className: 'ln-side-label' }, label),
        )
      },
    ))
  },
}
