import React, { useState, KeyboardEvent } from "react";
import { ScrollArea } from "../components/ui/scroll-area";
import { Input } from "../components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/themes/prism.css";
//import CodeEditor from "../components/CodeEditor";

interface Message {
  role: "assistant" | "user";
  content: string;
  feedback?: "positive" | "negative";
}

const examplePrompts: string[] = [
  "Write some code for me",
  "How to optimize React performance?",
  "Can you explain this code to me?",
  "Convert this code from one language to another",
];

function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleKeyPress = async (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && inputValue.trim() !== "") {
      try {
        setIsLoading(true);
        const userMessage: Message = {
          role: "user",
          content: inputValue.trim(),
        };
        
        // Add user message to chat
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        
        // Send message to backend
        const response = await fetch('http://localhost:8000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              ...messages,
              { role: 'user', content: inputValue.trim() }
            ],
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            max_tokens: 1000
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();
        
        const assistantMessage: Message = {
          role: "assistant",
          content: data.choices[0].message.content
        };
        
        // Add AI response to chat
        setMessages((prevMessages) => [...prevMessages, assistantMessage]);
        
        setInputValue("");
      } catch (error) {
        console.error("Error sending message:", error);
        // Optionally add error handling UI here
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePromptClick = (prompt: string) => {
    const userMessage: Message = {
      role: "user",
      content: prompt,
    };

    let assistantMessage: Message;
    switch (prompt) {
      case "Write some code for me":
        assistantMessage = {
          role: "assistant",
          content:
            "Certainly! I'd be happy to help you write some code. Could you tell me more about what you'd like to create? What programming language are you using, and what should the code do?",
        };
        break;
      case "How to optimize React performance?":
        assistantMessage = {
          role: "assistant",
          content:
            "Great question! I'd be glad to discuss React performance optimization. To get started, could you tell me about any specific performance issues you're experiencing, or are you looking for general optimization tips?",
        };
        break;
      case "Can you explain this code to me?":
        assistantMessage = {
          role: "assistant",
          content:
            "Of course! I'd be happy to explain code for you. You can either paste the code you want explained in the chat here, or write it in the code editor on the right. Once you've done that, I'll do my best to break it down and explain how it works.",
        };
        break;
      case "Convert this code from one language to another":
        assistantMessage = {
          role: "assistant",
          content:
            "Certainly! I can help you convert code between programming languages. To get started, could you tell me what language the original code is in, and what language you'd like to convert it to? Then, you can either paste the code here or write it in the code editor on the right.",
        };
        break;
      default:
        assistantMessage = {
          role: "assistant",
          content: "Hello! How can I assist you with your request?",
        };
    }

    setMessages([userMessage, assistantMessage]);
  };

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    // Optionally add a toast notification here
  };

  const handleFeedback = async (messageIndex: number, feedback: "positive" | "negative") => {
    try {
      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        feedback
      };
      setMessages(updatedMessages);

      // Send feedback to backend
      const response = await fetch('http://localhost:8000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message_index: messageIndex,
          feedback,
          messages: updatedMessages
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send feedback');
      }
    } catch (error) {
      console.error("Error sending feedback:", error);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex-grow flex flex-col border rounded mb-2">
            <div className="flex justify-center items-center py-10">
              <h1 className="text-xl">What would you like help with?</h1>
            </div>
            <div className="grid grid-cols-2 gap-4 m-4">
              {examplePrompts.map((prompt, index) => (
                <Button
                  key={index}
                  onClick={() => handlePromptClick(prompt)}
                  variant="outline"
                  className="h-24 text-center p-2 overflow-hidden whitespace-normal break-words"
                >
                  <div className="line-clamp-3">{prompt}</div>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-grow mb-2 border rounded h-full">
            <div className="p-2">
              {messages.map((message, index) => (
                <div key={index} className="mb-4">
                  <div
                    className={`p-2 rounded w-3/4 ${
                      message.role === "assistant"
                        ? "bg-blue-100 border border-blue-200 self-start"
                        : "bg-gray-100 border border-gray-200 self-end ml-auto text-right"
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.role === "assistant" && (
                    <div className="flex gap-2 mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleFeedback(index, "positive")}
                      >
                        <ThumbsUp className={`h-4 w-4 ${message.feedback === "positive" ? "text-green-500" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleFeedback(index, "negative")}
                      >
                        <ThumbsDown className={`h-4 w-4 ${message.feedback === "negative" ? "text-red-500" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleCopy(message.content)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        <div className="flex flex-row gap-2 w-full">
          <Input
            className="flex-shrink-0 mt-auto p-2 border border-gray-300 rounded w-4/5"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button
            // onClick={() => handleClearClick()}
            variant="destructive"
            className="flex-grow mt-auto"
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CodeEditor() {
  const [code, setCode] = useState("# Enter your Python code here");
  const [savedVersions, setSavedVersions] = useState([code]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);

  const sendCodeToAI = () => {
    // Implement the logic to send code to AI
    console.log("Sending code to AI:", code);
  };

  const saveCode = () => {
    console.log("Saving code:", code);
    setSavedVersions([...savedVersions, code]);
    setCurrentVersionIndex(savedVersions.length);
  }

  const navigateVersion = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev'
      ? Math.max(0, currentVersionIndex - 1)
      : Math.min(savedVersions.length - 1, currentVersionIndex + 1);
    setCurrentVersionIndex(newIndex);
    setCode(savedVersions[newIndex]);
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row flex-shrink-0 items-center justify-between">
        <CardTitle>Your Code</CardTitle>
        <p className="text-sm text-muted-foreground">
          {currentVersionIndex === savedVersions.length - 1
            ? "Current Working Code"
            : "Old Version"
          }
        </p>
        <div className="flex items-center space-x-2">
          <Button
            className="h-2"
            variant="ghost"
            size="icon"
            onClick={() => navigateVersion('prev')}
            disabled={currentVersionIndex === 0}
          >
            <ChevronLeft className="w-4 h-4"/>
          </Button>
          <span>{`${currentVersionIndex + 1} of ${savedVersions.length}`}</span>
          <Button
            className="h-2"
            variant="ghost"
            size="icon"
            onClick={() => navigateVersion('next')}
            disabled={currentVersionIndex === savedVersions.length - 1}
          >
            <ChevronRight className="w-4 h-4"/>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <div className="flex-grow border rounded overflow-hidden mb-2 h-full">
          <Editor
            value={code}
            onValueChange={setCode}
            highlight={(code) => highlight(code, languages.python, "python")}
            padding={10}
            style={{
              fontFamily: '"Fira code", "Fira Mono", monospace',
              fontSize: 14,
              height: "100%",
            }}
          />
        </div>
        <div className="flex space-x-2">
          <Button onClick={saveCode} variant="outline">
            Save Code
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

const Home2: React.FC = () => {
  return (
    <div className="flex justify-center p-4 h-[calc(100vh-4rem)] w-full">
      <div className="w-1/2 h-full pr-2">
        <Chat />
      </div>
      <div className="w-1/2 h-full pl-2">
        <CodeEditor />
      </div>
    </div>
  );
};

export default Home2;