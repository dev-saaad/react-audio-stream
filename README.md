# React Socket Client for Audio Streaming

This React application serves as a client for socket-based audio streaming, primarily designed for basic testing purposes.

## Setup

1. Clone the repository
2. Install dependencies:

```
yarn
```

3. Update the `ID_TOKEN` in the `AudioStream.ts` file

## Usage

1. Start the application:

```
yarn dev
```

2. Open your browser and navigate to the app
3. Open the browser console

## Features

- **Auto-connect**: The app automatically connects to the server socket when the page loads
- **Manual reconnect**: To reconnect, simply refresh the page
- **Audio streaming**: Press the "Start Recording" button to begin sending audio stream

## Monitoring Responses

To check the responses from the server:

1. Open browser DevTools
2. Go to the Network tab
3. Select "WS" from the available tabs
4. Click on the "listen" call
5. Select the "Messages" sub-tab

By default, this shows all messages. To filter for received messages only:

- Use the dropdown menu and select "Receive"

## Troubleshooting

If you encounter any issues with the connection or audio streaming, try the following:

1. Ensure your `ID_TOKEN` is correct and up-to-date
2. Check your internet connection
3. Verify that the server is running and accessible
