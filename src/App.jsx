import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Settings, Plus, Trash2, ArrowUp, ArrowDown, MonitorPlay, Code2, Download, Pause, PlayCircle, Loader2, Maximize, MousePointer2, Lightbulb } from 'lucide-react';

// --- THEMES & CONFIG ---
const THEMES = {
  darcula: {
    bg: '#2b2b2b',
    sidebar: '#3c3f41',
    text: '#a9b7c6',
    keyword: '#cc7832',
    string: '#6a8759',
    function: '#ffc66d',
    number: '#6897bb',
    comment: '#808080',
    decorator: '#bbb529',
    lineNum: '#606366',
    consoleBg: '#232425',
  },
  light: {
    bg: '#ffffff',
    sidebar: '#f2f2f2',
    text: '#080808',
    keyword: '#0033b3',
    string: '#067d17',
    function: '#00627a',
    number: '#1750eb',
    comment: '#8c8c8c',
    decorator: '#9e880d',
    lineNum: '#b3b3b3',
    consoleBg: '#f8f9fa',
  }
};

const DEFAULT_SCENES = [
  {
    id: 's1',
    title: 'Hello World',
    code: 'def greet(name):\n    """A simple greeting function"""\n    print(f"Hello, {name}!")\n    \nprint("Initializing system...")\ngreet("Virtual Studio")\n',
    manualOutput: 'Initializing system...\nHello, Virtual Studio!\n',
    teacherNote: 'The print() function is your friend for debugging. Always use f-strings for clean text formatting!',
    noteColor: '#eab308',
    noteBgColor: '#1e293b',
    noteLogo: null
  },
  {
    id: 's2',
    title: 'Data Processing',
    code: 'import time\n\ndata = [23, 89, 12, 54, 92]\nprint("Processing data stream:")\n\nfor val in sorted(data):\n    print(f" -> Analyzing chunk: {val}")\n    time.sleep(0.1)\n\nprint("Processing complete.")\n',
    manualOutput: 'Processing data stream:\n -> Analyzing chunk: 12\n -> Analyzing chunk: 23\n -> Analyzing chunk: 54\n -> Analyzing chunk: 89\n -> Analyzing chunk: 92\nProcessing complete.\n',
    teacherNote: 'Notice how sorted() creates a new list without modifying the original data.',
    noteColor: '#3b82f6',
    noteBgColor: '#1e293b',
    noteLogo: null
  }
];

// --- PROCEDURAL AUDIO ENGINE ---
// Generates realistic mechanical keyboard sounds using Web Audio API
class AudioEngine {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  resume() {
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  playKeystroke(type = 'letter') {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    // --- 1. The High-frequency "Click" ---
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'sine';
    
    let startFreq = 1500 + Math.random() * 500;
    if (type === 'enter') startFreq = 1000;
    else if (type === 'space') startFreq = 1200;
    
    clickOsc.frequency.setValueAtTime(startFreq, t);
    clickOsc.frequency.exponentialRampToValueAtTime(100, t + 0.02);
    
    clickGain.gain.setValueAtTime(0.15, t); // Reduced volume to prevent harshness
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    
    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    
    clickOsc.start(t);
    clickOsc.stop(t + 0.03);

    // --- 2. The Low-frequency "Thump" ---
    const thumpOsc = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thumpOsc.type = 'triangle';
    
    let thumpFreq = type === 'space' ? 70 : (type === 'enter' ? 90 : 120 + Math.random() * 30);
    thumpOsc.frequency.setValueAtTime(thumpFreq, t);
    thumpOsc.frequency.exponentialRampToValueAtTime(thumpFreq * 0.5, t + 0.05);
    
    let thumpVol = type === 'letter' ? 0.2 : 0.35;
    thumpGain.gain.setValueAtTime(thumpVol, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    
    thumpOsc.connect(thumpGain);
    thumpGain.connect(this.ctx.destination);
    
    thumpOsc.start(t);
    thumpOsc.stop(t + 0.06);

    // --- 3. The "Scratch" / Switch Noise ---
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = type === 'space' ? 1000 : 4000;
    noiseFilter.Q.value = 0.5;
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.05, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    
    noise.start(t);
  }

  playMouseClick() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    
    // Down click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2500, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.015);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.02);
    
    // Up click
    setTimeout(() => {
      if(this.ctx.state !== 'running') return;
      const t2 = this.ctx.currentTime;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(3000, t2);
      gain2.gain.setValueAtTime(0.05, t2);
      gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.015);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(t2);
      osc2.stop(t2 + 0.015);
    }, 80);
  }
}

let audioEngineInstance = null;

let globalPyodide = null;
let pyodideLoadPromise = null;

