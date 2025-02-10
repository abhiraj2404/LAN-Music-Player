# LAN Music Player

A web-based music player that allows you to play music synchronized across multiple devices on your local network. Perfect for creating a multi-room audio system or sharing music with friends in the same network.

## Features

- 🎵 Synchronized playback across all connected devices
- 📱 Server-client architecture (one controller, multiple listeners)
- 📋 Persistent playlist that survives server restarts
- ⏭️ Auto-play next song in playlist
- 🎚️ Progress bar with seeking capability
- 📊 Real-time playback status
- 🔄 Automatic reconnection if connection is lost

## Prerequisites

- Node.js (v12.0.0 or higher)
- npm (Node Package Manager)
- A local network where all devices can connect

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/lan-music-player.git
   ```
2. Navigate into the project directory:
   ```bash
   cd lan-music-player
   ```
3. Install the necessary dependencies:
   ```bash
   npm install
   ```

## Setup and Usage

1. **Start the Server:**
   - Run the following command to start the server:
     ```bash
     npm start
     ```
   - The server will start and listen on a specified port (default is 3000). You can change the port by setting the `PORT` environment variable.

2. **Connect Devices:**
   - Ensure all devices are connected to the same local network.
   - On each device, open a web browser and navigate to the server's IP address followed by the port number. For example, `http://192.168.1.2:3000`.

3. **Control Playback:**
   - Use one device as the controller to manage the playlist and playback.
   - Add songs to the playlist by uploading files from the controller device.
   - Control playback (play, pause, skip) from the controller device. All connected devices will synchronize with the controller.

4. **Enjoy Synchronized Music:**
   - All connected devices will play the music in sync, providing a seamless multi-room audio experience.

## Troubleshooting

- **Connection Issues:** Ensure all devices are on the same network and the server is running.
- **Playback Lag:** Check network stability and reduce the number of connected devices if necessary.

## Contributing

Feel free to fork the repository and submit pull requests. Contributions are welcome!
It would be helpful if someone suggests a way to improve the synchronization. 

## License

This project is licensed under the MIT License.