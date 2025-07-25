MusicMirror 

Overview

Welcome to MusicMirror, a real-time collaborative music synchronization application. This project aims to provide a seamless way for friends to enjoy music together by syncing playback in virtual rooms. 

Highlights

    Real-time Music Sync: Play songs in perfect synchronization with all members in a room.

    Room Management: Create new private rooms with unique IDs or join existing ones.

    Dynamic Usernames: Each user is assigned a random, fun name for easy identification within the room.

    Song Uploads: Contribute to the room's playlist by uploading your own audio files (MP3, WAV, OGG).

    Default Playlist: Enjoy a curated selection of default songs readily available in every room.

    Room Member Display: See who else is online and jamming with you in real-time.

🚀 Technologies Used

MusicMirror is built using a modern MERN stack variant with WebSockets for real-time communication.

Client-side (Frontend)

    React.js: For building interactive user interfaces.

    Vite: A fast build tool for development and optimized production builds.

    Socket.IO Client: Enables real-time, bidirectional communication.

    Axios: Promise-based HTTP client for API interactions.

    React Icons & React Toastify: For UI enhancements and user feedback.

Server-side (Backend)

    Node.js & Express.js: For the server-side application and API endpoints.

    Socket.IO: Powers the real-time music synchronization and room member updates.

    Multer: Handles multipart/form-data for file uploads.

    Cloudinary: Stores and manages uploaded audio files.

    Dotenv & Nodemon: For environment variable management and development server hot-reloading.

💡 Usage

    Welcome & Naming: When you open the application, a modal will appear. You'll be assigned a random, fun username.

    Room Actions:

        To create a new shared space, click the "🎵 Create Room" button. A unique 6-character room ID will be generated for you.

        To join an existing room, enter the room ID in the provided input boxes and click "🎵 Join Room".

    Share Your Room: Once in a room, you can easily copy the room ID displayed on the left column to invite your friends.

    Upload Songs: In the "Upload Music" section, select an audio file (MP3, WAV, OGG) from your device and click "Upload Song" to add it to your room's shared playlist.

    Play & Sync: Choose any song from the "Playlist" section. The playback will instantly synchronize for everyone in the room. You can play, pause, or seek through the song using the controls at the bottom.

    View Members: The right column will show you all the current members in your room.

Note: If synchronization issues occur, try refreshing your page. Please be aware that the mobile experience may have some limitations.


📞 Contact

For any issues or inquiries, feel free to reach out to the developer:

    Email: anshmalgotra@gmail.com

    LinkedIn: Ansh Malgotra