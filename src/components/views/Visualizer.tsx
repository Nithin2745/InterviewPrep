'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { EXAMPLES, PresetExample } from '@/lib/visualizer/examples';
import { tokenize, Parser, Interpreter, ExecutionStep, StackFrame, HeapObject } from '@/lib/visualizer/javaInterpreter';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, AlertCircle, Terminal, HelpCircle, Eye, Code, Layers, Sliders, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface DiscoveredEntrypoint {
  className: string;
  methods: { name: string; params: { type: string; name: string }[] }[];
}

export function Visualizer() {
  const [selectedExampleId, setSelectedExampleId] = useState(EXAMPLES[0].id);
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [discoveredEntrypoints, setDiscoveredEntrypoints] = useState<DiscoveredEntrypoint[]>([]);
  const [selectedClassName, setSelectedClassName] = useState('');
  const [selectedMethodName, setSelectedMethodName] = useState('');
  const [customArgs, setCustomArgs] = useState<Record<string, string>>({});
  const [executorMode, setExecutorMode] = useState<'local' | 'ai'>('local');
  const [isCompiling, setIsCompiling] = useState(false);
  const [showAiFallbackOffer, setShowAiFallbackOffer] = useState(false);
  
  // Simulation control state
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // steps per second: 1, 2, 5, 10
  const [error, setError] = useState<string | null>(null);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'variables' | 'console'>('variables');

  const selectedExample = EXAMPLES.find((ex) => ex.id === selectedExampleId) || EXAMPLES[0];
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update entrypoints when code changes
  useEffect(() => {
    try {
      const tokens = tokenize(code);
      const parser = new Parser(tokens);
      const ast = parser.parse();
      
      const entrypoints: DiscoveredEntrypoint[] = [];
      if (ast.type === 'Program') {
        for (const stmt of ast.body) {
          if (stmt.type === 'ClassDecl') {
            const className = stmt.name;
            const methods: { name: string; params: { type: string; name: string }[] }[] = [];
            
            for (const member of stmt.body) {
              if (member.type === 'MethodDecl') {
                methods.push({
                  name: member.name,
                  params: member.params
                });
              }
            }
            entrypoints.push({ className, methods });
          }
        }
      }
      
      if (entrypoints.length > 0) {
        setDiscoveredEntrypoints(entrypoints);
        
        // Auto-select class & method if current is invalid
        setSelectedClassName(prev => {
          const currentClassExists = entrypoints.some(e => e.className === prev);
          const nextClass = currentClassExists ? prev : entrypoints[0].className;
          
          setSelectedMethodName(prevMethod => {
            const classEntry = entrypoints.find(e => e.className === nextClass);
            if (!classEntry || classEntry.methods.length === 0) return '';
            const currentMethodExists = classEntry.methods.some(m => m.name === prevMethod);
            return currentMethodExists ? prevMethod : classEntry.methods[0].name;
          });

          return nextClass;
        });
      }
    } catch {
      // Ignore typing syntax errors
    }
  }, [code]);

  // Initialize inputs when example changes
  useEffect(() => {
    setCode(selectedExample.code);
    setSelectedClassName(selectedExample.startClassName);
    setSelectedMethodName(selectedExample.startMethodName);

    const initialArgs: Record<string, string> = {};
    selectedExample.inputs.forEach((inp) => {
      if (Array.isArray(inp.defaultValue)) {
        initialArgs[inp.name] = inp.defaultValue.join(', ');
      } else if (inp.defaultValue === null) {
        initialArgs[inp.name] = 'null';
      } else {
        initialArgs[inp.name] = inp.defaultValue.toString();
      }
    });
    setCustomArgs(initialArgs);

    setError(null);
    setSteps([]);
    setCurrentStepIdx(0);
    setIsPlaying(false);
  }, [selectedExampleId]);

  // Build inputs for execution helper
  const prepareArguments = useCallback(() => {
    const classEntry = discoveredEntrypoints.find(e => e.className === selectedClassName);
    const methodEntry = classEntry?.methods.find(m => m.name === selectedMethodName);
    if (!methodEntry) return [];

    const args: any[] = [];
    methodEntry.params.forEach((param) => {
      const valStr = customArgs[param.name] || '';
      const type = param.type.trim();

      if (type.endsWith('[]')) {
        const parsedArr = valStr.split(',').map((x) => {
          const trimmed = x.trim();
          if (trimmed === '') return null;
          return isNaN(Number(trimmed)) ? trimmed : Number(trimmed);
        }).filter(x => x !== null);
        args.push(parsedArr);
      } else if (type === 'Node' || type === 'ListNode') {
        const parsedArr = valStr.split(',').map((x) => {
          const trimmed = x.trim();
          if (trimmed === '') return null;
          return isNaN(Number(trimmed)) ? trimmed : Number(trimmed);
        }).filter(x => x !== null);

        let head: any = null;
        for (let i = parsedArr.length - 1; i >= 0; i--) {
          head = {
            val: parsedArr[i],
            next: head,
          };
        }
        args.push(head);
      } else if (type === 'int' || type === 'double') {
        args.push(valStr === '' ? 0 : Number(valStr));
      } else if (type === 'boolean') {
        args.push(valStr.trim().toLowerCase() === 'true');
      } else {
        args.push(valStr);
      }
    });
    return args;
  }, [customArgs, discoveredEntrypoints, selectedClassName, selectedMethodName]);

  // Compile and run the Java code
  const handleVisualize = async () => {
    setIsPlaying(false);
    setError(null);
    setShowAiFallbackOffer(false);

    if (executorMode === 'local') {
      try {
        const tokens = tokenize(code);
        const parser = new Parser(tokens);
        const ast = parser.parse();
        const interpreter = new Interpreter(ast);
        const args = prepareArguments();
        
        const executionSteps = interpreter.run(
          selectedClassName,
          selectedMethodName,
          args
        );

        if (executionSteps.length === 0) {
          throw new Error('No execution steps were captured.');
        }

        setSteps(executionSteps);
        setCurrentStepIdx(0);
        toast.success(`Code compiled and traced! Generated ${executionSteps.length} execution steps.`);
      } catch (e: any) {
        console.error(e);
        setError(e.message || 'An error occurred during execution.');
        setShowAiFallbackOffer(true);
        toast.error('Local compilation failed. Try compiling using the Advanced AI Executor.');
      }
    } else {
      setIsCompiling(true);
      try {
        const args = prepareArguments();
        const res = await fetch('/api/visualize-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            className: selectedClassName,
            methodName: selectedMethodName,
            args
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to simulate execution using AI.');
        }

        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }

        if (!data.steps || data.steps.length === 0) {
          throw new Error('AI execution completed but returned no trace steps.');
        }

        setSteps(data.steps);
        setCurrentStepIdx(0);
        toast.success(`AI compiler compiled and executed your code! Generated ${data.steps.length} steps.`);
      } catch (e: any) {
        console.error(e);
        setError(e.message || 'An error occurred during AI execution.');
        toast.error('AI compilation failed.');
      } finally {
        setIsCompiling(false);
      }
    }
  };

  // Playback stepping timer
  useEffect(() => {
    if (isPlaying) {
      const interval = 1000 / playbackSpeed;
      timerRef.current = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            toast.info('Execution completed.');
            return prev;
          }
          return prev + 1;
        });
      }, interval);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, steps.length, playbackSpeed]);

  const stepForward = () => {
    setIsPlaying(false);
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    }
  };

  const stepBackward = () => {
    setIsPlaying(false);
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIdx(0);
  };

  // Get current execution step detail
  const currentStep = steps[currentStepIdx] || null;
  const activeLine = currentStep?.line || 1;

  // Active stack frame variables
  const currentFrame = currentStep?.stack[currentStep.stack.length - 1] || null;
  const localVariables = currentFrame?.variables || {};

  // Extract heap objects
  const heap = currentStep?.heap || {};

  // Format variable values for stack frame
  const formatVarValue = (val: any) => {
    if (val === null) return 'null';
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'string' && val.startsWith('ref:')) {
      const parts = val.split(':');
      const type = parts[1];
      const id = parts[2];
      return `${type.charAt(0).toUpperCase() + type.slice(1)} @${id}`;
    }
    return JSON.stringify(val);
  };

  // Render heap array representation helper
  const renderHeapArray = (refId: string, varName: string) => {
    const arrayObj = heap[refId];
    if (!arrayObj || arrayObj.type !== 'array') return null;

    const values = arrayObj.value;

    // Detect if there are local variables pointing to this array's indices
    const pointerTags: Record<number, string[]> = {};
    Object.entries(localVariables).forEach(([name, val]) => {
      if (typeof val === 'number') {
        // If variable is index pointer (e.g. left, right, mid, i, j)
        // Check if its value matches an array index range
        if (val >= 0 && val < values.length) {
          if (!pointerTags[val]) pointerTags[val] = [];
          pointerTags[val].push(name);
        }
      }
    });

    return (
      <div key={refId} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card2)]/50 backdrop-blur-sm shadow-inner mt-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-text)]">Array</span>
          <span className="text-xs font-semibold text-[var(--text)] font-mono">{varName}</span>
          <span className="text-[10px] text-[var(--muted)]">length: {values.length}</span>
        </div>
        <div className="flex flex-wrap gap-2 overflow-x-auto py-4 px-2 min-h-[90px]">
          {values.map((val, idx) => {
            const tags = pointerTags[idx] || [];
            
            // Check if this index is highlighted (e.g. mid is glowing)
            const isMid = tags.includes('mid');
            const isTarget = tags.includes('i') || tags.includes('j');
            let borderStyle = 'border-[var(--border)]';
            let bgStyle = 'bg-[var(--card)]';
            if (isMid) {
              borderStyle = 'border-[var(--amber)] shadow-[0_0_12px_rgba(245,158,11,.3)]';
              bgStyle = 'bg-[var(--amber)]/10';
            } else if (tags.length > 0) {
              borderStyle = 'border-[var(--accent)] shadow-[0_0_12px_rgba(79,142,247,.3)]';
              bgStyle = 'bg-[var(--accent)]/10';
            }

            return (
              <div key={idx} className="flex flex-col items-center min-w-[50px] relative">
                {/* Index label above */}
                <span className="text-[10px] font-mono text-[var(--muted)] mb-1">[{idx}]</span>
                
                {/* Array cell value */}
                <div 
                  className={`w-12 h-12 rounded-lg border-2 ${borderStyle} ${bgStyle} flex items-center justify-center font-mono font-bold text-sm text-[var(--text)] transition-all`}
                >
                  {formatVarValue(val)}
                </div>

                {/* Pointer tags below */}
                <div className="absolute top-[68px] flex flex-col items-center gap-0.5 z-10 w-max max-w-[80px]">
                  {tags.map((tag) => {
                    let color = 'bg-[var(--accent)] text-white';
                    if (tag === 'mid') color = 'bg-[var(--amber)] text-black font-extrabold';
                    if (tag === 'left') color = 'bg-[var(--green)] text-white';
                    if (tag === 'right') color = 'bg-[var(--red)] text-white';
                    return (
                      <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded-md ${color} font-mono font-bold uppercase tracking-wide truncate shadow-sm`}>
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render heap objects (Linked List structures)
  const renderHeapLinkedList = () => {
    // Find all Node/ListNode objects on the heap
    const nodeIds = Object.keys(heap).filter((id) => heap[id].type === 'object' && (heap[id].className === 'Node' || heap[id].className === 'ListNode'));
    if (nodeIds.length === 0) return null;

    // Detect which local variables point to which Node IDs
    const pointersByNode: Record<string, string[]> = {};
    Object.entries(localVariables).forEach(([name, val]) => {
      if (typeof val === 'string' && val.startsWith('ref:object:')) {
        if (!pointersByNode[val]) pointersByNode[val] = [];
        pointersByNode[val].push(name);
      }
    });

    // Render list in horizontal row
    return (
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card2)]/50 backdrop-blur-sm shadow-inner mt-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-[var(--purple)] text-white">Linked List</span>
          <span className="text-[10px] text-[var(--muted)]">Heap Object graph traversal</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-y-8 gap-x-4 overflow-x-auto py-6 px-2 min-h-[120px]">
          {nodeIds.map((id, index) => {
            const node = heap[id];
            if (node.type !== 'object') return null;

            const val = node.fields['val'];
            const nextRef = node.fields['next'];
            const tags = pointersByNode[id] || [];

            // Parse clean numerical ID
            const shortId = id.split(':')[2];

            // Render node bubble
            return (
              <div key={id} className="flex items-center">
                {/* Node Box */}
                <div className="flex flex-col items-center relative">
                  
                  {/* Local pointer names above node */}
                  <div className="absolute -top-7 flex gap-1 z-10 w-max">
                    {tags.map((tag) => {
                      let color = 'bg-[var(--accent)] text-white';
                      if (tag === 'head') color = 'bg-[var(--green)] text-white';
                      if (tag === 'curr') color = 'bg-[var(--purple)] text-white font-extrabold';
                      if (tag === 'prev') color = 'bg-[var(--muted)] text-[var(--text)]';
                      if (tag === 'next') color = 'bg-[var(--teal)] text-black';
                      return (
                        <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded-md ${color} font-mono font-bold uppercase tracking-wider shadow-sm`}>
                          {tag}
                        </span>
                      );
                    })}
                  </div>

                  {/* Glassmorphic Node Card */}
                  <div className="w-16 h-16 rounded-2xl border-2 border-[var(--border)] bg-[var(--card)] flex flex-col justify-between p-2 shadow-md relative overflow-hidden">
                    <span className="text-[8px] font-mono text-[var(--muted)] block self-start">@{shortId}</span>
                    <span className="text-sm font-bold text-center text-[var(--text)] font-mono block mb-1">{val}</span>
                    
                    {/* Tiny representation of next field */}
                    <div className="text-[8px] font-mono text-[var(--muted)] border-t border-[var(--border)] text-center pt-0.5">
                      next: {nextRef ? `@${nextRef.split(':')[2]}` : 'null'}
                    </div>
                  </div>
                </div>

                {/* Arrow to next node */}
                {index < nodeIds.length && (
                  <div className="flex flex-col items-center px-1 font-bold text-[var(--muted)] text-xl">
                    <span className="text-[var(--accent)]">→</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const activeClass = discoveredEntrypoints.find(e => e.className === selectedClassName);
  const activeMethod = activeClass?.methods.find(m => m.name === selectedMethodName);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--grad)]" />
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold gradient-text tracking-tight flex items-center gap-2">
            <span>🔮 Interactive Java Code Visualizer</span>
          </h2>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Step through Java algorithms line-by-step and inspect Stack frames, Heap layouts, and variables visually.
          </p>
        </div>

        {/* Dropdown Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider shrink-0">Algorithm Preset:</label>
          <select
            value={selectedExampleId}
            onChange={(e) => setSelectedExampleId(e.target.value)}
            className="bg-[var(--card2)] border border-[var(--border)] rounded-xl py-2 px-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] font-semibold transition-colors"
          >
            {EXAMPLES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Editor & Control (5 cols) */}
        <div className="lg:col-span-6 space-y-6 flex flex-col">
          
          {/* Inputs Section */}
          <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text)] mb-3 flex items-center gap-2">
              <Sliders size={13} className="text-[var(--accent)]" />
              <span>Execution Parameters</span>
            </h3>
            
            {/* Executor engine selector */}
            <div className="flex items-center justify-between bg-[var(--card2)] border border-[var(--border)] p-1 rounded-xl mb-4 text-[10px]">
              <span className="font-bold text-[var(--muted)] uppercase tracking-wider pl-2">Execution Engine:</span>
              <div className="flex bg-[var(--card)] p-0.5 rounded-lg border border-[var(--border)]">
                <button
                  onClick={() => { setExecutorMode('local'); setError(null); setShowAiFallbackOffer(false); }}
                  className={`px-3 py-1 rounded-md transition-all font-semibold cursor-pointer ${executorMode === 'local' ? 'bg-[var(--accent)] text-[var(--accent-text)]' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
                >
                  Local Interpreter
                </button>
                <button
                  onClick={() => { setExecutorMode('ai'); setError(null); setShowAiFallbackOffer(false); }}
                  className={`px-3 py-1 rounded-md transition-all font-semibold cursor-pointer ${executorMode === 'ai' ? 'bg-[var(--accent)] text-[var(--accent-text)]' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
                >
                  AI VM (Advanced)
                </button>
              </div>
            </div>

            {/* Entrypoint Class and Method selector */}
            <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-[var(--border)]">
              <div className="flex-1 min-w-[120px] space-y-1">
                <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Execute Class</label>
                <select
                  value={selectedClassName}
                  onChange={(e) => {
                    setSelectedClassName(e.target.value);
                    const classEntry = discoveredEntrypoints.find(x => x.className === e.target.value);
                    if (classEntry && classEntry.methods.length > 0) {
                      setSelectedMethodName(classEntry.methods[0].name);
                    }
                  }}
                  className="w-full bg-[var(--card2)] border border-[var(--border)] rounded-xl py-1.5 px-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] font-semibold transition-colors"
                >
                  {discoveredEntrypoints.map((e) => (
                    <option key={e.className} value={e.className}>
                      {e.className}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[120px] space-y-1">
                <label className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Execute Method</label>
                <select
                  value={selectedMethodName}
                  onChange={(e) => setSelectedMethodName(e.target.value)}
                  className="w-full bg-[var(--card2)] border border-[var(--border)] rounded-xl py-1.5 px-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] font-semibold transition-colors"
                >
                  {activeClass?.methods.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}({m.params.map(p => p.type).join(', ')})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dynamic arguments fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeMethod?.params.map((param) => (
                <div key={param.name} className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[var(--muted)] font-mono">
                    {param.name} ({param.type})
                  </label>
                  {param.type === 'boolean' ? (
                    <select
                      value={customArgs[param.name] || 'false'}
                      onChange={(e) => setCustomArgs(prev => ({ ...prev, [param.name]: e.target.value }))}
                      className="w-full bg-[var(--card2)] border border-[var(--border)] rounded-xl py-2 px-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] font-mono transition-all"
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={customArgs[param.name] || ''}
                      onChange={(e) => setCustomArgs(prev => ({ ...prev, [param.name]: e.target.value }))}
                      className="w-full bg-[var(--card2)] border border-[var(--border)] rounded-xl py-2 px-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] font-mono transition-all"
                      placeholder={
                        param.type.endsWith('[]') || param.type === 'Node' || param.type === 'ListNode'
                          ? 'e.g. 10, 20, 30'
                          : param.type === 'int' || param.type === 'double'
                            ? 'e.g. 5'
                            : 'e.g. hello'
                      }
                    />
                  )}
                </div>
              ))}
              {(!activeMethod || activeMethod.params.length === 0) && (
                <div className="sm:col-span-2 text-xs italic text-[var(--muted)] text-center py-2">
                  No parameters needed for this method.
                </div>
              )}
            </div>
            
            {showAiFallbackOffer && (
              <div className="mt-4 p-3 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-xl flex flex-col gap-2 animate-in fade-in duration-200">
                <p className="text-[11px] text-[var(--text)] leading-relaxed">
                  💡 This code uses advanced Java libraries or syntax unsupported by the local client-side interpreter. 
                  Would you like to run it using the <b>Advanced AI VM</b> (which supports all standard Java classes)?
                </p>
                <button
                  onClick={() => {
                    setExecutorMode('ai');
                    setShowAiFallbackOffer(false);
                    setTimeout(() => {
                      document.getElementById('compile-visualize-btn')?.click();
                    }, 100);
                  }}
                  className="w-full py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-text)] text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all text-center cursor-pointer"
                >
                  Run using AI Virtual Machine 🪄
                </button>
              </div>
            )}

            <div className="flex justify-between items-center mt-5 pt-3 border-t border-[var(--border)]">
              <p className="text-[10px] text-[var(--muted)] italic">
                {selectedExample.description}
              </p>
              
              <button
                id="compile-visualize-btn"
                onClick={handleVisualize}
                disabled={isCompiling}
                className="py-2 px-4 rounded-xl font-extrabold text-xs transition-all hover:opacity-90 active:scale-[0.98] shrink-0 ml-3 cursor-pointer flex items-center gap-1.5"
                style={{ background: 'var(--grad)', color: 'var(--accent-text)', boxShadow: 'var(--glow)' }}
              >
                {isCompiling ? (
                  <>
                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Compiling...</span>
                  </>
                ) : (
                  <span>Compile & Visualize 🪄</span>
                )}
              </button>
            </div>
          </div>

          {/* Code Editor view */}
          <div className="flex-1 min-h-[400px] rounded-2xl border border-[var(--border)] bg-[var(--code-bg)] shadow-lg overflow-hidden flex flex-col relative">
            <div className="bg-[var(--card)] px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Code size={14} className="text-[var(--accent)]" />
                <span className="text-xs font-bold text-[var(--text)]">Java Code Editor</span>
              </div>
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider bg-[var(--card2)] px-2 py-0.5 rounded">Java Subset</span>
            </div>

            {/* Line numbers gutter + text editor */}
            <div className="flex-1 flex overflow-y-auto relative font-mono text-xs leading-6 p-2">
              
              {/* Line highlights background */}
              {steps.length > 0 && (
                <div 
                  className="absolute left-0 right-0 h-6 bg-[var(--accent)]/15 border-y border-[var(--accent)]/30 transition-all pointer-events-none"
                  style={{
                    top: `${(activeLine - 1) * 24 + 8}px`,
                  }}
                />
              )}

              {/* Gutter numbers */}
              <div className="select-none text-[var(--muted)] text-right pr-4 border-r border-[var(--border)]/50 w-10 shrink-0 text-[11px] pt-0.5">
                {code.split('\n').map((_, i) => (
                  <div key={i} className="h-6">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Raw Editor Textarea */}
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 bg-transparent text-[var(--text)] outline-none resize-none overflow-x-auto pl-4 leading-6 whitespace-pre font-mono pt-0.5"
                spellCheck={false}
                style={{ height: `${code.split('\n').length * 24}px` }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic execution stack, heap memory, output, explanations (7 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Simulation controller dock */}
          <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  disabled={steps.length === 0}
                  className="p-2 rounded-lg border border-[var(--border)] bg-[var(--card2)] text-[var(--text)] hover:bg-[var(--border)] transition-colors disabled:opacity-50"
                  title="Reset"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={stepBackward}
                  disabled={steps.length === 0 || currentStepIdx === 0}
                  className="p-2 rounded-lg border border-[var(--border)] bg-[var(--card2)] text-[var(--text)] hover:bg-[var(--border)] transition-colors disabled:opacity-50"
                  title="Step Backward"
                >
                  <SkipBack size={14} />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={steps.length === 0}
                  className="p-2.5 rounded-full text-[var(--accent-text)] transition-transform hover:scale-105 disabled:opacity-50"
                  style={{ background: 'var(--grad)' }}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                </button>
                <button
                  onClick={stepForward}
                  disabled={steps.length === 0 || currentStepIdx === steps.length - 1}
                  className="p-2 rounded-lg border border-[var(--border)] bg-[var(--card2)] text-[var(--text)] hover:bg-[var(--border)] transition-colors disabled:opacity-50"
                  title="Step Forward"
                >
                  <SkipForward size={14} />
                </button>
              </div>

              {/* Speed Slider */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider shrink-0">Speed:</span>
                <div className="flex items-center bg-[var(--card2)] border border-[var(--border)] p-1 rounded-xl">
                  {[0.5, 1, 2, 4].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${playbackSpeed === spd ? 'bg-[var(--card)] text-[var(--text)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline Progress Slider */}
            {steps.length > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-[var(--muted)]">
                  <span>STEP PROGRESS</span>
                  <span>{currentStepIdx + 1} / {steps.length}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={steps.length - 1}
                  value={currentStepIdx}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentStepIdx(Number(e.target.value));
                  }}
                  className="w-full accent-[var(--accent)] bg-[var(--border)] rounded-lg appearance-none h-1.5 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Compilation error alert */}
          {error && (
            <div className="p-4 rounded-2xl bg-[var(--red)]/15 border border-[var(--red)]/35 text-[var(--red)] flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <AlertCircle className="shrink-0 mt-0.5" size={16} />
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider">Compilation / Execution Error</h4>
                <p className="text-[11px] font-mono whitespace-pre-wrap">{error}</p>
              </div>
            </div>
          )}

          {/* Stack & Variables / Heap memory Panel */}
          {steps.length > 0 && !error && (
            <div className="space-y-6">
              
              {/* Plain-English Explanation Banner */}
              <div className="p-4 rounded-2xl border border-[var(--accent)]/30 bg-[var(--card)] relative shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-[var(--accent)]" />
                <h4 className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <HelpCircle size={11} />
                  <span>Execution Explanation (Line {activeLine})</span>
                </h4>
                <p className="text-xs text-[var(--text)] font-semibold leading-relaxed">
                  {currentStep?.explanation}
                </p>
              </div>

              {/* Memory Workspace */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg overflow-hidden">
                <div className="bg-[var(--card)] border-b border-[var(--border)] px-4 py-2 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Layers size={14} className="text-[var(--accent)]" />
                    <span className="text-xs font-bold text-[var(--text)]">Memory Stack & Heap</span>
                  </div>
                </div>

                <div className="p-5 space-y-6">
                  {/* Stack Frames layout */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">Call Stack Frames (Innermost top)</span>
                    <div className="flex flex-col-reverse gap-2">
                      {currentStep?.stack.map((frame, index) => (
                        <div 
                          key={index}
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                            index === currentStep.stack.length - 1 
                              ? 'border-[var(--accent)] bg-[var(--accent)]/5' 
                              : 'border-[var(--border)] bg-[var(--card2)]/40 text-[var(--muted)]'
                          }`}
                        >
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-xs font-extrabold">{frame.methodName}()</span>
                            <span className="text-[10px] font-medium bg-[var(--card2)] px-2 py-0.5 rounded border border-[var(--border)]">line {frame.line}</span>
                          </div>

                          {/* Variables flat layout */}
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(frame.variables).length === 0 ? (
                              <span className="text-[10px] italic text-[var(--muted)]">no variables</span>
                            ) : (
                              Object.entries(frame.variables).map(([name, val]) => (
                                <div key={name} className="flex items-center text-[10px] bg-[var(--card2)] border border-[var(--border)] rounded-lg px-2 py-1 font-mono shadow-sm">
                                  <span className="text-[var(--accent)] font-semibold">{name}</span>
                                  <span className="text-[var(--muted)] mx-1">=</span>
                                  <span className="text-[var(--text)] font-semibold">{formatVarValue(val)}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Heap representations dynamically */}
                  <div className="border-t border-[var(--border)] pt-5">
                    <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block mb-2">Heap Allocation</span>
                    
                    {Object.keys(heap).length === 0 ? (
                      <div className="text-xs text-center py-6 text-[var(--muted)] bg-[var(--card2)]/20 border border-dashed border-[var(--border)] rounded-xl">
                        No active allocations on heap (stack variables only)
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* 1. Show arrays referenced by local variables */}
                        {Object.entries(localVariables).map(([varName, val]) => {
                          if (typeof val === 'string' && val.startsWith('ref:array:')) {
                            return renderHeapArray(val, varName);
                          }
                          return null;
                        })}

                        {/* 2. Show Linked List structures if they exist */}
                        {renderHeapLinkedList()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Console Output Drawer & Terminal */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg overflow-hidden">
                <div className="bg-[var(--card)] border-b border-[var(--border)] px-4 py-2 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-[var(--accent)]" />
                    <span className="text-xs font-bold text-[var(--text)]">Standard Console stdout</span>
                  </div>
                </div>
                <div className="bg-[var(--code-bg)] p-4 font-mono text-[11px] text-[var(--green)] min-h-[100px] max-h-[200px] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                  {currentStep?.output || 'No output printed yet.'}
                </div>
              </div>
            </div>
          )}

          {/* Empty Placeholder state if not compiled yet */}
          {steps.length === 0 && !error && (
            <div className="h-96 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/40 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[var(--card2)] border border-[var(--border)] flex items-center justify-center text-2xl shadow-md">
                ☕
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-[var(--text)]">No Simulation Running</h4>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Select an algorithm preset or write your custom code, configure the variables, and click <b>Compile & Visualize</b> to start step-by-step tracing.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
