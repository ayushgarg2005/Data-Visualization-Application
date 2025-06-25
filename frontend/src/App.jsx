// import React, { useState, useEffect } from "react";
// import UploadForm from "./components/UploadForm";
// import ChartRenderer from "./components/ChartRenderer";
// import axios from "axios";

// function App() {
//   const [messages, setMessages] = useState([]);
//   const [filename, setFilename] = useState("");
//   const [typedMessage, setTypedMessage] = useState("");
//   const [isSending, setIsSending] = useState(false);

//   const handleProcessed = async (data, uploadedFilename) => {
//     setFilename(uploadedFilename);

//     const userMessage = {
//       role: "user",
//       type: "upload",
//       content: `📎 Uploaded file: ${uploadedFilename}`,
//       data,
//     };
//     setMessages((prev) => [...prev.slice(0, -1), userMessage]);

//     try {
//       const response = await axios.post("http://127.0.0.1:5000/suggest-chart", {
//         sample: data.sample,
//         columns: data.columns,
//         correlation_matrix: data.correlation_matrix,
//         filename: uploadedFilename,
//       });

//       const charts = response.data.charts || [];
//       const full_data = response.data.full_data || [];

//       const botMessage = {
//         role: "bot",
//         charts,
//         full_data,
//       };

//       setMessages((prev) => [...prev, botMessage, { role: "user", type: "form" }]);
//     } catch (error) {
//       console.error("Error getting chart suggestions:", error);
//     }
//   };

//   const handleSendMessage = async () => {
//     if (!typedMessage.trim()) return;

//     const question = typedMessage.trim();
//     setTypedMessage("");
//     setIsSending(true);

//     const userMessage = {
//       role: "user",
//       type: "text",
//       content: question,
//     };
//     setMessages((prev) => [...prev.slice(0, -1), userMessage]);

//     const lastUpload = [...messages].reverse().find((msg) => msg.type === "upload" && msg.data);


//     const payload = {
//       question,
//       summary: lastUpload?.data?.summary,
//       columns: lastUpload?.data?.columns,
//       correlation_matrix: lastUpload?.data?.correlation_matrix,
//       full_data: lastUpload?.data?.sample,
//     };

//     try {
//       const response = await axios.post("http://127.0.0.1:5000/ask-question", payload);

//       const botReply = {
//         role: "bot",
//         content: response.data.response,
//       };

//       setMessages((prev) => [...prev, botReply, { role: "user", type: "form" }]);
//     } catch (error) {
//       console.error("Error getting bot response:", error);

//       const fallbackMessage = {
//         role: "bot",
//         content: "⚠️ Sorry, I couldn’t process your question right now.",
//       };
//       setMessages((prev) => [...prev, fallbackMessage, { role: "user", type: "form" }]);
//     } finally {
//       setIsSending(false);
//     }
//   };

//   useEffect(() => {
//     if (messages.length === 0) {
//       setMessages([{ role: "user", type: "form" }]);
//     }
//   }, [messages]);

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-6 px-4 sm:px-6">
//       <div className="max-w-5xl mx-auto space-y-8">
//         {/* Header */}
//         <header className="text-center">
//           <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-700 mb-2">📊 Data Visualizer Bot</h1>
//           <p className="text-gray-600 text-base sm:text-lg">Upload a CSV file and explore your data with AI!</p>
//         </header>

//         {/* Chat Window */}
//         <section className="space-y-5 pb-32">
//           {messages.map((msg, idx) => (
//             <div key={idx} className="flex w-full">
//               {msg.role === "user" ? (
//                 <div className="flex justify-end w-full">
//                   <div className="bg-blue-100 text-right rounded-2xl rounded-br-none shadow px-4 py-3 max-w-md w-full">
//                     <div className="text-xs text-gray-500 mb-1">You</div>
//                     {msg.type === "form" ? (
//                       <UploadForm onProcessed={handleProcessed} />
//                     ) : (
//                       <p className="text-gray-800">{msg.content}</p>
//                     )}
//                   </div>
//                 </div>
//               ) : (
//                 <div className="flex justify-start w-full">
//                   <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none shadow px-4 py-3 max-w-2xl w-full">
//                     <div className="text-xs text-gray-500 mb-1">Bot</div>
//                     {msg.charts ? (
//                       <>
//                         <h2 className="text-lg font-semibold text-blue-600 mb-3">🔮 Chart Suggestions</h2>
//                         {msg.charts.length > 0 ? (
//                           msg.charts.map((chart, i) => (
//                             <div key={i} className="mb-10">
//                               <h3 className="text-md font-semibold mb-2">{chart.title || `${chart.type} chart`}</h3>
//                               {chart.explanation && (
//                                 <p className="text-sm italic text-gray-500 mb-2">💬 {chart.explanation}</p>
//                               )}
//                               <div className="flex justify-center w-full overflow-x-auto">
//                                 <div className="min-h-[320px] w-fit">
//                                   <ChartRenderer
//                                     chart={chart}
//                                     data={
//                                       msg.full_data?.length > 0
//                                         ? msg.full_data
//                                         : msg.data?.sample
//                                     }
//                                   />
//                                 </div>
//                               </div>
//                               <hr className="my-6 border-gray-300" />
//                             </div>
//                           ))
//                         ) : (
//                           <p className="text-gray-700">No chart suggestions found.</p>
//                         )}
//                       </>
//                     ) : (
//                       <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 text-gray-800 whitespace-pre-wrap">
//                         {msg.content}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))}
//         </section>

