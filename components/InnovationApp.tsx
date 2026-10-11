"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Background, Controls, MarkerType, MiniMap, ReactFlow, ReactFlowProvider, useReactFlow, type Node, type NodeChange, applyNodeChanges } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Activity, ArrowLeft, Beaker, Bot, BrainCircuit, ChevronLeft, ChevronRight, CirclePlus, Command, FileText, GitBranch, GitMerge, Home, Lightbulb, LoaderCircle, Maximize2, Menu, Minimize2, Moon, PanelRightClose, Plus, Search, Send, Sparkles, Target, X, Zap } from "lucide-react";
import { IdeaNodeCard } from "./IdeaNodeCard";
import { useSwarm, type StoredIdea } from "@/lib/store";
import { innovationApi } from "@/lib/api/innovation";
import type { AgentEvaluation, DiscoveryIdea, IdeaNode } from "@/lib/types/innovation";

const nodeTypes = { idea: IdeaNodeCard };
const examples = ["Privacy and cybersecurity", "Emerging AI technologies", "Sustainable energy", "Healthcare innovation"];
const kindLabels = { root: "Seed", variation: "Variation", merged: "Merged", improved: "Improved" };
const revisedCouncilScore=(idea:Pick<StoredIdea,"score">)=>72+Math.max(-6,Math.min(6,Math.round(((idea.score??72)-72)/4)));

function StageProgress({stage}:{stage:number}) {
  const stages=["Set focus","Develop ideas","Critique","Deliver"];
  return <nav className="stage-progress" aria-label="Research stages">{stages.map((label,index)=>{const number=index+1;return <div key={label} className={number<stage?"complete":number===stage?"active":""}><span>{number<stage?"✓":number}</span><b>{label}</b></div>})}</nav>;
}

function AppSidebar() {
  const { leftOpen, set: patch, reset, mode } = useSwarm();
  return <aside className={`app-sidebar ${leftOpen ? "open" : "closed"}`}>
    <div className="brand"><div className="brand-mark"><Sparkles size={18}/></div>{leftOpen && <><div><strong>Research</strong><span>COUNCIL</span></div><button className="icon-btn dark" onClick={() => patch({leftOpen:false})} aria-label="Collapse sidebar"><ChevronLeft size={17}/></button></>}</div>
    {!leftOpen ? <button className="icon-btn dark sidebar-open" onClick={() => patch({leftOpen:true})}><Menu size={18}/></button> : <>
      <button className="new-exploration" onClick={reset}><Plus size={17}/> New exploration</button>
      <nav aria-label="Primary"><button className={mode === "canvas" ? "active" : ""}><GitBranch/>Research board</button><button><Lightbulb/>Saved ideas <span className="soon">3</span></button><button><Activity/>Activity</button></nav>
      <div className="sidebar-spacer"/>
      <div className="workspace-card"><div className="workspace-avatar">RC</div><div><strong>Research Council</strong><span>Demo workspace</span></div><ChevronRight size={15}/></div>
      <div className="sidebar-foot"><span><span className="status-dot"/>All systems ready</span><button className="icon-btn dark"><Moon size={16}/></button></div>
    </>}
  </aside>;
}

function EmptyState() {
  const [prompt, setPrompt] = useState("");
  const { set: patch, loading } = useSwarm();
  const submit = async () => {
    if (!prompt.trim() || loading.discover) return;
    patch({ loading: {...loading, discover:true}, error:undefined });
    try {
      const results=await innovationApi.discoverIdeas(prompt);
      const initialIdeas:StoredIdea[]=results.map((item,index)=>({
        ...item,
        id:`seed-${item.title.toLowerCase().replace(/\W+/g,"-")}-${index}`,
        generation:0,
        parentIds:[],
        kind:"root",
        score:item.novelty,
        createdAt:new Date(Date.now()+index).toISOString(),
        position:{x:60,y:80+index*150},
      }));
      patch({discovery:results,mode:"canvas",ideas:Object.fromEntries(initialIdeas.map(idea=>[idea.id,idea])),selectedIds:[],expandedIds:[],critiques:{},loading:{...loading,discover:false}});
    }
    catch { patch({ error:"Discovery took too long. Please try again.", loading:{...loading, discover:false} }); }
  };
  return <main className="welcome"><div className="ambient one"/><div className="ambient two"/><StageProgress stage={1}/><div className="hero-icon"><Lightbulb/></div><h1>What do you want to explore?</h1><p className="hero-sub">Start with a technology, industry, or problem. We’ll generate seven directions you can explore and develop.</p>
    <div className="prompt-card"><div className="prompt-row"><Search size={22}/><textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void submit();}}} placeholder="Enter a technology, industry, or problem..." aria-label="Exploration prompt"/><button onClick={submit} disabled={!prompt.trim()||loading.discover}>{loading.discover?<><LoaderCircle className="spin"/>Exploring possibilities…</>:<><Sparkles/>Generate Ideas</>}</button></div><div className="prompt-meta"><span><Command size={13}/> Press Enter to begin</span><span>Seven focused ideas</span></div></div>
    <div className="examples"><span>TRY AN EXAMPLE</span><div>{examples.map((example)=><button key={example} onClick={()=>setPrompt(example)}>{example}<ChevronRight/></button>)}</div></div>
  </main>;
}

