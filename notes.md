THIS IS THE MOST IMPORTANT FILE IN THE ENTIRE REPO! HUMAN WRITING ONLY! NO AI ALLOWED!


PART-6

I have used open ai for the chat completion/classifiaction. I have used a prompt with several a few classes in which the 
llm has to choose the most similar genre. I have added the open ai API key in my .env file in the backend folder with the
var name OPENAI_API_KEY and I am setting it inside the app.py using dot env and openai.api_key attribute.

I am also forcing the llm to return in json format and validating the format.

I am also validating the genre if they belong to the expected ones or return exception if not.