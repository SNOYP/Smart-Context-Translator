chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "open-elegant-translate",
    title: "Перевести текст",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "open-elegant-translate") {
    chrome.tabs.sendMessage(tab.id, {
      action: "open_popup",
      text: info.selectionText
    });
  }
});
