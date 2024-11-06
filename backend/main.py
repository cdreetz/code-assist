import os
import time
from typing import List, Optional
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.exceptions import HTTPException
from starlette.middleware.sessions import SessionMiddleware
from backend.utils.log_blob import ChatLogger
from backend.models.models import Message, ChatRequest, FeedbackRequest
from .middleware import init_auth_middleware
from backend.config import settings

# Initialize FastAPI app and chat logger
app = FastAPI()
chat_logger = ChatLogger()

# # Add session middleware first
# app.add_middleware(
#     SessionMiddleware,
#     secret_key=os.getenv("SESSION_SECRET_KEY"),
#     max_age=24 * 60 * 60  # 24 hours
# )
# 
# # Initialize auth middleware
# init_auth_middleware(app)
# 
# # Add auth routes
# @app.get("/auth/login")
# async def login(request: Request):
#     auth_middleware = request.app.middleware_stack.middlewares[-1]  # Get auth middleware instance
#     auth_url = auth_middleware.get_auth_url()
#     return RedirectResponse(url=auth_url)
# 
# @app.get("/auth/callback")
# async def callback(request: Request, code: str):
#     auth_middleware = request.app.middleware_stack.middlewares[-1]  # Get auth middleware instance
#     result = await auth_middleware.handle_auth_callback(code)
#     
#     if "error" in result:
#         raise HTTPException(status_code=401, detail=result.get("error_description"))
# 
#     # Store user info in session
#     request.session["user"] = result.get("id_token_claims")
#     
#     # Redirect to home page
#     return RedirectResponse(url="/")

# Add CORS middleware and static file mounting with error handling
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Check if directories exist before mounting
if os.path.exists(settings.STATIC_DIR):
    app.mount("/static", StaticFiles(directory=settings.STATIC_DIR), name="static")
if os.path.exists(settings.ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=settings.ASSETS_DIR), name="assets")

@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    file_path = os.path.join(settings.BUILD_DIR, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)

    return FileResponse(os.path.join(settings.BUILD_DIR, "index.html"))

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

@app.post("/api/feedback")
async def save_feedback(request: FeedbackRequest):
    try:
        # For now using the last chat (most recent) for the default user
        chats = chat_logger.get_user_chats("default_user")
        if chats:
            chat_index = len(chats) - 1
            chat_logger.update_chat_feedback(
                "default_user",
                chat_index,
                request.message_index,
                request.feedback
            )
            return {"status": "success"}
        return {"error": "No chats found"}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
