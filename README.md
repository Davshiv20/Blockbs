# Blockbs

A browser extension that helps you stay focused by creating a mindful barrier when switching to distracting websites. Before accessing sites like Twitter, Reddit, or YouTube, you'll be prompted to explain your intention in at least 50 characters.

## Features 

- **Intentional Browsing**: Prompts you to explain why you're visiting a site before allowing access
- **Customizable Site List**: Add or remove sites you want to monitor
- **Minimal Design**: Clean, monochrome interface
- **Easy Toggle**: Quickly enable/disable the extension when needed
- **No Data Collection**: Everything stays local on your device

## Installation

### Chrome / Edge / Brave

1. **Download the Extension**
   - Clone or download this repository to your computer

2. **Open Extension Settings**
   - Open Chrome/Edge/Brave
   - Navigate to `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode" (toggle in top-right corner)

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `blockbs` folder
   - The extension should now appear in your browser!

4. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in your toolbar
   - Find "BlockBs" and click the pin icon

### Firefox (Alternative Instructions)

1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file in the `blockbs` folder
4. Note: In Firefox, this will only work until you restart the browser (for permanent installation, the extension needs to be signed)

## How to Use

### First Time Setup

1. Click the extension icon in your browser toolbar
2. The popup will show default monitored sites (Twitter, Facebook, Reddit, etc.)
3. Add or remove sites according to your needs
4. Toggle the extension on/off as needed

### Daily Use

1. When you try to switch to a monitored site, a modal will appear
2. Type your reason for visiting the site (minimum 50 characters)
3. Press Enter or click "Continue" to proceed
4. Click "Go Back" if you decide you don't really need to visit the site

### Managing Sites

- **Add a site**: Type the domain (e.g., `twitter.com`) and click "Add"
- **Remove a site**: Click the × button next to any site in the list
- **Disable temporarily**: Toggle the switch off in the popup

## Default Monitored Sites

The extension comes pre-configured with these commonly distracting sites:
- twitter.com / x.com
- facebook.com
- instagram.com
- reddit.com
- youtube.com


You can add or remove any sites you want!

## Customization

### Changing the Character Limit

Edit `content.js` and find this line:
```javascript
if (length >= 50) {
```

Change `50` to your preferred minimum character count.

### Styling the Modal

Edit `modal.css` to customize colors, fonts, animations, etc.

### Adjusting Approval Timeout

In `background.js`, find:
```javascript
if (approval && approval.approved && (now - approval.timestamp < 5000)) {
```

Change `5000` (milliseconds) to adjust how long a site stays approved after you provide a reason.

## Technical Details

### Architecture

- **manifest.json**: Extension configuration and permissions
- **background.js**: Service worker that monitors tab switches
- **content.js**: Injected script that displays the barrier modal
- **popup.html/css/js**: Extension settings interface
- **modal.css**: Styles for the barrier modal

### Permissions

- `tabs`: Monitor tab switching
- `storage`: Save your settings and monitored sites
- `activeTab`: Interact with the current tab
- `<all_urls>`: Inject content scripts on all sites

### Storage

All data is stored locally using Chrome's sync storage:
- `enabled`: Boolean for on/off state
- `blockedSites`: Array of monitored domains

## Troubleshooting

**The modal doesn't appear:**
- Make sure the extension is enabled (check the popup toggle)
- Refresh the tab you're trying to visit
- Check if the site is in your monitored list

**The extension icon doesn't show:**
- Click the puzzle piece icon and pin the extension
- Make sure Developer Mode is enabled in chrome://extensions

**Sites are added but not blocked:**
- Make sure you're entering just the domain (e.g., `twitter.com`, not `https://www.twitter.com`)
- Try refreshing your browser

## Tips for Success

1. **Be honest with yourself**: The goal is awareness, not punishment
2. **Start with high-distraction sites**: Add sites you tend to visit mindlessly
3. **Review your reasons**: They'll help you understand your browsing patterns
4. **Don't overdo it**: Too many monitored sites might make you disable the extension
5. **Use the toggle**: It's okay to disable it when you genuinely need to browse freely

## Contributing

Feel free to modify and improve this extension! Some ideas:
- Add statistics/analytics of your browsing patterns
- Allow different character limits per site
- Add time-based rules (e.g., only block during work hours)
- Create a log of all your reasons for later reflection

## License

This project is open source and free to use, modify, and distribute.

## Credits

Built for better focus and intentional browsing.

---

**Remember**: The goal isn't to completely block sites, but to make you pause and think before accessing them. Sometimes you'll have legitimate reasons, and that's perfectly fine.
