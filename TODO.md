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
Handle audio player context info
	"AudioPlayer": {
      "offsetInMilliseconds": 16741,
      "token": "1",
      "playerActivity": "STOPPED"
    },
    
AudioPlayer Speaker

Send errors on bad responses from skills
Expected previous token handling
Cleanup the index.d.ts (needs to be copied) and index.js.map
Make sure everything works when no reply is received
Why do I need a finish and fast-forward on audioplayer? Fast-forward should be enough
LaunchRequests can start with an offset and track for the player state - how does this happen
Improve code coverage
Add support for JSON schemas
validate slots when called with intended
AudioItem flattens the stream element out - probably should not do this? Or not expose it that way?
    
**Questions**
What happens when replace enqueued is called but nothing is playing?
    Assume it just starts playing, but perhaps there is an error thrown? need to check
Do I get a playbacknearlyfinished everytime someone pauses and resumes?
    Yes
What do I get everytime a track changes?
    PlaybackFinished, PlaybackStared
Does help get sent to the skill?
Can we create a certifier, that runs through suite of common cases?
There is no intent when the user says stop, right?
    Stop becomes a PauseIntent same as Pause - but need to check on behavior
Does the intent model get checked for builtin actions like Shuffle? Do they get sent if not present?
What to do with expectedprevioustoken on the audioitem?
Does stop need to be called when replaceAll comes down with a play directive?
Does sessionendedrequest include audioplayer info in the context?
    Going to assume yes for the moment
How do I feel about the state model of the emulator?
Do we want to use the Global.config with API access?



	
