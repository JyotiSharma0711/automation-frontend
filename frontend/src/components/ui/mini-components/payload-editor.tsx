import { useState } from "react";
import ReactDOM from "react-dom";
import Editor from "@monaco-editor/react";

const PayloadEditor = ({ onAdd }: any) => {
  const [payload, setPayload] = useState("");
  const [errorText, setErrorText] = useState("");

  const handleAddClick = () => {
    let parsedText = null;
    try {
      parsedText = JSON.parse(payload);
    } catch (e) {
      setErrorText("Invalid json format");
    }

    onAdd(parsedText);
  };

  return (
    ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#f7f7f7] bg-white rounded-2xl shadow-lg p-6 w-full max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <label className="text-lg font-semibold">Paste payload</label>
          {errorText && (
            <p className="text-red-500 text-sm italic mt-1 w-full">
              {errorText}
            </p>
          )}
          <button
            onClick={handleAddClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Add
          </button>
        </div>
        <div className="h-96">
          <Editor
            height="100%"
            value={payload}
            onChange={(value: any) => {
              setPayload(value);
            }}
            defaultLanguage="json"
            theme="vs"
            options={{
              minimap: { enabled: false },
            }}
          />
        </div>
      </div>
    </div>,
   	document.body
    )
  );
};

export default PayloadEditor;