function DiscoveryResults() {
  const { discovery, set: patch } = useSwarm();
  const explore = (item: DiscoveryIdea) => { const id=`root-${item.title.toLowerCase().replace(/\W+/g,"-")}`; const root:StoredIdea={...item,id,generation:0,parentIds:[],kind:"root",createdAt:new Date().toISOString(),position:{x:70,y:230}}; patch({mode:"canvas",ideas:{[id]:root},selectedIds:[id],expandedIds:[],critiques:{}}); };
  return <main className="discovery"><header><button className="back-btn" onClick={()=>patch({mode:"empty"})}><ArrowLeft/> Back</button><div className="demo-pill"><span/> DEMO DATA</div></header><div className="discovery-heading"><span className="eyebrow">DISCOVERY SCAN COMPLETE</span><h1>Promising technology frontiers</h1><p>Choose a seed to open your innovation canvas. Novelty scores are illustrative, not live research.</p></div><div className="discovery-grid">{discovery.map((item,i)=><article className="discovery-card" key={item.title}><div className="card-index">0{i+1}</div><span className="category">{item.industry}</span><h2>{item.title}</h2><p>{item.description}</p><div className="tags">{item.applications.map((tag)=><span key={tag}>{tag}</span>)}</div><div className="novelty"><span>Illustrative novelty</span><div><i style={{width:`${item.novelty}%`}}/></div><b>{item.novelty}</b></div><button onClick={()=>explore(item)}>Explore concept <ChevronRight/></button></article>)}</div></main>;
}

function CanvasHeader() {
  const { ideas, set: patch, leftOpen } = useSwarm(); const [query,setQuery]=useState("");
  return <header className="canvas-header">{!leftOpen&&<button className="icon-btn" onClick={()=>patch({leftOpen:true})}><Menu/></button>}<div className="breadcrumb"><span>Explorations</span><ChevronRight/><strong>{Object.values(ideas)[0]?.title ?? "Untitled"}</strong></div><div className="canvas-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ask a follow-up or add a new seed..."/><button><Send/></button></div><span className="saved"><span/>Saved locally</span><div className="avatar">SH</div></header>;
}

function SelectionToolbar({ onExpand, onMerge, onCritique }: {onExpand:()=>void;onMerge:()=>void;onCritique:()=>void}) {
  const {selectedIds, loading}=useSwarm(); if(!selectedIds.length)return null;
  return <div className="selection-toolbar"><span><b>{selectedIds.length}</b> selected</span>{selectedIds.length===1&&<><button onClick={onExpand} disabled={loading.expand}><GitBranch/>Expand ×10</button><button onClick={onCritique} disabled={loading.critique}><Bot/>Critique</button></>} {selectedIds.length>1&&<button className="accent" onClick={onMerge} disabled={loading.merge}><GitMerge/>Merge selected</button>}<span className="key-hint">Shift-click to multi-select · Esc to clear</span></div>;
}

function CanvasInner() {
  const { ideas, selectedIds, set: patch, updatePosition, addIdeas, expandedIds, loading, critiques } = useSwarm(); const rf=useReactFlow();
  const domain=Object.values(ideas); const selected=selectedIds[0]?ideas[selectedIds[0]]:undefined;
  const selectId=useCallback((id:string,multi:boolean)=>patch({selectedIds:multi?(selectedIds.includes(id)?selectedIds.filter(current=>current!==id):[...selectedIds,id]):[id],rightOpen:true}),[patch,selectedIds]);
  const nodes=useMemo<Node[]>(()=>domain.map((idea)=>({id:idea.id,type:"idea",position:idea.position,data:{idea},selected:selectedIds.includes(idea.id)})),[domain,selectedIds]);
  const edges=useMemo(()=>domain.flatMap((idea)=>idea.parentIds.map((parentId)=>({id:`${parentId}-${idea.id}`,source:parentId,target:idea.id,type:"smoothstep",animated:idea.kind==="merged",style:{stroke:idea.kind==="merged"?"#8b5cf6":"#a6afc3",strokeWidth:1.5},markerEnd:{type:MarkerType.ArrowClosed,color:idea.kind==="merged"?"#8b5cf6":"#a6afc3"}}))),[domain]);
  const setLoading=(key:keyof typeof loading,value:boolean)=>patch({loading:{...loading,[key]:value}});
  const expand=async()=>{if(!selected||expandedIds.includes(selected.id))return patch({error:"This idea already has a complete set of variations."}); if(domain.length>=60)return patch({error:"Demo limit of 60 ideas reached."}); setLoading("expand",true);try{const children=await innovationApi.expandIdea(selected,Math.min(10,60-domain.length));const baseX=selected.position.x+360;const startY=selected.position.y-((children.length-1)*145)/2;addIdeas(children.map((c,i)=>({...c,position:{x:baseX+(i%2)*40,y:startY+i*145}})));patch({expandedIds:[...expandedIds,selected.id],error:undefined});setTimeout(()=>rf.fitView({duration:600,padding:.15}),50);}catch{patch({error:"Could not expand this idea."});}finally{setLoading("expand",false);}};
  const merge=async()=>{if(selectedIds.length<2)return;setLoading("merge",true);try{const parents=selectedIds.map(id=>ideas[id]);const merged=await innovationApi.mergeIdeas(parents);const maxX=Math.max(...parents.map(p=>p.position.x));const avgY=parents.reduce((sum,p)=>sum+p.position.y,0)/parents.length;addIdeas([{...merged,position:{x:maxX+380,y:avgY}}]);patch({selectedIds:[merged.id],error:undefined});}catch{patch({error:"Could not merge these ideas."});}finally{setLoading("merge",false);}};
  const critique=async()=>{if(!selected)return;setLoading("critique",true);try{const result=await innovationApi.critiqueIdea(selected);patch({critiques:{...critiques,[selected.id]:result},rightOpen:true,error:undefined});}catch{patch({error:"Agent critique is unavailable."});}finally{setLoading("critique",false);}};
  const changes=useCallback((changes:NodeChange[])=>{for(const change of changes){if(change.type==="position"&&change.position)updatePosition(change.id,change.position);}},[updatePosition]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==="Escape")patch({selectedIds:[]});};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);},[patch]);
  return <div className="canvas-wrap"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={changes} onNodeClick={(e,node)=>selectId(node.id,e.shiftKey||e.metaKey)} onPaneClick={()=>patch({selectedIds:[]})} fitView minZoom={.28} maxZoom={1.5} selectionOnDrag multiSelectionKeyCode="Shift"><Background color="#d8dce7" gap={24} size={1}/><Controls showInteractive={false}/><MiniMap pannable zoomable nodeColor={(node)=>{const kind=(node.data.idea as IdeaNode).kind;return kind==="root"?"#4f46e5":kind==="merged"?"#8b5cf6":kind==="improved"?"#10b981":"#94a3b8";}}/><div className="legend">{Object.entries(kindLabels).map(([kind,label])=><span key={kind}><i className={`legend-${kind}`}/>{label}</span>)}</div></ReactFlow><SelectionToolbar onExpand={()=>void expand()} onMerge={()=>void merge()} onCritique={()=>void critique()}/>{useSwarm.getState().error&&<div className="toast"><Zap/> {useSwarm.getState().error}<button onClick={()=>patch({error:undefined})}><X/></button></div>}</div>;
}

