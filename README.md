# Points Dashboard

A real-time dashboard for displaying and tracking house points, integrated with Google Sheets.

## Features

- Real-time points display
- Automatic updates every 30 seconds
- Fullscreen mode (Ctrl+K)
- Responsive design
- Google Sheets integration

## Show Board Integration
This is a boolean function that switches between TRUE and FALSE. (any other input will absolutely destory the system :). In the event that TRUE is passed, the normal display is shown. However, in the event that FALSE is presented, a custom display writing "Something big happening" and the default message (from H21) will be placed in big text. <br><br> This can be useful when you want to hide some data (like big mixup) and gets updated along the others once every 15 minutes.

## Event Point Handling.
In the event that something such as an event occured (such as a trivia, etc), it would be imprudent to award all of those points via your account. (This floats Top contributer and shows up in latest activity). Instead, input all of the points via the form, then edit the emails all to 'eventengine' (case insensitive) so that "your" points are not mixed in with "event" points. 