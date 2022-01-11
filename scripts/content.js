"use-strict";

function attachObserver() {
	observer.disconnect();
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
		attachingObserver = false;
		return;
	} else {
		let config = {
			childList: true
		};
		observer.observe(chat, config);
		console.log("Observer attached");
		attachingObserver = false;
		return;
	}
}

function checkMessage(node) {
	let message = {};
	message.user = {
		isOwner: false,
		isModerator: false,
		isVerified: false,
		isMember: false,
	};
	message.structure = [];
	message.content = [];

	let authorBadges = node.querySelectorAll('yt-live-chat-author-badge-renderer');
	if (authorBadges.length === 0) {
		return;
	} else {
		for (let badge of authorBadges) {
			let badgeType = badge.getAttribute("type");
			if (badgeType === "owner") {
				message.user.isOwner = true;
				continue;
			} else if (badgeType === "moderator") {
				message.user.isModerator = true;
				continue;
			} else if (badgeType === "verified") {
				message.user.isVerified = true;
				continue;
			} else if (badgeType === "member") {
				message.user.isMember = true;
				message.user.memberBadge = node.querySelector("yt-live-chat-author-badge-renderer img").src;
				continue;
			}
		}
	}

	message.id = node.id;
	if (message.id.includes("%")) {
		message.id = message.id.replaceAll("%", "A");
	}
	message.timestamp = node.querySelector("#timestamp").textContent;

	message.user.profilePicture = node.querySelector("#img").src;
	message.user.type = node.getAttribute("author-type");
	message.user.name = node.querySelector("#author-name").textContent;

	for (let messageContent of node.querySelector("#message").childNodes) {
		node_name = messageContent.nodeName;
		if (node_name === "#text") {
			message.structure.push(node_name);
			message.content.push(messageContent.textContent);
		} else if (node_name === "IMG") {
			message.structure.push(node_name);
			message.content.push(messageContent.src);
		}
	}

	if (message.user.isOwner || message.user.isModerator || message.user.isVerified || message.user.isMember) {
		renderMessage(message);
	}
}

function renderMessage(message) {
	let messageElement = document.createElement("div");
	messageElement.id = message.id;
	messageElement.classList.add("chat-message");

	let authorType = "";
	let badge = "";

	if (message.user.isVerified) {
		authorType = "verified";
		badge += `<span class="chat-badges-renderer"><span><svg viewBox="0 0 16 16" preserveAspectRatio="xMidYMid meet"><g transform="scale(0.66)"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"></path></g></svg></span></span>`;
	} else if (message.user.isMember) {
		authorType = "member";
		badge += `<span class="chat-badges-renderer"><span><img src=${message.user.memberBadge}></span></span>`;
	} else if (message.user.isModerator) {
		authorType = "moderator";
		badge += `<span class="chat-badges-renderer"><span><svg viewBox="0 0 16 16" preserveAspectRatio="xMidYMid meet" fill="#4184f3"><g><path d="M9.64589146,7.05569719 C9.83346524,6.562372 9.93617022,6.02722257 9.93617022,5.46808511 C9.93617022,3.00042984 7.93574038,1 5.46808511,1 C4.90894765,1 4.37379823,1.10270499 3.88047304,1.29027875 L6.95744681,4.36725249 L4.36725255,6.95744681 L1.29027875,3.88047305 C1.10270498,4.37379824 1,4.90894766 1,5.46808511 C1,7.93574038 3.00042984,9.93617022 5.46808511,9.93617022 C6.02722256,9.93617022 6.56237198,9.83346524 7.05569716,9.64589147 L12.4098057,15 L15,12.4098057 L9.64589146,7.05569719 Z" class="style-scope yt-icon"></path></g></svg></span></span>`;
	} else if (message.user.isOwner) {
		authorType = "owner";
	}

	let chatContent = "";
	for (i = 0; i < message.structure.length; i++) {
		if (message.structure[i] === "#text") {
			chatContent += message.content[i];
		} else if (message.structure[i] === "IMG") {
			chatContent += `<img src=${message.content[i]}>`;
		}
	}
	messageElement.innerHTML = `<div id="profile-pic"><img src=${message.user.profilePicture}></div><div id="chat-message-content"><span id="chat-message-timestamp">${message.timestamp}</span><span id="chat-message-author" type=${authorType}>${message.user.name}${badge}</span><span id="chat-message-message">${chatContent}</span></div>`;

	// Append child to container
	chatHelper.prepend(messageElement);
	if (message.user.isModerator || message.user.isOwner) {
		messageElement.addEventListener("click", () => {
			this.remove();
		})
	} else {
		setTimeout(deleteMessage, 3000, messageElement.id);
	}
}

function deleteMessage(id) {
	chatMessage = chatHelper.querySelector(`div#${id}.chat-message`);
	chatMessage.remove();
}

function parseMessage(message) {
	if (message.type === "sub_frame") {
		console.log("Attaching observer in 2 seconds...");
		setTimeout(attachObserver, 2000);
	}
}


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

let attachingObserver = false;
browser.runtime.onMessage.addListener(parseMessage);
let observer = new MutationObserver(callback);


let styleSheet = document.createElement("link");
styleSheet.rel = "stylesheet";
styleSheet.href = browser.runtime.getURL("./styles/styles.css");
document.head.prepend(styleSheet);

let chatHelper = document.createElement("div");
chatHelper.id = "YouTube-Chat-Helper";
chatHelper.classList.add("chat-highlight-continer");
document.querySelector("ytd-app").appendChild(chatHelper);