// --- CUSTOM HOOKS ---
function usePyodide() {
  const [pyodide, setPyodide] = useState(globalPyodide);
  const [isLoading, setIsLoading] = useState(!globalPyodide);

  useEffect(() => {
    if (globalPyodide) {
      setPyodide(globalPyodide);
      setIsLoading(false);
      return;
    }
    const loadPy = async () => {
      try {
        if (!pyodideLoadPromise) {
          pyodideLoadPromise = (async () => {
            if (!window.loadPyodide) {
              const script = document.createElement('script');
              script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
              document.body.appendChild(script);
              await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
              });
            }
            return await window.loadPyodide();
          })();
        }
        const py = await pyodideLoadPromise;
        globalPyodide = py;
        setPyodide(py);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load Pyodide", err);
        setIsLoading(false);
      }
    };
    loadPy();
  }, []);

  const runPython = async (code) => {
    if (!pyodide) return "Pyodide not loaded.";
    try {
      // Redirect stdout
      await pyodide.runPythonAsync(`
import sys
import io
sys.stdout = io.StringIO()
      `);
      await pyodide.runPythonAsync(code);
      const stdout = await pyodide.runPythonAsync("sys.stdout.getvalue()");
      return stdout;
    } catch (err) {
      try {
        const stdout = await pyodide.runPythonAsync("sys.stdout.getvalue()");
        return stdout + "\n" + err.toString();
      } catch(e) {
        return err.toString();
      }
    }
  };

  return { pyodide, isLoading, runPython };
}

