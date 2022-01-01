function notify(message) {   
    // Add badges and flairs for broadcaster, moderators and verified users
    let title = message.author;
    if (message.isVerified) {
        title += " \u{2713}";
    } else if (message.isModerator) {
        // Better wrench image for moderator?
        title += "\u{1F527}";
    } else if (message.isOwner) {
        title += " | Owner";
    }

    browser.notifications.create({
        "type": "basic",
        "title": title,
        "message": message.content
    });
}

browser.runtime.onMessage.addListener(notify);