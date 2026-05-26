import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import AsyncOpenAI
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

# Initialize client: use Groq if GROQ_API_KEY is set, otherwise default to OpenAI
groq_api_key = os.getenv("GROQ_API_KEY")
if groq_api_key:
    client = AsyncOpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=groq_api_key
    )
    DEFAULT_MODEL = "llama-3.3-70b-versatile"
else:
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    DEFAULT_MODEL = "gpt-4o-mini"

class EmailRequest(BaseModel):
    topic: str

@app.post("/generate-email")
@app.post("/ai/generate-email")
# This handles both environments (with and without the /ai prefix in the proxy)
async def generate_email(request: EmailRequest):
    try:
        # System Prompt instructing tone classification and detailed humanized composition
        system_prompt = (
            "You are an expert, highly skilled email composer. "
            "Your task is to analyze the user's provided topic and determine if it requires a formal/business tone (Official) or a casual/friendly tone (Unofficial).\n\n"
            "Guidelines:\n"
            "1. Classification:\n"
            "   - Official: Job applications, business inquiries, professional updates, work apologies, resignations, formal requests. Tone should be professional, respectful, structured, yet warm and natural. Avoid robotic AI transitions/phrases like 'I hope this email finds you well', 'please find attached', or 'feel free to reach out'. Write like a competent, articulate professional.\n"
            "   - Unofficial: Casual check-ins, messages to friends or family, informal invites, casual thank yous, congratulations. Tone should be relaxed, friendly, authentic, and direct. Use natural contractions (I'm, we're, it's) and personal touches.\n"
            "2. Detail & Humanization:\n"
            "   - Do not write brief, generic skeleton templates. Generate rich, detailed, fully realized emails containing realistic narrative flow, relevant sub-points, clear context, and natural spacing. The email must look like a human took the time to write a thoughtful message.\n"
            "   - Use realistic placeholders in square brackets like [Name], [Date], [Project Name], but build a rich context around them.\n"
            "3. Format:\n"
            "   - Return your response strictly in the following format (do not wrap in markdown code blocks or use JSON or any preamble text):\n"
            "SUBJECT: <Subject Line>\n"
            "BODY:\n"
            "<Email Body>"
        )

        # High-quality detailed few-shot examples for Official and Unofficial contexts
        few_shot_examples = [
            {
                "role": "user",
                "content": "Topic: Requesting budget approval for a new customer service platform"
            },
            {
                "role": "assistant",
                "content": (
                    "SUBJECT: Proposal & Budget Request: Upgrading to CustomerService Pro Platform\n"
                    "BODY:\n"
                    "Hi [Manager Name],\n\n"
                    "Over the past few months, our support team has been experiencing a significant increase in ticket volume, leading to longer response times during peak hours. Currently, we are using multiple disconnected tools to manage customer chats, emails, and feedback. This makes it difficult to maintain a unified history of customer interactions, causing team members to occasionally miss important context.\n\n"
                    "To address this, I have researched several solutions and believe migrating to CustomerService Pro is our best option. This platform would consolidate our channels into a single inbox, automate routine ticket routing, and provide built-in analytics so we can track response times accurately. In our pilot test, the platform saved agents an average of 45 minutes per day on administrative tasks.\n\n"
                    "I have attached a brief proposal detailing the implementation timeline and costs. The annual license fee is $[Amount], which is a $[Percentage]% increase over our current tool spend, but we expect to offset this through increased agent efficiency and improved customer retention within the first quarter.\n\n"
                    "Could we schedule 15 minutes next Tuesday afternoon to discuss this request? I would love to walk you through the details and answer any questions you might have.\n\n"
                    "Best regards,\n\n"
                    "[Your Name]\n"
                    "[Your Title]"
                )
            },
            {
                "role": "user",
                "content": "Topic: Inviting team members to a casual Friday night dinner to celebrate project completion"
            },
            {
                "role": "assistant",
                "content": (
                    "SUBJECT: Friday night drinks + dinner! (We finally finished the migration!) 🎉\n"
                    "BODY:\n"
                    "Hey team,\n\n"
                    "Now that the database migration is officially behind us and the system is running smoothly, it's time to celebrate! We all put in some crazy hours over the last couple of weeks, and I'm super grateful for everyone's hard work and late nights.\n\n"
                    "I'm putting together a casual dinner and drinks get-together this Friday night (around [Time]) at [Restaurant/Bar Name] downtown. It's a great spot with a solid menu and a nice outdoor patio if the weather holds up.\n\n"
                    "No pressure if you already have weekend plans, but I'd love to see as many of you there as possible. Let me know by Thursday afternoon if you can make it so I can get a head count and reserve a table large enough for the group.\n\n"
                    "Catch you all later,\n\n"
                    "[Your Name]"
                )
            }
        ]

        from typing import Any, cast
        messages = cast(Any, [
            {"role": "system", "content": system_prompt},
            *few_shot_examples,
            {"role": "user", "content": f"Topic: {request.topic}"}
        ])

        async def stream_generator():
            try:
                response = await client.chat.completions.create(
                    model=DEFAULT_MODEL,
                    messages=messages,
                    temperature=0.75,
                    max_tokens=1000,
                    stream=True
                )
                async for chunk in response:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield content
            except Exception as e:
                print(f"Streaming error: {e}")
                yield f"\nERROR: {str(e)}"

        return StreamingResponse(stream_generator(), media_type="text/plain")

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5005)