function AgentCard({agent}:{agent:AgentEvaluation}) { const [open,setOpen]=useState(false); return <article className={`agent-card agent-${agent.agentId}`}><button className="agent-summary" onClick={()=>setOpen(!open)}><span className="agent-icon"><Bot/></span><span><b>{agent.agentName}</b><small>{agent.summary}</small></span><strong>{agent.score}<small>/10</small></strong></button>{open&&<div className="agent-details"><b>Strengths</b><ul>{agent.strengths.map(x=><li key={x}>{x}</li>)}</ul><b>Watchouts</b><ul>{agent.weaknesses.map(x=><li key={x}>{x}</li>)}</ul><b>Next move</b><p>{agent.recommendations[0]}</p></div>}</article>; }

function IdeaInspector({onImprove}:{onImprove:()=>void}) { const {selectedIds,ideas,critiques,rightOpen,set:patch,loading}=useSwarm();const idea=selectedIds[0]?ideas[selectedIds[0]]:undefined;const critique=idea?critiques[idea.id]:undefined;if(!rightOpen)return null;return <aside className="inspector"><div className="inspector-head"><div><span>IDEA INSPECTOR</span>{selectedIds.length>1&&<b>{selectedIds.length} ideas selected</b>}</div><button className="icon-btn" onClick={()=>patch({rightOpen:false})}><ChevronRight/></button></div>{!idea?<div className="inspector-empty"><Target/><h3>Select an idea</h3><p>Choose any node to inspect its details and run agent analysis.</p></div>:<div className="inspector-scroll"><div className={`idea-badge badge-${idea.kind}`}><span>{idea.kind}</span><i>Generation {idea.generation}</i></div><h2>{idea.title}</h2><span className="industry">{idea.industry}</span><p className="description">{idea.description}</p><div className="metric-row"><div><span>Potential</span><b>{idea.score??"—"}<small>/100</small></b></div><div><span>Parents</span><b>{idea.parentIds.length}</b></div><div><span>Generation</span><b>{idea.generation}</b></div></div>{idea.changes&&<div className="changes"><Sparkles/><div><b>What changed</b><p>{idea.changes}</p></div></div>}<section className="inspector-section"><header><span>AGENT REVIEW</span>{critique&&<b>Complete</b>}</header>{loading.critique?<div className="analyzing"><LoaderCircle className="spin"/><b>Four agents are evaluating…</b><span>Testing feasibility, market, fit, and future readiness.</span></div>:critique?<><p className="overall">{critique.overallSummary}</p>{critique.evaluations.map(agent=><AgentCard key={agent.agentId} agent={agent}/>)}{critique.conflicts.map(conflict=><div className="debate" key={conflict.id}><span><Zap/>AGENT DEBATE</span><h4>{conflict.issue}</h4>{conflict.perspectives.map(p=><p key={p.agentId}><b>{p.agentId}:</b> {p.position}</p>)}<div><b>Proposed resolution</b>{conflict.resolution}</div></div>)}</>:<div className="review-empty"><Bot/><p>Run a four-agent critique to surface strengths, risks, and strategic tensions.</p></div>}</section>{critique&&<button className="improve-btn" onClick={onImprove} disabled={loading.improve}>{loading.improve?<LoaderCircle className="spin"/>:<Sparkles/>}Improve idea</button>}</div>}</aside>;}

