import os
import time
from typing import List, Optional
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from log_blog import ChatLogger

# Initialize FastAPI app and chat logger
app = FastAPI()
chat_logger = ChatLogger()

# Add CORS middleware and static file mounting with error handling
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Check if directories exist before mounting
static_dir = "../frontend/build/static"
assets_dir = "../frontend/build/assets"

if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: Optional[str] = "gpt-3.5-turbo"
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1000

@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    build_dir = "../frontend/build"
    file_path = os.path.join(build_dir, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)

    return FileResponse(os.path.join(build_dir, "index.html"))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/chat")
async def chat(request: ChatRequest):
    # Process the chat request in OpenAI format
    try:
        # Validate request format
        if not request.messages or len(request.messages) == 0:
            return {"error": "No messages provided"}

        # Format response to match OpenAI's chat completion response
        response = {
            "id": "chatcmpl-" + "".join([str(i) for i in range(10)]),
            "object": "chat.completion",
            "created": int(time.time()),
            "model": request.model,
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant", 
                    "content": "This is a placeholder response. To use real OpenAI responses, configure the OpenAI API key."
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": sum(len(msg.content.split()) for msg in request.messages),
                "completion_tokens": 20,
                "total_tokens": sum(len(msg.content.split()) for msg in request.messages) + 20
            }
        }

        # Log the chat messages
        # For now using a placeholder user ID since we don't have user authentication yet
        chat_messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        chat_messages.append({
            "role": "assistant",
            "content": response["choices"][0]["message"]["content"]
        })
        chat_logger.save_chat("default_user", chat_messages)

        return response

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
