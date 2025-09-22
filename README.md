# Points Dashboard

A real-time dashboard for displaying and tracking house points, integrated with Google Sheets.

## Features

- Real-time points display
- Automatic updates every 15 minutes
- Fullscreen mode (Ctrl+K)
- Force refresh (Ctrl+B)
- **Priority Instance System (Ctrl+Shift+P)**
- Responsive design
- Google Sheets integration

## Priority Instance System

The dashboard includes a priority system to manage API rate limits when multiple instances are deployed (e.g., on Vercel free tier). This ensures only one instance actively fetches data while others display a blocking message.

### How it works:

1. **Activation**: Use the browser console command to activate priority mode
2. **Priority Indicator**: A small green dot appears in the bottom left corner when priority mode is active
3. **API Blocking**: Non-priority instances will stop making API requests and show "This is not the primary instance. :(" in the refresh status area (preserving the main message from Google Sheets)
4. **Non-Sticky Priority**: Priority is automatically cleared when the tab is closed or refreshed - must be manually reassigned
5. **Session-Based**: Priority status is stored in sessionStorage, so it doesn't persist across browser sessions
6. **Manual Assignment**: Priority is disabled by default and must be explicitly activated using the console command

### Console Command:

To activate/deactivate priority mode, open the browser console (F12) and run:
```javascript
initPriority('+9F3A7-1CDE4-B82F0-64A9C-5DBE1')
```

### Keyboard Shortcuts:

- `Ctrl+K`: Toggle fullscreen mode
- `Ctrl+B`: Force refresh data

## Show Board Integration
This is a boolean function that switches between TRUE and FALSE. (any other input will absolutely destory the system :). In the event that TRUE is passed, the normal display is shown. However, in the event that FALSE is presented, a custom display writing "Something big happening" and the default message (from H21) will be placed in big text. <br><br> This can be useful when you want to hide some data (like big mixup) and gets updated along the others once every 15 minutes.

## Event Point Handling
In the event that something such as an event occured (such as a trivia, etc), it would be imprudent to award all of those points via your account. (This floats Top contributer and shows up in latest activity). Instead, input all of the points via the form, then edit the emails all to 'eventengine' (case insensitive) so that "your" points are not mixed in with "event" points. 