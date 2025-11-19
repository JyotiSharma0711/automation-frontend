import React, { useRef, useEffect, useState } from "react";
import { IoIosArrowDropdownCircle } from "react-icons/io";

interface FilterFlowMenuProps {
  flowTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
  selectedTags: string[];
}

export default function FilterFlowsMenu({
  flowTags,
  setSelectedTags,
  selectedTags,
}: FilterFlowMenuProps) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [maxHeight, setMaxHeight] = useState<string>("0px");

  useEffect(() => {
    if (contentRef.current) {
      setMaxHeight(open ? `${contentRef.current.scrollHeight}px` : "0px");
    }
  }, [open]);

  const toggleSelect = (item: string) => {
    setSelectedTags((prev: any) =>
      prev.includes(item) ? prev.filter((v: any) => v !== item) : [...prev, item]
    );
  };

  return (
    <div className="bg-gray-50 rounded-lg border border-sky-200 p-4 w-full mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left text-base font-semibold text-sky-700 mb-3"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-sky-700 rounded-full"></div>
          Filter Flows
        </div>
        <span className="sr-only">Toggle filter flows</span>
        <div
          className={`transform transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`}
        >
          <IoIosArrowDropdownCircle
            className={`h-7 w-7 text-sky-700 transform transition-transform duration-300 ${
              open ? "rotate-180" : "rotate-0"
            }`}
          />
        </div>
      </button>

      <div
        ref={contentRef}
        style={{ maxHeight }}
        className="overflow-hidden transition-all duration-300"
      >
        <div className="flex flex-row gap-2 pl-4 py-1">
          {flowTags.map((item: string) => (
            <div
              key={item}
              onClick={() => toggleSelect(item)}
              className={`cursor-pointer px-3 py-2 rounded-lg border transition-all duration-200 select-none
                ${
                  selectedTags.includes(item)
                    ? "bg-sky-600 border-sky-600 text-white"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
