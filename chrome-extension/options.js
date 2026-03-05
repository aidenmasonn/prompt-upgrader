// options.js — settings page for server URL configuration

const DEFAULT_SERVER = 'http://localhost:3000'

document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('server-url')
  const saveBtn  = document.getElementById('save-btn')
  const status   = document.getElementById('status')

  // Load saved value
  chrome.storage.local.get(['serverUrl'], (result) => {
    urlInput.value = result.serverUrl ?? DEFAULT_SERVER
  })

  saveBtn.addEventListener('click', () => {
    const url = urlInput.value.trim().replace(/\/$/, '') // strip trailing slash
    if (!url) { status.textContent = 'Please enter a URL.'; return }

    chrome.storage.local.set({ serverUrl: url }, () => {
      status.textContent = 'Saved!'
      setTimeout(() => { status.textContent = '' }, 2000)
    })
  })
})