// --- SYNTAX HIGHLIGHTER ---
const highlightPython = (code, themeColors) => {
  if (!code) return null;
  
  const keywords = /\b(def|class|import|from|return|if|else|elif|for|while|in|True|False|None|and|or|not|try|except|with|as|pass|break|continue|yield|lambda|global|nonlocal|assert|del)\b/g;
  const strings = /(".*?"|'.*?'|""".*?"""|'''.*?''')/gs;
  const comments = /(#.*)/g;
  const functions = /([a-zA-Z_]\w*)(?=\s*\()/g;
  const numbers = /\b(\d+\.?\d*)\b/g;
  const decorators = /(@[\w\.]+)/g;

  // Extremely basic tokenizer for demonstration. 
  // In a real app, use PrismJS or similar, but we must stay single-file.
  let tokens = [];
  let currentStr = "";
  
  // A hacky way to prevent overlapping regex matches in a simple custom parser:
  // Split by words/symbols, then colorize.
  const regex = /(""".*?"""|'''.*?'''|".*?"|'.*?'|#.*|\b[a-zA-Z_]\w*\b|\d+\.?\d*|@[\w\.]+|[^\w\s])/g;
  const parts = code.split(regex).filter(Boolean);

  return parts.map((part, i) => {
    let color = themeColors.text;
    
    if (part.match(strings)) color = themeColors.string;
    else if (part.match(comments)) color = themeColors.comment;
    else if (part.match(keywords)) color = themeColors.keyword;
    else if (part.match(numbers)) color = themeColors.number;
    else if (part.match(decorators)) color = themeColors.decorator;
    else if (part.match(/^[a-zA-Z_]\w*$/)) {
       // Look ahead to check if it's a function call
       let j = i + 1;
       while (j < parts.length && parts[j].match(/^\s+$/)) j++;
       if (j < parts.length && parts[j].startsWith('(')) {
         color = themeColors.function;
       }
    }

    return <span key={i} style={{ color }}>{part}</span>;
  });
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [mode, setMode] = useState('SETUP'); // SETUP or STAGE
  const [scenes, setScenes] = useState(DEFAULT_SCENES);
  const [settings, setSettings] = useState({
    realExecution: true,
    typingSpeed: 50,
    fontSize: 15,
    orientation: 'landscape', // landscape, portrait
    theme: 'darcula',
    chromaKey: '#00FF00',
    watermark: '' // Added watermark state
  });

  const { pyodide, isLoading: pyodideLoading, runPython } = usePyodide();

  if (mode === 'SETUP') {
    return (
      <SetupMode 
        scenes={scenes} 
        setScenes={setScenes} 
        settings={settings} 
        setSettings={setSettings} 
        startProduction={() => setMode('STAGE')}
        pyodideLoading={pyodideLoading}
      />
    );
  }

  return (
    <StageMode 
      scenes={scenes} 
      settings={settings} 
      runPython={runPython}
      exitToSetup={() => setMode('SETUP')}
    />
  );
}

// --- SETUP MODE COMPONENT ---
function SetupMode({ scenes, setScenes, settings, setSettings, startProduction, pyodideLoading }) {
  
  const handleAddScene = () => {
    setScenes([...scenes, { id: Date.now().toString(), title: 'New Scene', code: '', manualOutput: '' }]);
  };

  const handleUpdateScene = (index, field, value) => {
    const newScenes = [...scenes];
    newScenes[index][field] = value;
    setScenes(newScenes);
  };

  const handleRemoveScene = (index) => {
    setScenes(scenes.filter((_, i) => i !== index));
  };

  const moveScene = (index, dir) => {
    if ((dir === -1 && index === 0) || (dir === 1 && index === scenes.length - 1)) return;
    const newScenes = [...scenes];
    const temp = newScenes[index];
    newScenes[index] = newScenes[index + dir];
    newScenes[index + dir] = temp;
    setScenes(newScenes);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-900/50">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Virtual Studio</h1>
              <p className="text-slate-400 text-sm">Cinematic Code Tutorial Generator</p>
            </div>
          </div>
          
          <button 
            onClick={startProduction}
            disabled={pyodideLoading && settings.realExecution}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-emerald-900/50"
          >
            {pyodideLoading && settings.realExecution ? <Loader2 className="w-5 h-5 animate-spin" /> : <MonitorPlay className="w-5 h-5" />}
            ACTION!
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* SCENE MANAGER */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Play className="w-5 h-5 text-indigo-400" />
                Scene Playlist
              </h2>
              <button onClick={handleAddScene} className="text-sm flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors">
                <Plus className="w-4 h-4" /> Add Scene
              </button>
            </div>

            <div className="space-y-4">
              {scenes.map((scene, idx) => (
                <div key={scene.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 transition-all hover:border-slate-600/50 relative group">
                  
                  <div className="absolute right-4 top-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => moveScene(idx, -1)} className="p-1 hover:bg-slate-700 rounded text-slate-400"><ArrowUp className="w-4 h-4"/></button>
                     <button onClick={() => moveScene(idx, 1)} className="p-1 hover:bg-slate-700 rounded text-slate-400"><ArrowDown className="w-4 h-4"/></button>
                     <button onClick={() => handleRemoveScene(idx)} className="p-1 hover:bg-red-900/50 hover:text-red-400 rounded text-slate-400 mt-2"><Trash2 className="w-4 h-4"/></button>
                  </div>

                  <input 
                    type="text" 
                    value={scene.title} 
                    onChange={(e) => handleUpdateScene(idx, 'title', e.target.value)}
                    className="bg-transparent text-lg font-medium text-white outline-none mb-4 w-3/4 placeholder-slate-600"
                    placeholder="Scene Title"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block uppercase tracking-wider">Python Code</label>
                      <textarea 
                        value={scene.code}
                        onChange={(e) => handleUpdateScene(idx, 'code', e.target.value)}
                        className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg p-3 font-mono text-sm text-slate-300 focus:border-indigo-500 outline-none resize-none"
                        placeholder="print('Hello')"
                      />
                    </div>
                    {!settings.realExecution && (
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block uppercase tracking-wider">Manual Output</label>
                        <textarea 
                          value={scene.manualOutput}
                          onChange={(e) => handleUpdateScene(idx, 'manualOutput', e.target.value)}
                          className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg p-3 font-mono text-sm text-slate-300 focus:border-indigo-500 outline-none resize-none"
                          placeholder="Output..."
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Teacher Note Input */}
                  <div className="mt-4 bg-slate-900/40 p-4 rounded-xl border border-slate-700/50">
                    <label className="text-xs text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500"/> Teacher Note Configuration
                    </label>
                    <textarea 
                      value={scene.teacherNote || ''} 
                      onChange={(e) => handleUpdateScene(idx, 'teacherNote', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 font-sans text-sm text-slate-300 focus:border-yellow-500/50 outline-none placeholder-slate-600 transition-colors resize-none h-20 mb-4"
                      placeholder="Key takeaway to display as a popup at the end of the scene..."
                    />
                    
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between border-t border-slate-700/50 pt-4">
                      <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-slate-400 uppercase tracking-wider">Accent:</label>
                          <input 
                            type="color" 
                            value={scene.noteColor || '#eab308'}
                            onChange={(e) => handleUpdateScene(idx, 'noteColor', e.target.value)}
                            className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-slate-400 uppercase tracking-wider">Background:</label>
                          <input 
                            type="color" 
                            value={scene.noteBgColor || '#1e293b'}
                            onChange={(e) => handleUpdateScene(idx, 'noteBgColor', e.target.value)}
                            className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-slate-800/80 p-2 rounded-lg border border-slate-700 w-full sm:w-auto">
                        <label className="text-xs text-slate-400 uppercase tracking-wider whitespace-nowrap">Custom Logo:</label>
                        {scene.noteLogo ? (
                          <div className="flex items-center gap-3">
                             <img src={scene.noteLogo} alt="Logo" className="w-7 h-7 object-contain rounded bg-white p-0.5" />
                             <button onClick={() => handleUpdateScene(idx, 'noteLogo', null)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 bg-red-400/10 rounded">Remove</button>
                          </div>
                        ) : (
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => handleUpdateScene(idx, 'noteLogo', reader.result);
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-indigo-600/20 file:text-indigo-400 hover:file:bg-indigo-600/30 w-48 cursor-pointer"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* GLOBAL SETTINGS */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              Production Settings
            </h2>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-5">
              
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Execution Engine</label>
                <div className="flex bg-slate-900 rounded-lg p-1">
                  <button 
                    onClick={() => setSettings({...settings, realExecution: true})}
                    className={`flex-1 py-2 text-sm rounded-md transition-colors ${settings.realExecution ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Real (Pyodide)
                  </button>
                  <button 
                    onClick={() => setSettings({...settings, realExecution: false})}
                    className={`flex-1 py-2 text-sm rounded-md transition-colors ${!settings.realExecution ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Manual Text
                  </button>
                </div>
              </div>

              <div>
                <label className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                  <span>Typing Speed (Base)</span>
                  <span className="text-indigo-400">{settings.typingSpeed}ms</span>
                </label>
                <input 
                  type="range" min="10" max="150" 
                  value={settings.typingSpeed}
                  onChange={(e) => setSettings({...settings, typingSpeed: parseInt(e.target.value)})}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <label className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                  <span>Editor Font Size</span>
                  <span className="text-indigo-400">{settings.fontSize}px</span>
                </label>
                <input 
                  type="range" min="12" max="32" 
                  value={settings.fontSize}
                  onChange={(e) => setSettings({...settings, fontSize: parseInt(e.target.value)})}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Visual Theme</label>
                <select 
                  value={settings.theme}
                  onChange={(e) => setSettings({...settings, theme: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-300 outline-none focus:border-indigo-500"
                >
                  <option value="darcula">Darcula (Dark)</option>
                  <option value="light">IntelliJ (Light)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Aspect Ratio</label>
                <select 
                  value={settings.orientation}
                  onChange={(e) => setSettings({...settings, orientation: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-300 outline-none focus:border-indigo-500"
                >
                  <option value="landscape">Landscape 16:9 (YouTube)</option>
                  <option value="portrait">Portrait 9:16 (Shorts/TikTok)</option>
                </select>
              </div>

              {/* Added Watermark Input */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Header Watermark (Optional)</label>
                <input 
                  type="text" 
                  value={settings.watermark || ''}
                  onChange={(e) => setSettings({...settings, watermark: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-300 font-sans text-sm outline-none focus:border-indigo-500 placeholder-slate-600"
                  placeholder="e.g. @MyChannel Tutorials"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Chroma Key Background</label>
                <div className="flex gap-3">
                  <input 
                    type="color" 
                    value={settings.chromaKey}
                    onChange={(e) => setSettings({...settings, chromaKey: e.target.value})}
                    className="w-12 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <input 
                    type="text" 
                    value={settings.chromaKey}
                    onChange={(e) => setSettings({...settings, chromaKey: e.target.value})}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-300 font-mono text-sm outline-none"
                  />
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* BRAND FOOTER */}
        <footer className="mt-16 pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-6 text-sm text-slate-400">
          <a 
            href="https://www.amazon.com/dp/B0GJGG8K3P" 
            target="_blank" 
            rel="noopener noreferrer"
            className="shrink-0 transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] rounded-md"
            title="Get Python Programming for Beginners on Amazon"
          >
            <img 
              src="/Coding-Virtual-Studio/Python-Programming-for-Beginners-cover.jpg" 
              alt="Python Programming for Beginners Book Cover" 
              className="w-16 h-auto rounded-md shadow-lg border border-slate-700/50" 
            />
          </a>
          <div className="text-center sm:text-left space-y-1.5">
            <p className="text-slate-300">
              This application is brought to you by my book,{' '}
              <a 
                href="https://www.amazon.com/dp/B0GJGG8K3P" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                Python Programming for Beginners
              </a>.
            </p>
            <p>
              Developed by{' '}
              <a 
                href="https://ahmad-khatib.com/en/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-slate-200 hover:text-white font-medium transition-colors border-b border-slate-600 hover:border-slate-300 pb-0.5"
              >
                Ahmad Al Khatib
              </a>
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}


// --- STAGE MODE COMPONENT (The State Machine) ---
function StageMode({ scenes, settings, runPython, exitToSetup }) {
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [status, setStatus] = useState('IDLE'); // IDLE, TYPING, CAMERA_IN, EXECUTING, SHOW_NOTE, CAMERA_OUT, FINISHED
  
  const [typedCode, setTypedCode] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');
  const [highlightOutput, setHighlightOutput] = useState(false);
  
  const [isPaused, setIsPaused] = useState(false);
  const [timestamps, setTimestamps] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [viewportScale, setViewportScale] = useState(1);
  const [copySuccess, setCopySuccess] = useState(false);

  // Refs for state that's accessed in async closures to prevent staleness
  const isPausedRef = useRef(isPaused);
  const sceneIdxRef = useRef(currentSceneIdx);
  const statusRef = useRef(status);
  const timestampsRef = useRef(timestamps);
  const isMountedRef = useRef(true);
  const startTimeRef = useRef(null);
  
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { sceneIdxRef.current = currentSceneIdx; }, [currentSceneIdx]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { timestampsRef.current = timestamps; }, [timestamps]);

  // Viewport Scaling Logic
  const isLandscape = settings.orientation === 'landscape';
  useEffect(() => {
    const updateScale = () => {
      const stageW = isLandscape ? 1280 : 450;
      const stageH = isLandscape ? 720 : 800;
      const scaleX = window.innerWidth / stageW;
      const scaleY = window.innerHeight / stageH;
      setViewportScale(Math.min(scaleX, scaleY, 0.95)); // Max 95% of screen to leave breathing room
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [isLandscape]);

  // Refs for animation and logic
  const typeTimeoutRef = useRef(null);
  const remainingCodeRef = useRef('');
  const stageRef = useRef(null);
  const runBtnRef = useRef(null);
  const editorRef = useRef(null);
  const terminalRef = useRef(null);
  const cursorRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100, opacity: 0 });
  const [cameraTransform, setCameraTransform] = useState({ scale: 1, x: 0, y: 0 });

  const activeTimeouts = useRef(new Set());
  const safeSetTimeout = useCallback((cb, delay) => {
    const id = setTimeout(() => {
      activeTimeouts.current.delete(id);
      if (isMountedRef.current) cb();
    }, delay);
    activeTimeouts.current.add(id);
    return id;
  }, []);

  const delay = (ms) => new Promise(r => safeSetTimeout(r, ms));

  const themeColors = THEMES[settings.theme];
  const isDarkTheme = settings.theme === 'darcula';

  // Initialize Audio & Cleanup
  useEffect(() => {
    if (!audioEngineInstance) {
      audioEngineInstance = new AudioEngine();
    }
    return () => {
      isMountedRef.current = false;
      activeTimeouts.current.forEach(clearTimeout);
      if (typeTimeoutRef.current) clearTimeout(typeTimeoutRef.current);
    };
  }, []);

  // Editor Auto-Scroll (Cursor Tracking Fix)
  useEffect(() => {
    if (status === 'TYPING' && cursorRef.current) {
      cursorRef.current.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    }
  }, [typedCode, status]);

  // Terminal Auto-Scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  const copyTimestamps = useCallback(() => {
    const text = timestampsRef.current.map(t => `${t.time} - ${t.title}`).join('\n');
    const textArea = document.createElement("textarea");
    textArea.value = text || "00:00 - No scenes recorded yet.";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopySuccess(true);
      setTimeout(() => { if (isMountedRef.current) setCopySuccess(false); }, 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
    document.body.removeChild(textArea);
  }, []);

  const hexToRgba = (hex, opacity) => {
    let r = 0, g = 0, b = 0;
    if (hex && hex.length === 7) {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    } else {
      return `rgba(30, 41, 59, ${opacity})`; // Default slate-800 fallback
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const currentScene = scenes[currentSceneIdx] || {};
  const noteColor = currentScene.noteColor || '#eab308';
  const noteBgColor = currentScene.noteBgColor || '#1e293b';
  const noteLogo = currentScene.noteLogo;
  const noteText = currentScene.teacherNote;

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPaused(p => !p);
      } else if (e.code === 'Escape') {
        exitToSetup();
      } else if (e.code === 'KeyT') {
        copyTimestamps();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exitToSetup, copyTimestamps]);

  // Pause logic
  useEffect(() => {
    if (isPaused) {
      if (typeTimeoutRef.current) clearTimeout(typeTimeoutRef.current);
    } else {
      // Only resume typing if we unpaused while in TYPING state
      if (statusRef.current === 'TYPING' && remainingCodeRef.current.length > 0) {
        if (typeTimeoutRef.current) clearTimeout(typeTimeoutRef.current);
        typeNextChar();
      }
    }
  }, [isPaused]);

  const triggerNext = async () => {
    if (status !== 'IDLE' || sceneIdxRef.current >= scenes.length) return;
    
    audioEngineInstance.resume();
    
    // 1. Initialize Scene & Timestamps
    if (!startTimeRef.current) {
       const now = Date.now();
       startTimeRef.current = now;
       setStartTime(now);
    }
    
    const scene = scenes[sceneIdxRef.current];
    
    // Record timestamp relative to overall sequence start
    const elapsedSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
    const ss = String(elapsedSec % 60).padStart(2, '0');
    
    setTimestamps(prev => {
       const newTs = { time: `${mm}:${ss}`, title: scene.title };
       // Prevent duplicate logging if double-triggered accidentally
       if (prev.length > 0 && prev[prev.length - 1].title === scene.title) return prev;
       return [...prev, newTs];
    });

    // Clear stage
    setTypedCode('');
    setConsoleOutput('');
    setHighlightOutput(false);
    setStatus('TYPING');
    remainingCodeRef.current = scene.code;
    
    // Small delay before typing
    safeSetTimeout(() => {
      typeNextChar();
    }, 500);
  };

  const typeNextChar = () => {
    if (isPausedRef.current) return;

    const char = remainingCodeRef.current.charAt(0);
    remainingCodeRef.current = remainingCodeRef.current.substring(1);
    
    setTypedCode(prev => prev + char);

    // Audio
    if (char === '\n') audioEngineInstance.playKeystroke('enter');
    else if (char === ' ') audioEngineInstance.playKeystroke('space');
    else audioEngineInstance.playKeystroke('letter');

    if (remainingCodeRef.current.length === 0) {
      // Done typing
      safeSetTimeout(() => startCameraSequence(), 800);
      return;
    }

    // Calculate delay
    let delayVal = settings.typingSpeed;
    delayVal += (Math.random() * 20 - 10); // Variance
    if (char === '\n' || char === ';' || char === ':') delayVal += 200; // Punctuation pause
    if (char === ' ') delayVal -= 10;

    typeTimeoutRef.current = setTimeout(typeNextChar, delayVal);
  };

  const startCameraSequence = async () => {
    setStatus('CAMERA_IN');
    
    // Calculate zoom towards run button
    if (stageRef.current && runBtnRef.current) {
      const stageRect = stageRef.current.getBoundingClientRect();
      const btnRect = runBtnRef.current.getBoundingClientRect();
      
      // Calculate center of button relative to stage center
      const btnCenterX = btnRect.left + btnRect.width / 2;
      const btnCenterY = btnRect.top + btnRect.height / 2;
      
      const stageCenterX = stageRect.left + stageRect.width / 2;
      const stageCenterY = stageRect.top + stageRect.height / 2;
      
      // Deeper zoom for run button interaction. Divide by viewportScale to get exact local coordinates.
      const scale = 1.15;
      const dx = ((stageCenterX - btnCenterX) / viewportScale) * 0.7; 
      const dy = ((stageCenterY - btnCenterY) / viewportScale) * 0.7;
      
      setCameraTransform({ scale, x: dx, y: dy });

      // Move Mouse nearby invisibly
      setMousePos({
        x: (btnCenterX - stageRect.left) / viewportScale,
        y: (btnCenterY - stageRect.top) / viewportScale + 40,
        opacity: 0
      });

      await delay(600); // Let the camera mostly settle before swooping mouse
      if (!isMountedRef.current) return;

      // Animate mouse in smoothly
      setMousePos({
        x: (btnCenterX - stageRect.left) / viewportScale + (Math.random() * 6 - 3), 
        y: (btnCenterY - stageRect.top) / viewportScale + (Math.random() * 6 - 3),
        opacity: 1,
        moving: true
      });

      await delay(1000); // Wait for the swoop
      if (!isMountedRef.current) return;

      // Click!
      audioEngineInstance.playMouseClick();
      if(runBtnRef.current) {
        runBtnRef.current.style.transform = 'scale(0.85)';
        setTimeout(() => {
          if (runBtnRef.current) runBtnRef.current.style.transform = 'scale(1)';
        }, 150);
      }

      await delay(300); // Brief pause to feel the click
      if (!isMountedRef.current) return;
      
      executeCode();
    }
  };

  const executeCode = async () => {
    setStatus('EXECUTING');
    const scene = scenes[sceneIdxRef.current];
    let output = '';

    if (settings.realExecution) {
      output = await runPython(scene.code);
    } else {
      output = scene.manualOutput;
    }
    
    if (!isMountedRef.current) return;

    // Hide mouse and pan camera to terminal
    setMousePos(prev => ({ ...prev, opacity: 0 }));
    if (stageRef.current) {
      const stageRect = stageRef.current.getBoundingClientRect();
      // Keep zoomed in, but pan up so the bottom (console) is centered
      setCameraTransform({
        scale: 1.15,
        x: 0,
        y: -((stageRect.height / viewportScale) * 0.15) 
      });
    }

    await delay(1000); // Wait for terminal to slide up and camera to pan down
    if (!isMountedRef.current) return;

    // Stream output slightly
    const lines = output.split('\n');
    setConsoleOutput('');
    
    for (let i = 0; i < lines.length; i++) {
      if (isPausedRef.current) await new Promise(resolve => {
        const interval = setInterval(() => { 
          if (!isMountedRef.current || !isPausedRef.current) { 
            clearInterval(interval); 
            resolve(); 
          } 
        }, 100);
      });
      if (!isMountedRef.current) return;
      
      setConsoleOutput(prev => prev + lines[i] + (i < lines.length - 1 ? '\n' : ''));
      if(lines[i].trim() !== '') await delay(40); // small delay per line
      if (!isMountedRef.current) return;
    }

    await delay(500); // Pause before highlighting
    if (!isMountedRef.current) return;
    
    // Trigger elegant highlight effect
    setHighlightOutput(true);
    
    await delay(2000); // Admire the output
    if (!isMountedRef.current) return;
    
    if (scene.teacherNote && scene.teacherNote.trim() !== '') {
      setStatus('SHOW_NOTE');
      
      // Pan camera smoothly back to center to show the note clearly
      setCameraTransform({ scale: 1.05, x: 0, y: 0 });
      
      // Calculate dynamic reading time (min 3.5s, ~60ms per character)
      const readTime = Math.max(3500, scene.teacherNote.length * 60);
      await delay(readTime);
    } else {
      await delay(1000); // Extra time to admire if no note
    }

    if (!isMountedRef.current) return;
    endScene();
  };

  const endScene = () => {
    setStatus('CAMERA_OUT');
    setHighlightOutput(false);
    setCameraTransform({ scale: 1, x: 0, y: 0 });
    setMousePos(prev => ({ ...prev, opacity: 0, moving: false }));
    
    safeSetTimeout(() => {
      if (sceneIdxRef.current + 1 < scenes.length) {
        setCurrentSceneIdx(sceneIdxRef.current + 1);
        setStatus('IDLE');
      } else {
        setStatus('FINISHED');
      }
    }, 1500); // Extended wait for the slow zoom out
  };

  // --- RENDER STAGE ---
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center overflow-hidden cursor-pointer"
      style={{ backgroundColor: settings.chromaKey }}
      onClick={() => { if(status === 'IDLE') triggerNext(); }}
    >
      {/* Safe Area Controls (Outside recording zone, visible on hover) */}
      <div className="absolute bottom-4 right-4 z-[100] flex gap-2 opacity-0 hover:opacity-100 transition-opacity duration-300 font-sans">
         <button onClick={(e) => { e.stopPropagation(); copyTimestamps(); }} className="px-3 py-2 bg-slate-800 text-xs text-white rounded shadow-xl border border-slate-600 hover:bg-slate-700">
           {copySuccess ? 'Copied!' : 'Copy Timestamps (T)'}
         </button>
         <button onClick={(e) => { e.stopPropagation(); exitToSetup(); }} className="px-3 py-2 bg-red-900/90 text-xs text-white rounded shadow-xl border border-red-700 hover:bg-red-800">
           Exit (Esc)
         </button>
      </div>

      {status === 'IDLE' && currentSceneIdx < scenes.length && !startTime && (
         <div className="absolute z-50 pointer-events-none flex flex-col items-center opacity-10">
           <div className="w-8 h-8 rounded-full flex items-center justify-center mb-4">
              <PlayCircle className="w-8 h-8 text-white"/>
           </div>
         </div>
      )}

      {/* Screen Scaler Wrapper to fit any monitor naturally */}
      <div style={{ transform: `scale(${viewportScale})`, transformOrigin: 'center center' }} className="flex items-center justify-center relative w-full h-full">
        
        {/* THE VIRTUAL STAGE (Camera Target) */}
        <div 
          ref={stageRef}
          className={`relative shadow-2xl overflow-hidden flex flex-col ${isLandscape ? 'w-[1280px] h-[720px]' : 'w-[450px] h-[800px]'}`}
          style={{ 
            transform: `scale(${cameraTransform.scale}) translate(${cameraTransform.x}px, ${cameraTransform.y}px)`,
            transition: 'transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
            backgroundColor: themeColors.bg,
            color: themeColors.text,
            borderRadius: isLandscape ? '16px' : '32px',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace"
          }}
        >
          
          {/* Fake Window Header (Mac Style) */}
          <div className="h-8 w-full flex items-center px-4 gap-2 opacity-50 shrink-0" style={{ backgroundColor: themeColors.sidebar }}>
            <button onClick={(e) => { e.stopPropagation(); exitToSetup(); }} className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 cursor-pointer outline-none" title="Exit to Setup"></button>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <button onClick={(e) => { e.stopPropagation(); copyTimestamps(); }} className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 cursor-pointer outline-none" title="Copy Timestamps"></button>
            <div className="flex-1 text-center text-xs opacity-70 select-none cursor-default pr-6 font-sans">
              {settings.watermark && settings.watermark.trim() !== '' 
                ? settings.watermark 
                : `main.py — ${scenes[currentSceneIdx]?.title}`}
            </div>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Sidebar (File Explorer Deco) */}
            {isLandscape && (
              <div className="w-48 border-r flex flex-col pt-4 select-none shrink-0" style={{ backgroundColor: themeColors.sidebar, borderColor: themeColors.lineNum + '40' }}>
                <div className="text-xs px-4 pb-2 opacity-60 uppercase tracking-wider font-sans">Project</div>
                <div className="text-sm px-4 py-1 bg-black/10 flex items-center gap-2 cursor-default border-l-2 border-indigo-500 text-indigo-300">
                  <Code2 className="w-4 h-4 opacity-70"/> main.py
                </div>
                <div 
                  onClick={(e) => { e.stopPropagation(); copyTimestamps(); }}
                  className="text-sm px-4 py-1 opacity-50 hover:opacity-100 flex items-center gap-2 cursor-pointer transition-all hover:bg-black/20 hover:text-green-400"
                  title="Copy Timestamps"
                >
                  <Code2 className="w-4 h-4 opacity-50"/> {copySuccess ? 'copied.txt' : 'utils.py'}
                </div>
                <div 
                  onClick={(e) => { e.stopPropagation(); exitToSetup(); }}
                  className="text-sm px-4 py-1 opacity-50 hover:opacity-100 flex items-center gap-2 cursor-pointer transition-all hover:bg-black/20 hover:text-red-400"
                  title="Exit to Setup"
                >
                  <Code2 className="w-4 h-4 opacity-50"/> setup.py
                </div>
              </div>
            )}

            {/* Main Editor Area */}
            <div className="flex-1 flex flex-col relative min-w-0">
              
              {/* Editor Action Bar */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
               <button 
                 ref={runBtnRef}
                 className="p-2 rounded bg-green-600/20 text-green-500 hover:bg-green-600/30 transition-transform duration-200"
               >
                 <Play className="w-4 h-4 fill-current" />
               </button>
            </div>

            {/* Code Editor */}
            <div ref={editorRef} className="flex-1 overflow-y-auto overflow-x-hidden relative" style={{ fontSize: `${settings.fontSize}px` }}>
               <div className="flex p-4 items-start leading-relaxed min-h-full">
                  {/* Line Numbers */}
                  <div className="w-10 text-right pr-4 select-none shrink-0" style={{ color: themeColors.lineNum }}>
                     {Array.from({length: Math.max(30, typedCode.split('\n').length)}).map((_, i) => (
                       <div key={i}>{i + 1}</div>
                     ))}
                  </div>
                  
                  {/* Code Content */}
                  <div className="flex-1 whitespace-pre-wrap outline-none relative break-words">
                     {highlightPython(typedCode, themeColors)}
                     <span ref={cursorRef} className={`inline-block w-[8px] h-[1em] align-middle bg-current ml-[2px] transition-opacity ${status === 'TYPING' ? 'opacity-100' : 'animate-pulse opacity-70'}`}></span>
                  </div>
               </div>
            </div>

            {/* Console Panel */}
            <div 
              className="border-t flex flex-col relative z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] shrink-0"
              style={{ 
                height: (status === 'EXECUTING' || status === 'SHOW_NOTE' || status === 'CAMERA_OUT' || consoleOutput) ? '40%' : '0px',
                transition: 'height 1s cubic-bezier(0.22, 1, 0.36, 1)',
                backgroundColor: themeColors.consoleBg,
                borderColor: themeColors.lineNum + '40'
              }}
            >
              <div className="h-8 flex items-center px-4 text-xs font-sans opacity-70 border-b shrink-0" style={{ borderColor: themeColors.lineNum + '20' }}>
                Terminal
              </div>
              <div ref={terminalRef} className="p-4 flex-1 overflow-y-auto font-mono text-sm opacity-90 relative">
                <div className="opacity-50 mb-2 font-semibold tracking-wider select-none">$ python main.py</div>
                <div className={`whitespace-pre-wrap transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] border-l-4
                  ${highlightOutput 
                      ? isDarkTheme
                          ? 'bg-emerald-500/10 border-emerald-400 text-emerald-100 pl-4 py-3 ml-2 rounded-r-lg shadow-[inset_10px_0_20px_rgba(52,211,153,0.05)]' 
                          : 'bg-emerald-500/20 border-emerald-600 text-emerald-900 font-bold pl-4 py-3 ml-2 rounded-r-lg shadow-[inset_10px_0_20px_rgba(52,211,153,0.2)]'
                      : 'border-transparent pl-0 py-0 ml-0 text-inherit'
                    }`}
                  >
                    {consoleOutput}
                    {status === 'EXECUTING' && !highlightOutput && <span className="inline-block w-[8px] h-[1em] bg-current ml-1 animate-pulse align-middle"></span>}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Simulated Mouse Cursor */}
          <div 
            className="absolute z-50 pointer-events-none"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
              opacity: mousePos.opacity,
              transition: mousePos.moving ? 'all 1s cubic-bezier(0.22, 1, 0.36, 1)' : 'opacity 0.2s ease-out'
            }}
          >
            <MousePointer2 className="w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] fill-black/50 transform -rotate-12" />
          </div>

          {/* Teacher Note Popup */}
          <div 
            className={`absolute inset-0 z-50 flex items-center justify-center pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              status === 'SHOW_NOTE' ? 'opacity-100 backdrop-blur-[2px] bg-black/10' : 'opacity-0'
            }`}
          >
            <div 
              className={`max-w-lg w-full mx-8 p-6 rounded-2xl border border-slate-600 shadow-[0_30px_60px_rgba(0,0,0,0.5)] transform transition-all duration-700 delay-100 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                status === 'SHOW_NOTE' ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'
              }`}
              style={{ backgroundColor: hexToRgba(noteBgColor, 0.95) }}
            >
              <div className="flex items-start gap-5">
                 <div 
                   className="p-3 rounded-full flex items-center justify-center overflow-hidden shrink-0" 
                   style={{ 
                     backgroundColor: hexToRgba(noteColor, 0.2),
                     boxShadow: `0 0 20px ${hexToRgba(noteColor, 0.2)}`,
                     width: '56px',
                     height: '56px'
                   }}
                 >
                    {noteLogo ? (
                      <img src={noteLogo} alt="Note Logo" className="w-full h-full object-contain drop-shadow-md" />
                    ) : (
                      <Lightbulb className="w-8 h-8" style={{ color: noteColor }} />
                    )}
                 </div>
                 <div className="flex-1 mt-1">
                    <h3 
                      className="font-bold tracking-[0.2em] uppercase text-xs mb-3 font-sans"
                      style={{ color: noteColor }}
                    >
                      Key Takeaway
                    </h3>
                    <p className="text-white text-lg leading-relaxed shadow-sm font-sans">
                       {noteText}
                    </p>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
