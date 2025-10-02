"use client";
import React, { useState, useEffect, useRef } from "react";

type Message = { id: number; sender: string; message: string };

interface ChatBoxProps {
  messages: Message[];
  onSend: (msg: string) => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSend }) => {
  const [chatVisible, setChatVisible] = useState(false);


const [pos, setPos] = useState({ x: 20, y: 200 });


  const [size, setSize] = useState({ width: 360, height: 300 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  const handleMouseDownDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDragging(true);
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };
useEffect(() => {
  setPos({ x: 20, y: window.innerHeight - 300 });
}, []);

  const handleMouseMove = (e: MouseEvent) => {
    if (dragging) {
      setPos({
        x: Math.max(0, e.clientX - offset.current.x),
        y: Math.max(0, e.clientY - offset.current.y),
      });
    }
    if (resizing) {
      setSize({
        width: Math.max(280, e.clientX - pos.x),
        height: Math.max(200, e.clientY - pos.y),
      });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
    setResizing(false);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, resizing, pos]);

  // Collapsed static circle (bottom-left)
  if (!chatVisible) {
    return (
      <div className="fixed bottom-4 right-50 z-50">
        <button
          className="w-12 h-12 rounded-full bg-cyan-500 text-slate-900 flex items-center justify-center shadow-lg hover:bg-cyan-600 transition"
          onClick={() => setChatVisible(true)}
          title="Open Chat"
        >
          💬
        </button>
      </div>
    );
  }

  // Full chat box
  return (
    <div
      className="fixed bg-slate-900 border border-slate-800 rounded-xl shadow-lg text-sm z-50 flex flex-col"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.width,
        height: size.height,
      }}
>
      <div
        className="flex justify-between items-center px-4 py-2 cursor-move bg-slate-800 rounded-t-xl"
        onMouseDown={handleMouseDownDrag}
      >
        <h3 className="text-cyan-300 font-semibold">💬 Chat</h3>
        <span
          className="text-gray-400 text-2xl cursor-pointer select-none"
          onClick={() => setChatVisible(false)}
        >
          −
        </span>
      </div>

  
      <div className="flex-1 flex flex-col p-2 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-3 rounded-lg bg-slate-800 space-y-2 custom-scrollbar">
          {messages.length ? (
            messages.map((m) => (
              <div
                key={m.id}
                className={`p-2 rounded-lg text-sm max-w-[80%] break-words ${
                  m.sender === "You"
                    ? "bg-cyan-500/20 text-cyan-100 ml-auto"
                    : "bg-purple-500/20 text-purple-100"
                }`}
              >
                <b>{m.sender}:</b> {m.message}
              </div>
            ))
          ) : (
            <div className="text-gray-400 italic text-center py-4">
              No messages yet.
            </div>
          )}
        </div>

       
        <div className="mt-2">
          <ChatInput onSend={onSend} />
        </div>
      </div>

      
      <div
        className="absolute bottom-1 right-1 w-4 h-4 bg-slate-600 cursor-se-resize rounded-sm"
        onMouseDown={() => setResizing(true)}
      />
    </div>
  );
};

const ChatInput: React.FC<{ onSend: (msg: string) => void }> = ({ onSend }) => {
  const [val, setVal] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val.trim()) {
      onSend(val);
      setVal("");
    }
  };
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="flex-1 px-3 py-2 bg-slate-800 text-gray-200 rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        placeholder="Type your message..."
      />
      <button
        type="submit"
        className="px-4 py-2 bg-cyan-400 text-slate-900 font-semibold rounded hover:bg-cyan-500 transition"
      >
        Send
      </button>
    </form>
  );
};

export default ChatBox;