function IdeasListWorkspace(){
  const {ideas,selectedIds,critiques,loading,addIdeas,set:patch}=useSwarm();
  const [activeParentId,setActiveParentId]=useState<string|undefined>();
  const [selectedSavedIds,setSelectedSavedIds]=useState<string[]>([]);
  const [modalId,setModalId]=useState<string|undefined>();
  const [revisedIds,setRevisedIds]=useState<Record<string,string[]>>({});
  const [executionIds,setExecutionIds]=useState<string[]>([]);
  const [activeExecutionId,setActiveExecutionId]=useState<string|undefined>();
  const [progress,setProgress]=useState<Record<string,string>>({});
  const [deliverableType,setDeliverableType]=useState("Project brief");
  const [deliverables,setDeliverables]=useState<Record<string,string>>({});
  const [mobileColumn,setMobileColumn]=useState("generation");
  const [selectedGenerationIds,setSelectedGenerationIds]=useState<string[]>([]);
  const [proposalInput,setProposalInput]=useState("");
  const [reviewPaneWidth,setReviewPaneWidth]=useState(48);
  const [resizingReview,setResizingReview]=useState(false);
  const reviewSplitRef=useRef<HTMLDivElement>(null);
  const [workspacePage,setWorkspacePage]=useState<"ideas"|"execution">("ideas");
  const [evaluationWidth,setEvaluationWidth]=useState(38);
  const [resizingIdeaPanels,setResizingIdeaPanels]=useState(false);
  const ideaGridRef=useRef<HTMLDivElement>(null);
  const allIdeas=Object.values(ideas);
  const roots=allIdeas.filter(idea=>idea.kind==="root"&&idea.parentIds.length===0);
  const visible=(activeParentId?allIdeas.filter(idea=>idea.parentIds.includes(activeParentId)):roots).map(idea=>({...idea,score:revisedCouncilScore(idea)})).sort((a,b)=>(b.score??0)-(a.score??0));
  const saved=selectedIds.map(id=>ideas[id]).filter(Boolean).map(idea=>({...idea,score:revisedCouncilScore(idea)})).sort((a,b)=>(b.score??0)-(a.score??0));
  const selectedSaved=selectedSavedIds.map(id=>ideas[id]).filter(Boolean);
  const execution=executionIds.map(id=>ideas[id]).filter(Boolean);
  const modalIdea=modalId?ideas[modalId]:undefined;
  const activeExecution=activeExecutionId?ideas[activeExecutionId]:undefined;
  const setLoading=(key:keyof typeof loading,value:boolean)=>patch({loading:{...useSwarm.getState().loading,[key]:value}});
  const clamp=(value:number)=>Math.max(20,Math.min(92,Math.round(value)));
  const scoreData=(idea:StoredIdea)=>{
    const adjustment=Math.max(-6,Math.min(6,Math.round(((idea.score??72)-72)/4)));
    return [
      {name:"Technical Feasibility",beforeScore:clamp(52+adjustment),score:clamp(68+adjustment),explanation:"A bounded deployment on certified hardware reduces integration and latency risk.",evidence:"Changed after the Technical Agent replaced broad real-time deployment with one supported device profile."},
      {name:"Market Opportunity",beforeScore:clamp(66+adjustment),score:clamp(74+adjustment),explanation:"A focused buyer and measurable workflow make demand easier to validate.",evidence:"Changed after the Market Agent proposed a paid pilot with explicit success metrics."},
      {name:"Cisco Strategic Fit",beforeScore:clamp(70+adjustment),score:clamp(79+adjustment),explanation:"The revised approach aligns with secure networking and validated enterprise operations.",evidence:"Changed after the Strategy Agent tied the pilot to Cisco-managed infrastructure and channels."},
      {name:"Technology Horizon",beforeScore:clamp(57+adjustment),score:clamp(67+adjustment),explanation:"The concept remains early, but a modular path avoids dependence on immature standards.",evidence:"Changed after the Horizon Agent recommended offline fallback and modular integrations."},
    ];
  };
  const scoreLabel=(score:number)=>score>=80?"Strong":score>=70?"Promising":score>=60?"Needs testing":"Do not advance";
  const scoreToneClass=(score:number|undefined)=>{const value=score??0;return value>=90?"score-violet":value>=85?"score-teal":value>=80?"score-amber":"score-blue";};
  const path=useMemo(()=>{const result:StoredIdea[]=[];let current=activeParentId?ideas[activeParentId]:undefined;const seen=new Set<string>();while(current&&!seen.has(current.id)){seen.add(current.id);result.unshift(current);current=current.parentIds[0]?ideas[current.parentIds[0]]:undefined;}return result;},[activeParentId,ideas]);
  const toggleSaved=(id:string)=>patch({selectedIds:selectedIds.includes(id)?selectedIds.filter(current=>current!==id):[...selectedIds,id]});
  const toggleSelected=(id:string)=>setSelectedSavedIds(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);
  const toggleGeneration=(id:string)=>setSelectedGenerationIds(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);
  const addProposalDirection=async()=>{
    const prompt=proposalInput.trim();
    if(!prompt||loading.discover)return;
    setLoading("discover",true);
    try{
      const stamp=Date.now();
      const results=await innovationApi.discoverIdeas(prompt);
      addIdeas(results.map((item,index)=>({...item,id:`seed-${item.title.toLowerCase().replace(/\W+/g,"-")}-${stamp}-${index}`,generation:0,parentIds:[],kind:"root",score:item.novelty,createdAt:new Date(stamp+index).toISOString(),position:{x:0,y:index*120}})));
      setProposalInput("");
      setActiveParentId(undefined);
      patch({error:undefined});
    }catch{patch({error:"Could not add this direction."});}
    finally{setLoading("discover",false);}
  };
  const addGenerationToEvaluation=()=>{
    if(!selectedGenerationIds.length)return;
    const nextSaved=[...new Set([...selectedIds,...selectedGenerationIds])];
    patch({selectedIds:nextSaved});
    setSelectedSavedIds(selectedGenerationIds);
    setMobileColumn("evaluation");
  };
  const explore=async(idea:StoredIdea,regenerate=false)=>{const existing=allIdeas.filter(item=>item.parentIds.includes(idea.id));if(existing.length&&!regenerate){setActiveParentId(idea.id);setMobileColumn("generation");return;}setLoading("expand",true);try{const stamp=Date.now();const children=await innovationApi.expandIdea(idea,7);addIdeas(children.map((child,index)=>({...child,id:`${child.id}-${stamp}`,position:{x:0,y:index*120}})));setActiveParentId(idea.id);setMobileColumn("generation");patch({error:undefined});}catch{patch({error:"Could not explore this idea."});}finally{setLoading("expand",false);}};
  const reviewIdeas=async(reviewIds:string[])=>{const reviewSet=reviewIds.map(id=>ideas[id]).filter(Boolean);if(!reviewSet.length)return;setLoading("critique",true);try{const additions=await Promise.all(reviewSet.filter(idea=>!critiques[idea.id]).map(async idea=>[idea.id,await innovationApi.critiqueIdea(idea)] as const));patch({critiques:{...critiques,...Object.fromEntries(additions)},error:undefined});setModalId(reviewSet[0].id);}catch{patch({error:"Review is unavailable right now."});}finally{setLoading("critique",false);}};
  const review=async()=>reviewIdeas(selectedSavedIds);
  const reviewGeneration=async()=>{
    if(!selectedGenerationIds.length)return;
    patch({selectedIds:[...new Set([...selectedIds,...selectedGenerationIds])]});
    setSelectedSavedIds(selectedGenerationIds);
    await reviewIdeas(selectedGenerationIds);
  };
  const combine=async()=>{if(selectedSaved.length<2)return;setLoading("merge",true);try{const merged=await innovationApi.mergeIdeas(selectedSaved);const combined={...merged,score:Math.min(96,Math.round(selectedSaved.reduce((sum,idea)=>sum+(idea.score??70),0)/selectedSaved.length+5)),position:{x:0,y:0}};addIdeas([combined]);patch({selectedIds:[...selectedIds,combined.id],error:undefined});setSelectedSavedIds([combined.id]);setModalId(combined.id);}catch{patch({error:"Could not combine these ideas."});}finally{setLoading("merge",false);}};
  const resolveTradeoff=(idea:StoredIdea)=>{const stamp=Date.now();const revisions:StoredIdea[]=[{...idea,id:`${idea.id}-pilot-${stamp}`,title:`Focused Pilot: ${idea.title}`,description:`Start with one high-value workflow and a measurable pilot before expanding ${idea.title}.`,score:clamp((idea.score??70)+7),generation:idea.generation+1,parentIds:[idea.id],kind:"improved",createdAt:new Date().toISOString(),position:{x:0,y:0},changes:"Reduced scope to one workflow and added measurable pilot criteria."},{...idea,id:`${idea.id}-partner-${stamp}`,title:`Partner-Led ${idea.title}`,description:`Reduce integration risk by delivering the concept with an established technology or channel partner.`,score:clamp((idea.score??70)+5),generation:idea.generation+1,parentIds:[idea.id],kind:"improved",createdAt:new Date().toISOString(),position:{x:0,y:0},changes:"Added an implementation partner to reduce cost and adoption risk."},{...idea,id:`${idea.id}-modular-${stamp}`,title:`Modular ${idea.title}`,description:"Separate the core capability from industry integrations so it can be tested and adapted in stages.",score:clamp((idea.score??70)+4),generation:idea.generation+1,parentIds:[idea.id],kind:"improved",createdAt:new Date().toISOString(),position:{x:0,y:0},changes:"Created a reusable core with optional industry modules."}];addIdeas(revisions);setRevisedIds(current=>({...current,[idea.id]:revisions.map(item=>item.id)}));};
  const improve=()=>{if(selectedSaved.length===1){resolveTradeoff(selectedSaved[0]);setModalId(selectedSaved[0].id);}};
  const develop=(idea:StoredIdea)=>{setExecutionIds(current=>current.includes(idea.id)?current:[...current,idea.id]);setActiveExecutionId(idea.id);setProgress(current=>({...current,[idea.id]:current[idea.id]??"Planning"}));setMobileColumn("execution");setWorkspacePage("execution");};
  const makeDeliverable=(idea:StoredIdea)=>{const copy=`${deliverableType}: ${idea.title}\n\nProblem\n${idea.description}\n\nProposed solution\nBuild a focused version for one high-value workflow.\n\nTarget users\nTeams operating in ${idea.industry}.\n\nTechnical approach\nWeb interface, secure API, analytics layer, and one representative data integration.\n\nLibraries and repositories\nNo libraries verified yet. Confirm choices during technical discovery.\n\nMain risks\nIntegration complexity, data quality, privacy, and adoption.\n\nSmallest feasible prototype\nOne complete workflow for a small pilot group.\n\nTesting approach\nCompare task time, error rate, and user confidence against the current process.\n\nNext steps\nInterview users, prototype the workflow, connect one data source, and run a two-week pilot.`;setDeliverables(current=>({...current,[idea.id]:copy}));};
  const modalScores=modalIdea?scoreData(modalIdea):[];
  const modalCritique=modalIdea?critiques[modalIdea.id]:undefined;
  const initialOverall=modalScores.length?Math.round(modalScores.reduce((sum,item)=>sum+item.beforeScore,0)/modalScores.length):0;
  const revisedOverall=modalScores.length?Math.round(modalScores.reduce((sum,item)=>sum+item.score,0)/modalScores.length):0;
  useEffect(()=>{
    if(!resizingReview)return;
    const move=(event:PointerEvent)=>{
      const rect=reviewSplitRef.current?.getBoundingClientRect();
      if(!rect)return;
      setReviewPaneWidth(Math.max(35,Math.min(65,((event.clientX-rect.left)/rect.width)*100)));
    };
    const stop=()=>setResizingReview(false);
    window.addEventListener("pointermove",move);
    window.addEventListener("pointerup",stop);
    return()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",stop);};
  },[resizingReview]);
  useEffect(()=>{
    if(!resizingIdeaPanels)return;
    const move=(event:PointerEvent)=>{
      const rect=ideaGridRef.current?.getBoundingClientRect();
      if(!rect)return;
      const evaluationPercent=100-((event.clientX-rect.left)/rect.width)*100;
      setEvaluationWidth(Math.max(28,Math.min(62,evaluationPercent)));
    };
    const stop=()=>setResizingIdeaPanels(false);
    window.addEventListener("pointermove",move);
    window.addEventListener("pointerup",stop);
    return()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",stop);};
  },[resizingIdeaPanels]);
  return <div className="pipeline-workspace">
    <nav className="workspace-switcher" aria-label="Workspace pages"><button className={workspacePage==="ideas"?"active":""} onClick={()=>setWorkspacePage("ideas")}><Lightbulb/><span><b>Ideas workspace</b><small>Generate + evaluate</small></span></button><button className={workspacePage==="execution"?"active":""} onClick={()=>setWorkspacePage("execution")}><Beaker/><span><b>Idea execution</b><small>{execution.length?`${execution.length} project${execution.length===1?"":"s"}`:"Develop an idea first"}</small></span></button></nav>
    <div ref={ideaGridRef} className={`pipeline-grid ${workspacePage==="ideas"?"ideas-page":"execution-page"}`} style={workspacePage==="ideas"?{gridTemplateColumns:`minmax(0,${100-evaluationWidth}fr) 12px minmax(260px,${evaluationWidth}fr)`}:undefined}>
      <section className={`pipeline-column generation-column ${mobileColumn==="generation"?"mobile-active":""}`}><header className="column-head"><span>01</span><div><h1>Idea Generation</h1><p>Explore directions and select as many as you want.</p></div></header><form className="proposal-input" onSubmit={event=>{event.preventDefault();void addProposalDirection();}}><div><span>BUILD ON YOUR PROPOSAL</span><strong>Add another question, constraint, or direction</strong></div><div className="proposal-input-row"><input value={proposalInput} onChange={event=>setProposalInput(event.target.value)} placeholder="e.g. Make it useful for small hospitals…" aria-label="Add to your idea proposal"/><button disabled={!proposalInput.trim()||loading.discover}>{loading.discover?<LoaderCircle className="spin"/>:<Plus/>}Add ideas</button></div></form><div className="generation-prompt"><span>Choose several ideas to compare together</span><button onClick={()=>patch({mode:"empty"})}>Start over</button></div><nav className="branch-path" aria-label="Exploration path"><button onClick={()=>setActiveParentId(undefined)}>Ideas</button>{path.map(idea=><span key={idea.id}><ChevronRight/><button onClick={()=>setActiveParentId(idea.id)}>{idea.title}</button></span>)}</nav><div className="branch-actions">{activeParentId&&<button onClick={()=>setActiveParentId(ideas[activeParentId]?.parentIds[0])}><ArrowLeft/>Back</button>}{activeParentId&&<button onClick={()=>void explore(ideas[activeParentId],true)}><Sparkles/>Regenerate</button>}</div>{selectedGenerationIds.length>0&&<div className="generation-selection-bar"><div><strong>{selectedGenerationIds.length}</strong><span>ideas selected</span></div><button onClick={()=>setSelectedGenerationIds([])}>Clear</button><button onClick={addGenerationToEvaluation}>Add to evaluation</button><button className="primary" onClick={()=>void reviewGeneration()}>Review selected</button></div>}{loading.expand?<div className="column-loading"><LoaderCircle className="spin"/>Evaluating ideas…</div>:<div className="pipeline-card-list">{visible.map((idea,index)=>{const isChosen=selectedGenerationIds.includes(idea.id);return <article className={`pipeline-idea-card ${index===0?"top-ranked":""} ${isChosen?"selected":""}`} key={idea.id}><label className="idea-selector"><input type="checkbox" checked={isChosen} onChange={()=>toggleGeneration(idea.id)}/><span>{isChosen?"Selected":"Select"}</span></label><button className={`score-pill score-tile ${scoreToneClass(idea.score)}`} onClick={()=>setModalId(idea.id)}><strong>{idea.score??"—"}</strong><small>OUT OF 100</small></button><h2>{idea.title}</h2><p>{idea.description}</p><footer><button onClick={()=>void explore(idea)}><GitBranch/>Explore</button><button className={selectedIds.includes(idea.id)?"saved":""} onClick={()=>toggleSaved(idea.id)}>{selectedIds.includes(idea.id)?"Saved":"Save"}</button></footer></article>})}</div>}</section>
      <button className="idea-panel-resizer" role="separator" aria-label="Resize Idea Evaluation panel" aria-valuemin={28} aria-valuemax={62} aria-valuenow={Math.round(evaluationWidth)} onPointerDown={()=>setResizingIdeaPanels(true)} onKeyDown={event=>{if(event.key==="ArrowLeft")setEvaluationWidth(value=>Math.min(62,value+3));if(event.key==="ArrowRight")setEvaluationWidth(value=>Math.max(28,value-3));}}><span/></button>
      <section className={`pipeline-column evaluation-column ${mobileColumn==="evaluation"?"mobile-active":""}`}><header className="column-head"><span>02</span><div><h1>Idea Evaluation</h1><p>Compare, improve, and combine ideas.</p></div><div className="panel-size-actions"><button onClick={()=>setEvaluationWidth(28)} aria-label="Minimize Idea Evaluation"><Minimize2/><span>Min</span></button><button onClick={()=>setEvaluationWidth(62)} aria-label="Maximize Idea Evaluation"><Maximize2/><span>Max</span></button></div></header><div className="column-toolbar"><button onClick={()=>setSelectedSavedIds(saved.map(idea=>idea.id))}>Select all</button><button onClick={()=>setSelectedSavedIds([])}>Clear</button></div><div className="pipeline-card-list saved-pipeline-list">{saved.length?saved.map(idea=><article className="evaluation-card" key={idea.id} onClick={()=>setModalId(idea.id)}><input type="checkbox" checked={selectedSavedIds.includes(idea.id)} onClick={event=>event.stopPropagation()} onChange={()=>toggleSelected(idea.id)}/><div><h2>{idea.title}</h2><p>{idea.description}</p></div><button className={`score-pill score-tile compact ${scoreToneClass(idea.score)}`} onClick={event=>{event.stopPropagation();setModalId(idea.id)}}><strong>{idea.score??"—"}</strong><small>/100</small></button><button className="remove-card" onClick={event=>{event.stopPropagation();toggleSaved(idea.id)}} aria-label={`Remove ${idea.title}`}><X/></button></article>):<div className="column-empty"><Lightbulb/><b>Save ideas to evaluate</b><p>Your strongest directions will stay here.</p></div>}</div><div className="evaluation-actions"><button onClick={()=>void review()} disabled={!selectedSaved.length||loading.critique}>Review</button><button onClick={()=>void combine()} disabled={selectedSaved.length<2||loading.merge}>Combine</button><button onClick={improve} disabled={selectedSaved.length!==1}>Improve</button><button className="primary" onClick={()=>selectedSaved[0]&&develop(selectedSaved[0])} disabled={selectedSaved.length!==1}>Develop</button></div><small className="mock-note">Scores are mock estimates using equal weighting until live agents are connected.</small></section>
      <section className={`pipeline-column execution-column ${mobileColumn==="execution"?"mobile-active":""}`}><header className="column-head"><span>03</span><div><h1>Idea Execution</h1><p>Turn selected ideas into real projects.</p></div></header><div className="execution-list">{execution.length?execution.map(idea=><button className={`execution-card ${activeExecutionId===idea.id?"active":""}`} key={idea.id} onClick={()=>setActiveExecutionId(idea.id)}><span><b>{idea.title}</b><small>{idea.description}</small></span><em>{progress[idea.id]??"Planning"}</em></button>):<div className="column-empty"><Beaker/><b>No projects yet</b><p>Select one evaluated idea and choose Develop.</p></div>}</div>{activeExecution&&<div className="execution-detail"><label>Progress<select value={progress[activeExecution.id]??"Planning"} onChange={event=>setProgress(current=>({...current,[activeExecution.id]:event.target.value}))}><option>Planning</option><option>Building</option><option>Testing</option><option>Completed</option></select></label><label>Deliverable<select value={deliverableType} onChange={event=>setDeliverableType(event.target.value)}><option>Project brief</option><option>Technical prototype plan</option><option>Coding experiment</option></select></label><button className="generate-deliverable" onClick={()=>makeDeliverable(activeExecution)}><FileText/>Generate deliverable</button>{deliverables[activeExecution.id]&&<div className="execution-output"><h3>{deliverableType}</h3><pre>{deliverables[activeExecution.id]}</pre><button onClick={()=>void navigator.clipboard.writeText(deliverables[activeExecution.id])}>Copy</button></div>}</div>}</section>
    </div>
    {modalIdea&&<div className="evaluation-modal-backdrop" onClick={()=>setModalId(undefined)}>
      <section className="evaluation-modal review-workspace" role="dialog" aria-modal="true" aria-label={`${modalIdea.title} evaluation`} onClick={event=>event.stopPropagation()}>
        <header><div><span>MOCK EVALUATION · EQUAL WEIGHTS</span><h2>{modalIdea.title}</h2><p>{modalIdea.description}</p></div><button onClick={()=>setModalId(undefined)} aria-label="Close evaluation"><X/></button></header>
        <div className="review-split" ref={reviewSplitRef} style={{gridTemplateColumns:`${reviewPaneWidth}% 10px minmax(0,1fr)`}}>
          <section className="review-score-pane">
            <div className="review-score-hero">
              <div className="score-ring" style={{background:`conic-gradient(#6857e5 ${revisedOverall*3.6}deg,#e7e5f4 0deg)`}}><div><strong>{revisedOverall}</strong><span>/100</span></div></div>
              <div><span>REVISED COUNCIL VIEW</span><h3>{scoreLabel(revisedOverall)}</h3><p><b>{initialOverall}</b> initial → <b>{revisedOverall}</b> after agent negotiation.</p><small>Exact equal-weight average of the four revised mock evaluations.</small></div>
            </div>
            <div className="score-rubric"><span><b>80–100</b> Strong</span><span><b>70–79</b> Promising</span><span><b>60–69</b> Needs testing</span><span><b>&lt;60</b> Do not advance</span></div>
            <div className="score-comparison colorful-scores">{modalScores.map((item,index)=><article className={`score-tone-${index+1}`} key={item.name}>
              <div><span className="score-number">0{index+1}</span><div><b>{item.name}</b><em>{scoreLabel(item.score)}</em></div><strong className="score-shift"><small>{item.beforeScore}</small><span>→</span>{item.score}</strong></div>
              <div className="dual-score-track"><i style={{width:`${item.beforeScore}%`}}/><b style={{width:`${item.score}%`}}/></div><p>{item.explanation}</p><small className="score-evidence">{item.evidence}</small>
            </article>)}</div>
          </section>
          <button className="review-resizer" role="separator" aria-label="Resize evaluation panels" aria-valuemin={35} aria-valuemax={65} aria-valuenow={Math.round(reviewPaneWidth)} onPointerDown={()=>setResizingReview(true)} onKeyDown={event=>{if(event.key==="ArrowLeft")setReviewPaneWidth(value=>Math.max(35,value-3));if(event.key==="ArrowRight")setReviewPaneWidth(value=>Math.min(65,value+3));}}><span/></button>
          <section className="review-insight-pane">
            <div className="insight-kicker"><Zap/><span>WHEN AI AGENTS DISAGREE</span></div>
            <div className="modal-tradeoff"><span>MAIN TRADEOFF</span><h3>Market urgency versus deployment confidence</h3><p>The Market Agent wants to move quickly, while the Technical Agent objects to a broad real-time rollout. The council advances only a bounded, measurable pilot.</p></div>
            <section className="agent-debate" aria-label="Agent Discussion">
              <header><div><Bot/><span><b>Agent Discussion</b><small>Live-style mock debate · 3 turns</small></span></div><em>OPEN</em></header>
              <div className="debate-turn objection"><span className="debate-avatar">TF</span><div><strong>Technical Feasibility Agent <small>OBJECTS</small></strong><p>{modalCritique?.evaluations[0].summary??"A broad real-time rollout depends on heterogeneous hardware, uncertain latency, and costly integrations. I cannot recommend launch at this scope."}</p><footer>Initial feasibility: {modalScores[0]?.beforeScore} · Needs testing</footer></div></div>
              <div className="debate-connector"><span>CHALLENGED BY</span></div>
              <div className="debate-turn proposal"><span className="debate-avatar">MO</span><div><strong>Market Opportunity Agent <small>COUNTERPROPOSES</small></strong><p>{modalCritique?.evaluations[1].summary??"Keep the customer value, but narrow the first release to one paid pilot, one supported device profile, and three measurable outcomes."}</p><footer>Protects demand signal while reducing technical exposure</footer></div></div>
              <div className="debate-connector"><span>COUNCIL SYNTHESIS</span></div>
              <div className="debate-turn resolution"><span className="debate-avatar">RC</span><div><strong>Council Recommendation <small>CHANGED</small></strong><p>{modalCritique?.conflicts[0]?.resolution??"Do not approve a broad launch. Advance a 90-day offline-capable pilot on certified infrastructure, then reevaluate against latency, adoption, and cost thresholds."}</p><footer><b>{initialOverall} → {revisedOverall}</b> after the deployment strategy changed</footer></div></div>
            </section>
            {revisedIds[modalIdea.id]?.length>0&&<div className="modal-revisions"><h3>Improved versions</h3>{revisedIds[modalIdea.id].map(id=>ideas[id]).filter(Boolean).map(revised=><article key={revised.id}><b>{revised.title}</b><p>{revised.description}</p><div className="what-changed"><strong>What Changed?</strong><span>{revised.changes}</span></div><footer><button onClick={()=>{void explore(revised);setModalId(undefined)}}>Explore</button><button onClick={()=>toggleSaved(revised.id)}>{selectedIds.includes(revised.id)?"Saved":"Save"}</button><button className="develop-revision" onClick={()=>{develop(revised);setModalId(undefined)}}>Build Research Brief</button></footer></article>)}</div>}
            <div className="action-explainer"><div><Sparkles/><span><b>Improve & Re-evaluate</b><small>Agents propose targeted fixes, then score the revised idea again.</small></span></div><div><FileText/><span><b>Build Research Brief</b><small>Create feasibility, risks, evidence gaps, and next steps.</small></span></div></div>
            <footer className="modal-actions"><button onClick={()=>{void explore(modalIdea);setModalId(undefined)}}>Explore Variations</button><button onClick={()=>resolveTradeoff(modalIdea)}>Improve & Re-evaluate</button><button onClick={()=>toggleSaved(modalIdea.id)}>{selectedIds.includes(modalIdea.id)?"Saved":"Save Idea"}</button><button className="develop-action" onClick={()=>{develop(modalIdea);setModalId(undefined)}}>{modalIdea.kind==="merged"?"Build Combined Brief":"Build Research Brief"}</button><button className="quiet" onClick={()=>setModalId(undefined)}>Close</button></footer>
          </section>
        </div>
      </section>
    </div>}
    {useSwarm.getState().error&&<div className="toast"><Zap/> {useSwarm.getState().error}<button onClick={()=>patch({error:undefined})}><X/></button></div>}
  </div>;
}

