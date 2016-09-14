**Now**
Document syntax
Figure out why npm version patch is not working
Add re-prompt text
    Now playing?
    Special 
Handle help text

S3 race condition

{tag} does not work correctly
    See bio on brand haiku

**Nice To Have**
Create separate codec service
Create Docker image for Travis to run on
    For ffmpeg and AWS credentials
    Image MUST be private if it has AWS credentials
Deploy it!
Put this in a separate repo?

**Speak Testing**
AudioPlayer Speaker
Add session support
Change BSTSpeak to BSTEmulator?
Add support for JSON schemas
Handle audio player context info
	"AudioPlayer": {
      "offsetInMilliseconds": 16741,
      "token": "1",
      "playerActivity": "STOPPED"
    },
T4est launch requests
Include playeractivity on audioplayer requests
Removed debug flag from lambdarunner
validate slots when called with intended
Does not seem like session.used is being called at the right time
    Is it a new session if I call resume after some time?
Need to pass attributes back and forth
Make sure everything works when no reply is received
    
**Questions**
What happens when replace enqueued is called but nothing is playing?
    Assume it just starts playing, but perhaps there is an error thrown? need to check
Confirm that skills can jump straight in without launch request
Add support for context device
Do I get a playbacknearlyfinished everytime someone pauses and resumes?
What do I get everytime a track changes?
Does help get sent to the skill?
Can we create a certifier, that runs through suite of common cases?
There is no intent when the user says stop, right?
Does the intent model get checked for builtin actions like Shuffle? Do they get sent if not present?
What to do with expectedprevioustoken on the audioitem?
Does stop need to be called when replaceAll comes down with a play directive?



	
