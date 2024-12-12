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
import { ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Copy, ChevronDown, ChevronUp } from "lucide-react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";
import "prismjs/themes/prism.css";
//import CodeEditor from "../components/CodeEditor";
import { useState as useStateLocal } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";


interface Message {
  role: "assistant" | "user" | "system";
  content: string;
  feedback?: "positive" | "negative";
}

const examplePrompts: string[] = [
  "Write some code for me",
  "How to optimize React performance?",
  "Can you explain this code to me?",
  "Convert this code from one language to another",
];

function Chat({ messages, setMessages }: { messages: Message[], setMessages: React.Dispatch<React.SetStateAction<Message[]>> }) {
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
        
        // Open a connection to the streaming endpoint
        const response = await fetch('/api/chat-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            model: 'gpt-4o',
            temperature: 0.7,
            max_tokens: 1000
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        let assistantMessage: Message = {
          role: "assistant",
          content: ""
        };

        // Read the stream
        while (true) {
          const { done, value } = await reader?.read() || {};
          if (done) break;
          
          // Decode the chunk and append it directly
          const chunk = decoder.decode(value, { stream: true });
          assistantMessage.content += chunk;

          // Update the assistant message in the chat
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            if (lastMessage.role === "assistant") {
              lastMessage.content = assistantMessage.content;
            } else {
              updatedMessages.push(assistantMessage);
            }
            return updatedMessages;
          });
        }

        setInputValue("");
      } catch (error) {
        console.error("Error sending message:", error);
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
      const response = await fetch('/api/feedback', {
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

  const SystemMessage = ({ content }: { content: string }) => {
    const [isExpanded, setIsExpanded] = useStateLocal(false);
    
    // Extract the code from the content (assumes format: "Code saved:\n```python\n{code}\n```")
    const code = content.split("```")[1]?.split("\n").slice(1, -1).join("\n") || "";
    
    return (
      <div className="ml-auto w-fit">
        <Button
          variant="ghost"
          size="sm"
          className={`text-xs text-gray-500 hover:text-gray-700 ${isExpanded ? 'mb-2' : ''}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <span>Code Saved</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </Button>
        {isExpanded && (
          <div className="max-w-[300px] h-[200px]">
            <ScrollArea className="h-full w-full bg-gray-50 border border-gray-200 rounded p-2">
              <div className="pr-4">
                <pre className="text-xs">
                  <code>{code}</code>
                </pre>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex-grow flex flex-col rounded mb-2">
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
          <ScrollArea className="flex-grow mb-2 rounded h-full">
            <div className="p-2">
              {messages.map((message, index) => (
                <div key={index} className="mb-4">
                  {message.role === "system" ? (
                    <SystemMessage content={message.content} />
                  ) : (
                    <>
                      <div className={`p-2 rounded w-3/4 ${
                        message.role === "assistant"
                          ? "bg-blue-100 border border-blue-200 self-start"
                          : "bg-gray-100 border border-gray-200 self-end ml-auto text-right"
                      }`}>
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
                    </>
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

function MyCodeEditor({ setMessages }: { setMessages: React.Dispatch<React.SetStateAction<Message[]>> }) {
  const [code, setCode] = useState("# Enter your Python code here");
  const [savedVersions, setSavedVersions] = useState([code]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [language, setLanguage] = useState("python");
  
  const sendCodeToAI = () => {
    // Implement the logic to send code to AI
    console.log("Sending code to AI:", code);
  };

  const saveCode = () => {
    console.log("Saving code:", code);
    setSavedVersions([...savedVersions, code]);
    setCurrentVersionIndex(savedVersions.length);
    
    // Create a system message for the chat
    const systemMessage: Message = {
      role: "system",
      content: "Code saved:\n```" + language + "\n" + code + "\n```"
    };
    
    // Update messages in Chat component
    setMessages(prev => [...prev, systemMessage]);
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
      <CardHeader className="flex-shrink-0">
        <CardTitle>Your Code</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-hidden">
        <ScrollArea className="flex-grow border rounded mb-2 h-full">
          <Editor
            value={code}
            onValueChange={setCode}
            highlight={(code) => highlight(code, languages[language], language)}
            padding={10}
            style={{
              fontFamily: '"Fira code", "Fira Mono", monospace',
              fontSize: 14,
              height: "100%",
            }}
          />
        </ScrollArea>
        <div className="flex items-center justify-between space-x-2">
          <Button onClick={saveCode} variant="outline">
            Save and Insert Code
          </Button>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-8 text-sm border rounded px-2"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="sql">SQL</option>
            <option value="clike">C-like</option>
          </select>
        </div>
      </CardContent>
    </Card>
  );
}

// Add this new component for the resize handle
const ResizeHandle = () => {
  return (
    <PanelResizeHandle className="w-2 hover:bg-gray-200 transition-colors duration-150 mx-2">
      <div className="h-1/4 w-1 bg-gray-300 mx-auto my-auto translate-y-[150%]" />
    </PanelResizeHandle>
  );
};

const Stream: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  return (
    <div className="flex justify-center p-4 h-[calc(100vh-4rem)] w-full">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={50} minSize={30}>
          <Chat messages={messages} setMessages={setMessages} />
        </Panel>
        <ResizeHandle />
        <Panel defaultSize={50} minSize={20}>
          <MyCodeEditor setMessages={setMessages} />
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default Stream;