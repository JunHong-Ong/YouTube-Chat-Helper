function searchForChatReplay() {
    console.log("Searching for Chat Replay...");
    let liveChatFrame = document.querySelector('ytd-live-chat-frame iframe');
    let chatReplay = "";

    if (liveChatFrame === null) {
        chatReplay = "";
        console.log("liveChatFrame is null");
    } else {
        chatReplay = liveChatFrame.contentDocument.body.querySelector('div#items.style-scope.yt-live-chat-item-list-renderer');
    }
    
    if (chatReplay !== "" && chatReplay !== null) {
        setTimeout(chatObserver, 3000, chatReplay);
        console.log("Found chatReplay");
        return;
    } else {
        setTimeout(searchForChatReplay, 3000);
        console.log("Trying again");
        return;
    }
}

function chatObserver(node) {
    console.log(node);
    function callback(mutationsList, observer) {
        for (let mutation of mutationsList) {
            if (mutation.addedNodes.length > 0) {
                for (let addedNode of mutation.addedNodes) {
                    let message = {
                        isOwner: false,
                        isModerator: false,
                        isVerified: false
                    }
                    let authorBadges = addedNode.querySelectorAll('yt-live-chat-author-badge-renderer');
                    if (authorBadges.length === 0) {
                        return;
                    } else {
                        // console.log(addedNode);
                        for (let badge of authorBadges) {
                            let badgeType = badge.getAttribute("type");
                            // console.log(badgeType);
                            if (badgeType === "owner") {
                                message.isOwner = true;
                                continue;
                            } else if (badgeType === "moderator") {
                                message.isModerator = true;
                                continue;
                            } else if (badgeType === "verified") {
                                message.isVerified = true;
                                continue;
                            }
                        }
                    }

                    if (message.isOwner || message.isModerator || message.isVerified) {
                        message.author = addedNode.querySelector('span#author-name').textContent;                            
                        let message_span = addedNode.querySelector('span#message');
                        let msg = "";
                        for (let part of message_span.childNodes) {
                            try {
                                if (part.hasAttribute('src')) {
                                    msg += `${part.getAttribute("shared-tooltip-text")} `;
                                }
                            } catch {
                                msg += `${part.textContent} `;
                            };
                        }
                        message.content = msg;
                        console.log(message);
                        // console.log("content sending message!");
                        browser.runtime.sendMessage(message);
                    }
                }
            }
        }
    }
    let observerOptions = {
        childList: true
    };
    let observer = new MutationObserver(callback);
    console.log("Attaching observer...");
    observer.observe(node, observerOptions);
}

function pageObserver() {
    let pageManager = document.querySelector('ytd-watch-flexy');

    if (pageManager === null) {
        setTimeout(pageObserver, 3000);
        return;
    }

    function callback(mutationsList, observer) {
        for (let mutation of mutationsList) {
            if (mutation.attributeName === "hidden") {
                attributeValue = mutation.target.getAttribute("hidden");
                if (attributeValue === null) {
                    searchForChatReplay();
                }
            }
        }
    }
    let observerOptions = {
        attributes: true
    };
    let observer = new MutationObserver(callback);
    console.log("Attaching page observer...");
    observer.observe(pageManager, observerOptions);
    return;
}


searchForChatReplay();
pageObserver();