function CanvasMode(){return <div className="canvas-mode"><IdeasListWorkspace/></div>}

export default function InnovationApp(){
  const mode=useSwarm(s=>s.mode);
  useEffect(()=>{
    try{
      const saved=localStorage.getItem("innovation-swarm-demo");
      if(saved) useSwarm.getState().set(JSON.parse(saved));
    }catch{/* Ignore invalid local demo state. */}
    const unsubscribe=useSwarm.subscribe((state)=>{
      const {mode,ideas,discovery,selectedIds,critiques,expandedIds,leftOpen,rightOpen}=state;
      localStorage.setItem("innovation-swarm-demo",JSON.stringify({mode,ideas,discovery,selectedIds,critiques,expandedIds,leftOpen,rightOpen}));
    });
    return unsubscribe;
  },[]);
  const reset=useSwarm(s=>s.reset);
  return <ReactFlowProvider><div className="app-shell simple-shell"><header className="simple-topbar"><div><span className="brand-mark"><Sparkles size={16}/></span><strong>Research Council</strong></div>{mode!=="empty"&&<button onClick={reset}><Plus size={15}/>New exploration</button>}</header>{mode==="empty"?<EmptyState/>:mode==="discover"?<DiscoveryResults/>:<CanvasMode/>}</div></ReactFlowProvider>
}
