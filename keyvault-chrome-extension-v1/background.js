// KeyVault Background Service Worker
importScripts('config.js');

chrome.runtime.onInstalled.addListener(() => {
  // Save pre-configured values to local storage if not present
  chrome.storage.local.get(['spreadsheetId', 'accessToken', 'appUrl'], (res) => {
    const updates = {};
    if (!res.spreadsheetId && KEYVAULT_DEFAULT_CONFIG.spreadsheetId) {
      updates.spreadsheetId = KEYVAULT_DEFAULT_CONFIG.spreadsheetId;
    }
    if (!res.accessToken && KEYVAULT_DEFAULT_CONFIG.accessToken) {
      updates.accessToken = KEYVAULT_DEFAULT_CONFIG.accessToken;
    }
    if (!res.appUrl && KEYVAULT_DEFAULT_CONFIG.appUrl) {
      updates.appUrl = KEYVAULT_DEFAULT_CONFIG.appUrl;
    }
    if (Object.keys(updates).length > 0) {
      chrome.storage.local.set(updates);
    }
  });
  console.log('KeyVault Extension Installed.');
});

// Listen for keyboard commands anywhere in Chrome
chrome.commands.onCommand.addListener((command) => {
  if (command === 'quick_capture_overlay' || command === '_execute_action') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'TOGGLE_KEYVAULT_MODAL' }).catch(() => {
          // If content script is not yet injected or tab is restricted
        });
      }
    });
  }
});

// Broadcast saved secrets to any open KeyVault Web App tabs
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SECRET_SAVED') {
    // Notify all open tabs running the web app
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id && tab.url && (tab.url.includes('localhost') || tab.url.includes('run.app') || tab.url.includes('keyvault'))) {
          chrome.tabs.sendMessage(tab.id, { 
            action: 'SYNC_SECRET_TO_APP', 
            secret: request.secret 
          }).catch(() => {});
        }
      });
    });
    sendResponse({ success: true });
  }
});
