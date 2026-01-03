# **App Name**: Gemini to Notion

## Core Features:

- Voice Recording: Record audio using the device's microphone and store the audio Blob temporarily in the browser's state.
- AI Transcription: Transcribe the recorded audio using Gemini 1.5 Flash.
- AI Text Processing: Use Gemini to clean the transcript (remove filler words), fix grammar, and generate a 5-word title.
- Notion Integration: Send the cleaned text and generated title to Notion using a Firebase Cloud Function and the Notion API. Securely store NOTION_API_KEY and NOTION_DATABASE_ID as environment variables.
- User Authentication: Implement user authentication using Firebase Auth with 'Login with Google'.
- Preview and Retry: Display an editable preview of the AI-generated title and cleaned text. Allow users to retry processing with the stored audio if an error occurs.
- Mobile Responsiveness: Optimize the app for iOS and Android mobile browsers, ensuring a seamless experience.

## Style Guidelines:

- Primary color: Deep indigo (#4F5D75) for a sophisticated and focused feel.
- Background color: Dark slate gray (#2D3142) for a minimalist, dark theme.
- Accent color: Muted lavender (#BFC0C0) to complement indigo in a harmonious balance; used for interactive elements such as the 'Send to Notion' button.
- Body and headline font: 'Inter', a grotesque-style sans-serif for a modern and neutral look. 
- Use Lucide-React icons for a consistent and clean interface.
- Implement a minimalist layout with a large central 'Record' button and clear sections for preview and submission.
- Use a pulse animation on the 'Record' button and haptic feedback when recording starts and stops for a tactile user experience (navigator.vibrate).