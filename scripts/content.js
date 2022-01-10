"use-strict";

function attachObserver() {
    if (attachingObserver) {
        return;
    }
    attachingObserver = true;

    let chatFrame = document.querySelector("iframe#chatframe");
    if (chatFrame === null) {
        console.log("Retrying in 2 seconds...");
        setTimeout(attachObserver, 2000);
        attachingObserver = false;
        return;
    }

    let chat = chatFrame.contentDocument.body.querySelector("div#item-scroller div#items");
    if (chat === null) {
        console.log("Retrying in 2 seconds...");
        setTimeout(attachObserver, 2000);
    } else {
        let config = {childList: true};
        function callback(mutationsList, observer) {
            for (let mutation of mutationsList) {
                if (mutation.addedNodes.length > 0) {
                    for (let node of mutation.addedNodes) {
                        if (node.nodeName === "YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER") {
                            checkMessage(node);
                        }
                    }
                }
            }
            return;
        }
        let observer = new MutationObserver(callback);
        observer.observe(chat, config);
        console.log("Observer attached");
    }
    attachingObserver = false;
    return;
}

function checkMessage(node) {
    let user = {
        isOwner: false,
        isModerator: false,
        isVerified: false,
        isMember: false,
    }

    let authorBadges = node.querySelectorAll('yt-live-chat-author-badge-renderer');
    // User is a normie
    if (authorBadges.length === 0) {
        return;
    } else {
        for (let badge of authorBadges) {
            let badgeType = badge.getAttribute("type");
            if (badgeType === "owner") {
                user.isOwner = true;
                continue;
            } else if (badgeType === "moderator") {
                user.isModerator = true;
                continue;
            } else if (badgeType === "verified") {
                user.isVerified = true;
                continue;
            } else if (badgeType === "member") {
                user.isMember = true;
                continue;
            }
        }
    }

    if (user.isOwner || user.isModerator || user.isVerified || user.isMember) {
        renderMessage(node, user);
    }
    return;
}

function renderMessage(node, messageProperties) {
    let messageElement = document.createElement("div");
    id = `messageid${index}`;
    index++;
    messageElement.id = id;
    messageElement.classList.add("chat-message");

    let profilePicture = node.querySelector("#author-photo img").src;
    let profilePictureElement = document.createElement("div");
    profilePictureElement.id = "profile-pic";
    profilePictureElement.innerHTML = `<img src=${profilePicture}>`;
    messageElement.appendChild(profilePictureElement);

    let messageContentElement = document.createElement("div");
    messageContentElement.id = "chat-message-content";
    // Timestamp
    let timestamp = node.querySelector("#timestamp").textContent;
    messageContentElement.innerHTML += `<span id="chat-message-timestamp">${timestamp}</span>`

    // Author
    let author = node.querySelector('span#author-name').textContent
    let authorType = ""
    let badges = ""

    if (messageProperties.isVerified) {
        authorType = "verified"
        badges += `<span class="chat-badges-renderer">
                        <span>
                            <svg viewBox="0 0 16 16" preserveAspectRatio="xMidYMid meet">
                                <g transform="scale(0.66)">
                                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"></path>
                                </g>
                            </svg>
                        </span>
                    </span>`
    }
    if (messageProperties.isMember) {
        let memberBadge = node.querySelector("yt-live-chat-author-badge-renderer img").src
        authorType = "member"
        badges += `<span class="chat-badges-renderer">
                        <span>
                            <img src=${memberBadge}>
                        </span>
                    </span>`
    }
    if (messageProperties.isModerator) {
        authorType = "moderator";
        badges += `<span class="chat-badges-renderer">
                        <span>
                            <svg viewBox="0 0 16 16" preserveAspectRatio="xMidYMid meet" fill="#4184f3">
                                <g>
                                    <path d="M9.64589146,7.05569719 C9.83346524,6.562372 9.93617022,6.02722257 9.93617022,5.46808511 C9.93617022,3.00042984 7.93574038,1 5.46808511,1 C4.90894765,1 4.37379823,1.10270499 3.88047304,1.29027875 L6.95744681,4.36725249 L4.36725255,6.95744681 L1.29027875,3.88047305 C1.10270498,4.37379824 1,4.90894766 1,5.46808511 C1,7.93574038 3.00042984,9.93617022 5.46808511,9.93617022 C6.02722256,9.93617022 6.56237198,9.83346524 7.05569716,9.64589147 L12.4098057,15 L15,12.4098057 L9.64589146,7.05569719 Z" class="style-scope yt-icon"></path>
                                </g>
                            </svg>
                        </span>
                    </span>`
    }
    if (messageProperties.isOwner) {
        authorType = "owner";
    }
    messageContentElement.innerHTML += `<span id="chat-message-author" type=${authorType}>${author}${badges}</span>`
    // Message
    let message_span = node.querySelector('span#message');
    let message = "";
        for (let part of message_span.childNodes) {
            try {
                if (part.hasAttribute('src')) {
                    message += `<img src=${part.getAttribute("src")}>`;
                }
            } catch {
                message += `${part.textContent}`;
            };
        }
    messageContentElement.innerHTML += `<span id="chat-message-message">${message}</span>`;
    messageElement.appendChild(messageContentElement);

    // Append child to container
    chatHelper.appendChild(messageElement);
    if (messageProperties.isModerator) {
        setTimeout(deleteMessage, 10000, id);
    } else {
        setTimeout(deleteMessage, 3000, id);        
    }
}

function deleteMessage(id) {
    chatMessage = document.querySelector(`div#${id}.chat-message`);
    chatMessage.remove();
}

function parseMessage(message) {
    if (message.type === "sub_frame") {
        console.log("Attaching observer in 2 seconds...");
        setTimeout(attachObserver, 2000);
    }
}

let index = 0

let attachingObserver = false;
browser.runtime.onMessage.addListener(parseMessage)

let styleSheet = document.createElement("link");
styleSheet.rel = "stylesheet";
styleSheet.href = browser.runtime.getURL("./styles/styles.css");
document.head.prepend(styleSheet);

let chatHelper = document.createElement("div");
chatHelper.id = "YouTube-Chat-Helper";
chatHelper.classList.add("chat-highlight-continer");
document.querySelector("ytd-app").appendChild(chatHelper);