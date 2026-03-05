// background.js — service worker for the Prompt Upgrader extension

chrome.runtime.onInstalled.addListener(() => {
  // Context menu: right-click on selected text to save as Q&A question
  chrome.contextMenus.create({
    id: 'save-selection-as-question',
    title: 'Save selection to Prompt Upgrader',
    contexts: ['selection'],
  })
})

// Handle context menu click: open popup with selection pre-filled
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-selection-as-question' && tab?.id) {
    // Store selection and tab URL for the popup to pick up
    chrome.storage.session.set({
      pendingCapture: {
        question: info.selectionText ?? '',
        source: tab.url ?? '',
      },
    })
    // Open the popup programmatically by opening the popup window
    chrome.windows.create({
      url: chrome.runtime.getURL('popup.html?mode=capture'),
      type: 'popup',
      width: 480,
      height: 600,
    })
  }
})
