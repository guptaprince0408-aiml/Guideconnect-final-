import React, { useState } from 'react';
import { Code2, FileCode2, Copy, Check, Terminal, Database, Shield, Zap, BookOpen } from 'lucide-react';
import { SPRING_BOOT_REFERENCE_FILES, SpringBootFile } from '../spring-boot-reference/referenceData';

export const SpringBootReferenceViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<SpringBootFile>(SPRING_BOOT_REFERENCE_FILES[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const categories = ['ALL', 'POM & CONFIG', 'DATABASE DDL', 'ENTITIES', 'SERVICES & CONCURRENCY', 'SECURITY', 'JUNIT 5 TESTS', 'README'];

  const filteredFiles = activeCategory === 'ALL'
    ? SPRING_BOOT_REFERENCE_FILES
    : SPRING_BOOT_REFERENCE_FILES.filter(f => f.category === activeCategory);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
          <Code2 className="w-4 h-4" />
          <span>Spring Boot 3 · JPA & Hibernate · MySQL Reference Suite</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          GuideConnect Enterprise Backend Blueprint
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          Comprehensive production Java and Spring Boot code files implementing the 3 core requirements:
          Unique System Guide ID (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">GC-G-100001</code>), Single-Winner Pessimistic Concurrency Lock (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">SELECT ... FOR UPDATE</code>), and Separated Matching, Booking, and Bargaining state machines.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Split Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* Left: File Navigator */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 p-4 bg-slate-50">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
            Architecture Deliverables ({filteredFiles.length})
          </div>
          <div className="space-y-1.5 max-h-[650px] overflow-y-auto">
            {filteredFiles.map(file => (
              <button
                key={file.filename}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left p-3 rounded-lg text-xs transition-colors flex items-start gap-2.5 ${
                  selectedFile.filename === file.filename
                    ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileCode2 className={`w-4 h-4 shrink-0 mt-0.5 ${
                  file.category === 'DATABASE DDL' ? 'text-amber-600' :
                  file.category === 'SERVICES & CONCURRENCY' ? 'text-rose-600' :
                  file.category === 'SECURITY' ? 'text-indigo-600' :
                  'text-emerald-600'
                }`} />
                <div className="flex-1 truncate">
                  <div className="truncate font-mono">{file.filename}</div>
                  <div className="text-[10px] text-slate-400 truncate">{file.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Code Display */}
        <div className="lg:col-span-8 flex flex-col bg-slate-950 text-slate-200 min-h-[650px]">
          {/* File Tab Header */}
          <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-emerald-400">
                {selectedFile.filename}
              </span>
              <span className="text-xs text-slate-400 ml-3">
                {selectedFile.description}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Source'}</span>
            </button>
          </div>

          {/* Code Body */}
          <div className="p-5 overflow-auto flex-1 font-mono text-xs leading-relaxed text-slate-300 selection:bg-emerald-900 selection:text-white">
            <pre className="whitespace-pre">{selectedFile.code}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
