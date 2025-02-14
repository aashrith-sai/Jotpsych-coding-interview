from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import random
import openai
import json
from dotenv import load_dotenv
import os
from typing import Dict, Optional, Literal

app = Flask(__name__)
CORS(app)


load_dotenv()
# TODO: Implement version tracking
VERSION = "1.0.0"

user_model_cache = {}          # Caches user_id -> LLM model
categorization_cache = {}      # Caches (transcription_string, user_id) -> classification result


def process_transcription(job_id: str, audio_data: bytes):
    """Mock function to simulate async transcription processing. Returns a random transcription."""
    time.sleep(random.randint(5, 20))
    return random.choice([
        "I've always been fascinated by cars, especially classic muscle cars from the 60s and 70s. The raw power and beautiful design of those vehicles is just incredible.",
        # "Bald eagles are such majestic creatures. I love watching them soar through the sky and dive down to catch fish. Their white heads against the blue sky is a sight I'll never forget.",
        # "Deep sea diving opens up a whole new world of exploration. The mysterious creatures and stunning coral reefs you encounter at those depths are unlike anything else on Earth."
    ])



def categorize_transcription(transcription_string: str, user_id: str):
    cache_key = (transcription_string, user_id)
    if cache_key in categorization_cache:
        app.logger.info("Returning cached categorization result")
        return categorization_cache[cache_key]

    model_to_use = get_user_model_from_db_cached(user_id)

    if model_to_use == "openai":
        openai.api_key = os.getenv("OPENAI_API_KEY")

        # We instruct the assistant to strictly return valid JSON with a "genre" key
        # and no additional text. The "genre" value must be from the provided list.
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a helpful genre-classification assistant. "
                    "You must respond in valid JSON only, and with the following format:\n\n"
                    '{"genre": "<ONE_OF_THE_VALID_GENRES>"}\n\n'
                    "Do not return any additional keys or text outside of the JSON. "
                    "Do not provide explanations."
                )
            },
            {
                "role": "user",
                "content": (
                    f"Classify the following transcript into exactly one genre. "
                    f"The possible genres are: Business, Finance, Health, "
                    f"Entertainment, Technology, Science, Sports, Adventure, Politics, History, "
                    f"Mystery, Romance, Horror, Fantasy, Comedy, Drama, Action, Thriller, "
                    f"Documentary, Biography, Crime, Music, Animation, Family, War, Western, "
                    f"Musical, Short, Adult, Reality-TV, Talk-Show, Game-Show, News, Film-Noir, "
                    f"Sci-Fi.\n\n"
                    f"Transcript:\n{transcription_string}\n\n"
                    f"Remember: Only return valid JSON of the format above."
                )
            }
        ]

        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.0  
            )

            raw_response = response.choices[0].message["content"].strip()

            # Attempt to parse the raw_response as JSON
            try:
                json_response = json.loads(raw_response)
            except json.JSONDecodeError:
                # The LLM did not return valid JSON
                raise ValueError("Response was not valid JSON.")

            # Validate the presence of the "genre" key
            if "genre" not in json_response:
                raise ValueError("Response did not contain a 'genre' key.")

            genre = json_response["genre"]
            # Validate the genre against the list of valid genres
            valid_genres = [
                "Business", "Finance", "Health", "Entertainment", "Technology", "Science", "Sports",
                "Adventure", "Politics", "History", "Mystery", "Romance", "News", "Sci-Fi"
            ]

            if genre not in valid_genres:
                raise ValueError(f"Invalid genre '{genre}'. Must be one of: {', '.join(valid_genres)}")
            
            result = {
                "genre": genre,
                "success": True
            }
            categorization_cache[cache_key] = result
            return result

        except Exception as e:
            return {
                "error": str(e),
                "success": False
            }

    elif model_to_use == "anthropic":
        # TODO: Implement Anthropic categorization
        return {
            "error": "Anthropic model not implemented",
            "success": False
        }

    else:
        return {
            "error": f"Unsupported model '{model_to_use}'",
            "success": False
        }


def get_user_model_from_db_cached(user_id: str):
    # If we have this user_id's model in cache, return it
    if user_id in user_model_cache:
        app.logger.info("Returning cached user model")
        return user_model_cache[user_id]
    
    # Otherwise, get from DB (the slow call), cache it, then return
    model_to_use = get_user_model_from_db(user_id)
    user_model_cache[user_id] = model_to_use
    return model_to_use


def get_user_model_from_db(user_id: str) -> Literal["openai", "anthropic"]:
    """
    Mocks a slow and expensive function to simulate fetching a user's preferred LLM model from database
    Returns either 'openai' or 'anthropic' after a random delay.
    """
    time.sleep(random.randint(2, 8))
    return "openai"


@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    result = process_transcription("xyz", "abcde")

    # TODO: Implement categorization

    category = categorize_transcription(result, "user_id")

    if category.get("success") is False:
        raise Exception(f"Error categorizing transcription: {category['error']}")

    return jsonify({
        "transcription": result,
        "category": category["genre"],
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
