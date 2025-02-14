THIS IS THE MOST IMPORTANT FILE IN THE ENTIRE REPO! HUMAN WRITING ONLY! NO AI ALLOWED!

PART-1 
In the useEffect hook, the recordingTime state was not passed. As a result, there was no increase in the counter. Once we add this, the issue of increment and automatic stopping is resolved. Also, we can set the recordingTime to zero to after the recording is stopped to be able to record again. 


PART-2
To acheive this, I introduced a new state (isTranscribing) to track if the transcription is in progress.
I Set isTranscribing to true while sending the audio for transcription. I added a loading message 
while transcription is ongoing. I have reset isTranscribing to false when transcription is complete.

PART-3
For version compatibility I have added the AudioRecorder.tsx to use API service and added methods like @app.after_request and @app.before_request to validate and prompt users to reload the frontend.


PART-6

I have used open ai for the chat completion/classifiaction. I have used a prompt with several a few classes in which the 
llm has to choose the most similar genre. I have added the open ai API key in my .env file in the backend folder with the
var name OPENAI_API_KEY and I am setting it inside the app.py using dot env and openai.api_key attribute.

I am also forcing the llm to return in json format and validating the format.

I am also validating the genre if they belong to the expected ones or return exception if not.


PART-7

I have implemented two maps that would be helpful for the cacheing mechanism. The first one stores the users preferred llm
and the second one stores the respones of the user and the transcript. 

The function get_user_model_from_db_cached will check if the llm prefernce is given already or not. The caching mechanism for the
response is implemented in the categorize_transcription itself. 