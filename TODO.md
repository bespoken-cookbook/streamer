Ask user to play or resume on open
Add produced intro
Change to "Scan Titles"
Use produced audio
Fallback on TTS if no produced audio - but just of the title
Check all the core intents - loop, shuffle, etc.
Make sure cards are working correctly

Add support for directive events

Ensure CI is working

Talk about debugging story
    Especially with regard to that one commit
    
After RESUME and NO, does not correctly reset the state (stays in resume mode, cannot scan titles)