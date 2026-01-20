# Chrome Web Store Listing

Use this template when submitting to the Chrome Web Store.

## Store Listing Details

### Extension Name
Mindful Tab Switch

### Short Description (132 characters max)
Creates a mindful barrier when opening distracting websites - requires you to state your intention before accessing them.

### Detailed Description

Stay focused with intentional browsing. Mindful Tab Switch helps you break the habit of mindlessly opening distracting websites.

**How it works:**

When you try to open a monitored site (like Twitter, Reddit, or YouTube), a prompt appears asking you to explain why you're visiting. You must type at least 50 characters before you can continue.

This simple barrier creates a moment of reflection, helping you:
- Reduce mindless browsing
- Stay focused on your goals
- Build awareness of your browsing habits
- Reclaim your time and attention

**Features:**

• Customizable site list - Add or remove any sites you want to monitor
• Clean, minimal interface - No distractions, just functionality
• Privacy-focused - All data stays on your device
• Easy toggle - Quickly enable/disable when needed
• Works on new tabs, links, and tab switches

**Perfect for:**
- Students trying to focus on studying
- Professionals avoiding work distractions
- Anyone building better digital habits

The goal isn't to completely block websites, but to make you pause and think before accessing them. Sometimes you'll have legitimate reasons - and that's perfectly fine!

**Privacy:**
This extension does NOT collect, store, or transmit any of your data. Everything stays local on your device.

---

### Category
**Productivity**

### Language
English

---

## Required Assets

### Icon
- Already in your folder: `icon128.png`

### Screenshots (1280x800 or 640x400)
You need to take 1-5 screenshots showing:

1. **The barrier modal** - Screenshot when the prompt appears on a blocked site
2. **The settings popup** - Screenshot of the extension popup with site list
3. **Site management** - Screenshot showing how to add/remove sites

Tips for screenshots:
- Use a clean browser window
- Show the extension in action
- Highlight key features
- Use simple, clear examples

### Promotional Images (Optional but recommended)

**Small Tile:** 440x280px
**Marquee:** 1400x560px

These help your extension stand out in the store.

---

## Privacy Policy

Since your extension doesn't collect data, use this simple policy:

```
PRIVACY POLICY

Mindful Tab Switch does not collect, store, or transmit any personal data or browsing information.

All settings and site lists are stored locally on your device using Chrome's sync storage API. This data is only synced across your own devices if you're signed into Chrome.

We do not:
- Track your browsing history
- Collect personal information
- Send data to external servers
- Use analytics or tracking

Your privacy is completely protected.

Last updated: [Current Date]
```

You can host this on a GitHub Pages site or in a simple text file.

---

## Permissions Justification

When submitting, you'll need to explain why you need each permission:

**tabs:** Required to detect when user switches to or opens a monitored website
**storage:** Required to save user's custom site list and extension settings
**activeTab:** Required to inject the barrier modal on the current tab
**host_permissions (all_urls):** Required to run the content script on any website the user wants to monitor

---

## Submission Checklist

Before submitting:

- [ ] All 3 icon files are in the folder (16, 48, 128px)
- [ ] Extension tested thoroughly in Chrome
- [ ] All console errors fixed
- [ ] Screenshots taken (1-5 images)
- [ ] Privacy policy hosted somewhere
- [ ] Store listing text prepared
- [ ] Developer account created ($5 fee paid)
- [ ] Extension packaged using `package.sh`

---

## After Approval

Once approved:

1. **Announce it** - Share on Twitter, Reddit, HackerNews, ProductHunt
2. **Gather feedback** - Listen to user reviews
3. **Update regularly** - Fix bugs, add features
4. **Maintain privacy** - Never add tracking/analytics without disclosure

---

## Links

- **Chrome Web Store Developer Dashboard:** https://chrome.google.com/webstore/devconsole
- **Extension Publishing Guide:** https://developer.chrome.com/docs/webstore/publish/
- **Best Practices:** https://developer.chrome.com/docs/webstore/best_practices/

---

Good luck with your launch! 🚀