//         {/* Footer Input */}
//         <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
//           <div className="max-w-5xl mx-auto flex items-center gap-3">
//             <input
//               type="text"
//               value={typedMessage}
//               onChange={(e) => setTypedMessage(e.target.value)}
//               onKeyDown={(e) => {
//                 if (e.key === "Enter") handleSendMessage();
//               }}
//               className="flex-1 border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
//               placeholder="Ask a question about the data..."
//             />
//             <button
//               onClick={handleSendMessage}
//               disabled={isSending}
//               className={`px-5 py-2.5 rounded-lg text-white font-medium transition-all duration-200 ${
//                 isSending ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
//               }`}
//             >
//               {isSending ? "..." : "Send"}
//             </button>
//           </div>
//         </footer>
//       </div>
//     </div>
//   );
// }

// export default App;














import React, { useState, useEffect, useRef } from "react";
import UploadForm from "./components/UploadForm";
import ChartRenderer from "./components/ChartRenderer";
import axios from "axios";

function App() {
  const [messages, setMessages] = useState([]);
  const [filename, setFilename] = useState("");
  const [typedMessage, setTypedMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: "user", type: "form" }]);
    }
  }, []);

  const handleProcessed = async (data, uploadedFilename) => {
    setFilename(uploadedFilename);

    const userMessage = {
      role: "user",
      type: "upload",
      content: `📎 Uploaded file: ${uploadedFilename}`,
      data,
    };
    setMessages((prev) => [...prev.slice(0, -1), userMessage]);

    try {
      const response = await axios.post("http://127.0.0.1:5000/suggest-chart", {
        sample: data.sample,
        columns: data.columns,
        correlation_matrix: data.correlation_matrix,
        filename: uploadedFilename,
      });

      const charts = response.data.charts || [];
      const full_data = response.data.full_data || [];

      const botMessage = {
        role: "bot",
        charts,
        full_data,
      };

      // Add chart response first, then form input
      setMessages((prev) => [...prev, botMessage, { role: "user", type: "form" }]);
    } catch (error) {
      console.error("Chart suggestion error:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!typedMessage.trim()) return;

    const question = typedMessage.trim();
    setTypedMessage("");
    setIsSending(true);

    const userMessage = { role: "user", type: "text", content: question };
    setMessages((prev) => [...prev.slice(0, -1), userMessage]);

    const lastUpload = [...messages].reverse().find((msg) => msg.type === "upload" && msg.data);
    const payload = {
      question,
      summary: lastUpload?.data?.summary,
      columns: lastUpload?.data?.columns,
      correlation_matrix: lastUpload?.data?.correlation_matrix,
      full_data: lastUpload?.data?.sample,
    };

    setMessages((prev) => [...prev, { role: "bot", loading: true }]);

    try {
      const response = await axios.post("http://127.0.0.1:5000/ask-question", payload);
      const botReply = { role: "bot", content: response.data.response };
      setMessages((prev) => [...prev.slice(0, -1), botReply, { role: "user", type: "form" }]);
    } catch (error) {
      const fallback = {
        role: "bot",
        content: "⚠️ Sorry, I couldn’t process your question right now.",
      };
      setMessages((prev) => [...prev.slice(0, -1), fallback, { role: "user", type: "form" }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-100 to-white font-sans">
      <header className="py-5 border-b border-gray-200 shadow-sm bg-white">
        <h1 className="text-center text-3xl font-bold text-blue-700">📊 Data Visualizer Chat</h1>
        <p className="text-center text-sm text-gray-500">
          Upload CSV files, ask data questions, get AI insights.
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`rounded-2xl px-4 py-3 max-w-lg transition-all duration-300 ease-in-out shadow-md ${msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-white/60 backdrop-blur-lg border border-gray-200 text-gray-800 rounded-bl-none"
                }`}
            >
              <div className="text-xs text-gray-400 mb-1">
                {msg.role === "user" ? "You" : "Bot"}
              </div>

              {msg.loading ? (
                <p className="animate-pulse text-sm italic">Typing...</p>
              ) : msg.type === "form" ? (
                <UploadForm onProcessed={handleProcessed} />
              ) : msg.charts ? (
                <>
                  <h2 className="text-base font-semibold text-blue-700 mb-3">
                    🔮 Chart Suggestions
                  </h2>
                  {msg.charts.map((chart, i) => (
                    <div key={i} className="mb-6">
                      <h3 className="font-medium">{chart.title || `${chart.type} chart`}</h3>
                      {chart.explanation && (
                        <p className="text-xs italic text-gray-500 mb-2">💬 {chart.explanation}</p>
                      )}
                      <ChartRenderer
                        chart={chart}
                        data={msg.full_data?.length > 0 ? msg.full_data : msg.data?.sample}
                      />
                    </div>
                  ))}

                </>
              ) : (
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </main>

      <footer className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <input
            type="text"
            value={typedMessage}
            onChange={(e) => setTypedMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask a question about the data..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={isSending}
            className={`px-4 py-2.5 rounded-full text-white text-sm font-semibold transition ${isSending ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;

