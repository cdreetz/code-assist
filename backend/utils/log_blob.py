from typing import List, Dict, Any
import json
import os
from datetime import datetime

class ChatLogger:
    def __init__(self, storage_dir: str = "../chat_logs"):
        """Initialize the chat logger with a storage directory."""
        self.storage_dir = storage_dir
        if not os.path.exists(storage_dir):
            os.makedirs(storage_dir)

    def _get_user_file_path(self, user_id: str) -> str:
        """Get the file path for a user's chat log."""
        return os.path.join(self.storage_dir, f"{user_id}.json")

    def load_user_chats(self, user_id: str) -> Dict[str, Any]:
        """Load existing chat logs for a user."""
        file_path = self._get_user_file_path(user_id)
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                return json.load(f)
        return {
            "userid": user_id,
            "chats": []
        }

    def save_chat(self, user_id: str, chat_messages: List[Dict[str, str]]) -> None:
        """Save a new chat conversation for a user."""
        chat_data = self.load_user_chats(user_id)
        
        # Create a new chat entry with messages mapped by index
        new_chat = {
            str(i): {
                "role": msg["role"],
                "content": msg["content"]
            } for i, msg in enumerate(chat_messages)
        }
        
        chat_data["chats"].append(new_chat)
        
        # Save updated chat data
        file_path = self._get_user_file_path(user_id)
        with open(file_path, 'w') as f:
            json.dump(chat_data, f, indent=2)

    def get_user_chats(self, user_id: str) -> List[Dict[str, Any]]:
        """Retrieve all chats for a user."""
        chat_data = self.load_user_chats(user_id)
        return chat_data["chats"]

    def delete_user_chats(self, user_id: str) -> bool:
        """Delete all chat logs for a user."""
        file_path = self._get_user_file_path(user_id)
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False

    def update_chat_feedback(self, user_id: str, chat_index: int, message_index: int, feedback: str) -> bool:
        """Update feedback for a specific message in a chat."""
        chat_data = self.load_user_chats(user_id)
        
        if chat_index < len(chat_data["chats"]):
            # Update feedback for the specific message
            message_key = str(message_index)
            if message_key in chat_data["chats"][chat_index]:
                chat_data["chats"][chat_index][message_key]["feedback"] = feedback
                
                file_path = self._get_user_file_path(user_id)
                with open(file_path, 'w') as f:
                    json.dump(chat_data, f, indent=2)
                return True
        return False
