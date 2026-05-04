import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class EmailRequest(BaseModel):
    topic: str

class EmailResponse(BaseModel):
    subject: str
    body: str

@app.post("/generate-email", response_model=EmailResponse)
async def generate_email(request: EmailRequest):
    try:
        # System Prompt and Few-Shot Prompting
        system_prompt = (
            "You are a professional email assistant. "
            "Your goal is to generate a high-quality, professional email based on the provided topic. "
            "Return the response in a valid JSON format with 'subject' and 'body' keys."
        )
        
        # Few-shot examples
        few_shot_examples = [
            {"role": "user", "content": "Topic: Resignation from current role"},
            {"role": "assistant", "content": '{"subject": "Resignation - [Your Name]", "body": "Dear [Manager Name],\\n\\nPlease accept this email as formal notification that I am resigning from my position as [Your Position]. My last day will be [Date].\\n\\nThank you for the opportunities for professional and personal development that you have provided me during my time here. I have enjoyed working for the company and appreciate the support provided during my tenure.\\n\\nSincerely,\\n[Your Name]"}'},
            {"role": "user", "content": "Topic: Requesting a meeting to discuss project update"},
            {"role": "assistant", "content": '{"subject": "Project Update Meeting Request", "body": "Hi [Colleague Name],\\n\\nI would like to schedule a brief meeting to discuss the latest updates on [Project Name]. Are you available at any time on [Day/Date]?\\n\\nLooking forward to hearing from you.\\n\\nBest regards,\\n[Your Name]"}'}
        ]

        messages = [
            {"role": "system", "content": system_prompt},
            *few_shot_examples,
            {"role": "user", "content": f"Topic: {request.topic}"}
        ]

        # Call OpenAI with specified parameters
        response = client.chat.completions.create(
            model="gpt-4o-mini", # Or gpt-4o-mini if preferred
            messages=messages,
            temperature=0.7, # Balanced creativity and focus
            max_tokens=500, # Context window limit for response
            response_format={"type": "json_object"} # Forcing JSON output format
        )

        # Parse and return JSON
        import json
        content = json.loads(response.choices[0].message.content)
        return EmailResponse(
            subject=content.get("subject", "No Subject"),
            body=content.get("body", "No Body")
        )

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5005)
