import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism.css';

const CodeEditor: React.FC = () => {
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
    <Card className='flex flex-col h-full'>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Code</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateVersion('prev')}
            //disabled={currentVersionIndex === 0}
          >
            <ChevronLeft className="w-4 h-4"/>
          </Button>
          <span>{`${currentVersionIndex + 1} of ${savedVersions.length}`}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateVersion('next')}
            //disabled={currentVersionIndex === savedVersions.length - 1}
          >
            <ChevronRight className="w-4 h-4"/>
          </Button>
        </div>
      </CardHeader>
      <CardContent className='flex-grow flex flex-col'>
        <div className="flex-grow border rounded overflow-hidden mb-4">
          <Editor
            value={code}
            onValueChange={setCode}
            highlight={code => Prism.highlight(code, Prism.languages.python, 'python')}
            padding={10}
            style={{
              fontFamily: '"Fira code", "Fira Mono", monospace',
              fontSize: 14,
              height: '100%',
            }}
          />
        </div>
        <div className="flex space-x-2">
          <Button onClick={saveCode} variant="outline">Save Code</Button>
          <Button onClick={sendCodeToAI} variant="outline">Send Code to AI</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CodeEditor;
