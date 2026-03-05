// popup.js — handles the save-to-memory form

const DEFAULT_SERVER = 'http://localhost:3000'

async function getServerUrl() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['serverUrl'], (result) => {
      resolve(result.serverUrl ?? DEFAULT_SERVER)
    })
  })
}

async function init() {
  const sourceEl = document.getElementById('source')
  const questionEl = document.getElementById('question')
  const answerEl = document.getElementById('answer')
  const tagsEl = document.getElementById('tags')
  const saveBtn = document.getElementById('save-btn')
  const clearBtn = document.getElementById('clear-btn')
  const statusEl = document.getElementById('status')
  const settingsLink = document.getElementById('settings-link')

  // Check if we were opened via the context menu (session storage has pending capture)
  const params = new URLSearchParams(window.location.search)
  const isCaptureMode = params.get('mode') === 'capture'

  if (isCaptureMode) {
    const pending = await new Promise((resolve) => {
      chrome.storage.session.get(['pendingCapture'], (result) => {
        resolve(result.pendingCapture ?? null)
      })
    })
    if (pending) {
      sourceEl.value = pending.source ?? ''
      questionEl.value = pending.question ?? ''
      chrome.storage.session.remove(['pendingCapture'])
    }
  } else {
    // Auto-fill source from the active tab URL
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab?.url) sourceEl.value = tab.url
    } catch {
      // activeTab permission may not be available in all contexts
    }
  }

  function showStatus(message, type) {
    statusEl.textContent = message
    statusEl.className = type
    if (type === 'success') {
      setTimeout(() => { statusEl.className = ''; statusEl.textContent = '' }, 3000)
    }
  }

  saveBtn.addEventListener('click', async () => {
    const source = sourceEl.value.trim()
    const question = questionEl.value.trim()
    const answer = answerEl.value.trim()
    const tags = tagsEl.value.trim()

    if (!question) { showStatus('Question is required.', 'error'); return }
    if (!answer)   { showStatus('Answer is required.', 'error'); return }

    saveBtn.disabled = true
    saveBtn.textContent = 'Saving…'
    statusEl.className = ''

    try {
      const serverUrl = await getServerUrl()
      const res = await fetch(`${serverUrl}/api/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: source || (await getActiveTabUrl()),
          question,
          answer,
          tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error ?? `Server returned ${res.status}`)
      }

      showStatus('Saved to memory!', 'success')
      // Clear answer and tags, keep source for follow-up saves from the same page
      answerEl.value = ''
      questionEl.value = ''
      tagsEl.value = ''
    } catch (err) {
      showStatus(`Error: ${err.message}`, 'error')
    } finally {
      saveBtn.disabled = false
      saveBtn.textContent = 'Save to Memory'
    }
  })

  clearBtn.addEventListener('click', () => {
    sourceEl.value = ''
    questionEl.value = ''
    answerEl.value = ''
    tagsEl.value = ''
    statusEl.className = ''
    statusEl.textContent = ''
  })

  settingsLink.addEventListener('click', (e) => {
    e.preventDefault()
    chrome.runtime.openOptionsPage()
  })
}

async function getActiveTabUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    return tab?.url ?? ''
  } catch {
    return ''
  }
}

init()
