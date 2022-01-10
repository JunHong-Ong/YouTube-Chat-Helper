"use-strict";

function temporaryName(requestDetails) {
    if (requestDetails.type === "sub_frame") {
        tabId = requestDetails.tabId;
        videoUrl = requestDetails.originUrl;
        iFrameSrc = requestDetails.url;
        
        console.log(requestDetails);
        console.log(`Tab ID: ${tabId}\nVideo URL: ${videoUrl}\niframe source: ${iFrameSrc}`)

        browser.tabs.sendMessage(
            tabId,
            {type: "sub_frame"}
        )
    }
}

let tabId = 0;
let youtube = "https://www.youtube.com/*";
let videoUrl = "";
let iFrameSrc = "";

browser.webRequest.onBeforeSendHeaders.addListener(
    temporaryName,
    {urls: [youtube]}
);