"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Background, Controls, MarkerType, MiniMap, ReactFlow, ReactFlowProvider, useReactFlow, type Node, type NodeChange, applyNodeChanges } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Activity, ArrowLeft, Beaker, Bot, BrainCircuit, ChevronLeft, ChevronRight, CirclePlus, Command, FileText, GitBranch, GitMerge, Home, Lightbulb, LoaderCircle, Menu, Moon, PanelRightClose, Plus, Search, Send, Sparkles, Target, X, Zap } from "lucide-react";
import { IdeaNodeCard } from "./IdeaNodeCard";
import { useSwarm, type StoredIdea } from "@/lib/store";
import { innovationApi } from "@/lib/api/innovation";
import type { AgentEvaluation, DiscoveryIdea, IdeaNode } from "@/lib/types/innovation";

const nodeTypes = { idea: IdeaNodeCard };
const examples = ["Privacy and cybersecurity", "Emerging AI technologies", "Sustainable energy", "Healthcare innovation"];
const kindLabels = { root: "Seed", variation: "Variation", merged: "Merged", improved: "Improved" };

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
  const [detailsId,setDetailsId]=useState<string|undefined>();
  const [combinedId,setCombinedId]=useState<string|undefined>();
  const [reviewIds,setReviewIds]=useState<string[]>([]);
  const [briefId,setBriefId]=useState<string|undefined>();
  const [revisedIds,setRevisedIds]=useState<Record<string,string[]>>({});
  const [humanNotes,setHumanNotes]=useState<Record<string,string>>({});
  const allIdeas=Object.values(ideas);
  const roots=allIdeas.filter(idea=>idea.kind==="root"&&idea.parentIds.length===0).sort((a,b)=>new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime());
  const visible=activeParentId?allIdeas.filter(idea=>idea.parentIds.includes(activeParentId)):roots;
  const saved=selectedIds.map(id=>ideas[id]).filter(Boolean);
  const selectedSaved=selectedSavedIds.map(id=>ideas[id]).filter(Boolean);
  const combined=combinedId?ideas[combinedId]:undefined;
  const briefIdea=briefId?ideas[briefId]:undefined;
  const setLoading=(key:keyof typeof loading,value:boolean)=>patch({loading:{...useSwarm.getState().loading,[key]:value}});
  const path=useMemo(()=>{const result:StoredIdea[]=[];let current=activeParentId?ideas[activeParentId]:undefined;const seen=new Set<string>();while(current&&!seen.has(current.id)){seen.add(current.id);result.unshift(current);current=current.parentIds[0]?ideas[current.parentIds[0]]:undefined;}return result;},[activeParentId,ideas]);
  const toggleSaved=(id:string)=>patch({selectedIds:selectedIds.includes(id)?selectedIds.filter(current=>current!==id):[...selectedIds,id]});
  const toggleSelected=(id:string)=>setSelectedSavedIds(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);
  const explore=async(idea:StoredIdea)=>{const existing=allIdeas.filter(item=>item.parentIds.includes(idea.id));if(existing.length){setActiveParentId(idea.id);return;}setLoading("expand",true);try{const children=await innovationApi.expandIdea(idea,7);addIdeas(children.map((child,index)=>({...child,position:{x:0,y:index*120}})));setActiveParentId(idea.id);patch({error:undefined});}catch{patch({error:"Could not explore this idea."});}finally{setLoading("expand",false);}};
  const combine=async()=>{if(selectedSaved.length<2)return;setLoading("merge",true);try{const merged=await innovationApi.mergeIdeas(selectedSaved);addIdeas([{...merged,position:{x:0,y:0}}]);setCombinedId(merged.id);patch({error:undefined});}catch{patch({error:"Could not combine these ideas."});}finally{setLoading("merge",false);}};
  const review=async()=>{if(!selectedSaved.length)return;setLoading("critique",true);try{const additions=await Promise.all(selectedSaved.filter(idea=>!critiques[idea.id]).map(async idea=>[idea.id,await innovationApi.critiqueIdea(idea)] as const));patch({critiques:{...critiques,...Object.fromEntries(additions)},error:undefined});setReviewIds(selectedSaved.map(idea=>idea.id));}catch{patch({error:"Review is unavailable right now."});}finally{setLoading("critique",false);}};
  const develop=async()=>{if(selectedSaved.length!==1)return;const idea=selectedSaved[0];if(!critiques[idea.id]){setLoading("critique",true);try{const result=await innovationApi.critiqueIdea(idea);patch({critiques:{...critiques,[idea.id]:result}});}finally{setLoading("critique",false);}}setBriefId(idea.id);};
  const resolveTradeoff=(idea:StoredIdea)=>{const stamp=Date.now();const revisions:StoredIdea[]=[
    {...idea,id:`${idea.id}-pilot-${stamp}`,title:`Focused Pilot: ${idea.title}`,description:`Start with one high-value workflow, one supported environment, and a measurable pilot before expanding ${idea.title}.`,generation:idea.generation+1,parentIds:[idea.id],kind:"improved",createdAt:new Date().toISOString(),position:{x:0,y:0},changes:"Narrowed the scope to one workflow and added measurable pilot criteria."},
    {...idea,id:`${idea.id}-partner-${stamp}`,title:`Partner-Led ${idea.title}`,description:`Reduce integration risk by delivering ${idea.title} with an established technology or channel partner.`,generation:idea.generation+1,parentIds:[idea.id],kind:"improved",createdAt:new Date().toISOString(),position:{x:0,y:0},changes:"Added an implementation partner to reduce deployment cost and adoption risk."},
    {...idea,id:`${idea.id}-modular-${stamp}`,title:`Modular ${idea.title}`,description:`Separate the core capability from industry-specific integrations so the concept can be tested and adapted in stages.`,generation:idea.generation+1,parentIds:[idea.id],kind:"improved",createdAt:new Date().toISOString(),position:{x:0,y:0},changes:"Reworked the solution into a reusable core with optional industry modules."},
  ];addIdeas(revisions);setRevisedIds(current=>({...current,[idea.id]:revisions.map(item=>item.id)}));};
  const briefMarkdown=briefIdea?`# ${briefIdea.title}\n\n## Problem being solved\n${briefIdea.description}\n\n## Proposed solution\nA focused, testable version of ${briefIdea.title} that addresses the core user workflow.\n\n## Target users\nTeams and frontline users working in ${briefIdea.industry}.\n\n## Technologies needed\nWeb application, secure API, analytics layer, and domain-appropriate data integrations.\n\n## Verified repositories or libraries\nNo libraries verified yet. Confirm technical choices during discovery before treating them as recommendations.\n\n## Main technical risks\nIntegration complexity, data quality, privacy, and adoption in the target workflow.\n\n## Smallest working prototype (MVP)\nOne end-to-end workflow for a small pilot group, with measurable success criteria.\n\n## Development plan\n1. Interview five target users.\n2. Map the highest-friction workflow.\n3. Build a clickable prototype.\n4. Connect one representative data source.\n5. Run a two-week pilot.\n6. Measure usability and outcome improvement.\n\n## Feasibility experiment\nTest whether users complete the target workflow faster and with fewer errors than the current process.${humanNotes[briefIdea.id]?.trim()?`\n\n## Human input\n${humanNotes[briefIdea.id].trim()}`:""}`:"";
  const downloadBrief=()=>{if(!briefMarkdown||!briefIdea)return;const url=URL.createObjectURL(new Blob([briefMarkdown],{type:"text/markdown"}));const link=document.createElement("a");link.href=url;link.download=`${briefIdea.title.toLowerCase().replace(/\W+/g,"-")}-project-brief.md`;link.click();URL.revokeObjectURL(url);};
  return <div className="explore-workspace">
    <StageProgress stage={briefIdea?4:reviewIds.length?3:saved.length?2:1}/>
    <div className="explore-grid">
      <main className="explore-panel">
        <header className="explore-heading"><span>EXPLORE IDEAS</span><h1>What do you want to explore?</h1><p>Choose a direction, explore variations, and save the ideas worth keeping.</p></header>
        <nav className="branch-path" aria-label="Exploration path"><button onClick={()=>setActiveParentId(undefined)}>All ideas</button>{path.map((idea,index)=><span key={idea.id}><ChevronRight/><button onClick={()=>setActiveParentId(index===path.length-1?idea.id:idea.id)}>{idea.title}</button></span>)}</nav>
        {activeParentId&&<button className="back-branch" onClick={()=>setActiveParentId(ideas[activeParentId]?.parentIds[0])}><ArrowLeft/>Back</button>}
        {loading.expand?<div className="exploring-message"><LoaderCircle className="spin"/><b>Exploring possibilities…</b></div>:<div className="simple-idea-grid">{visible.map(idea=>{const isSaved=selectedIds.includes(idea.id);return <article className={`simple-idea-card ${detailsId===idea.id?"open":""}`} key={idea.id} onClick={()=>setDetailsId(detailsId===idea.id?undefined:idea.id)}><h2>{idea.title}</h2><p>{idea.description}</p>{detailsId===idea.id&&<div className="idea-more"><span>{idea.industry}</span><p>Explore this direction to create seven focused variations across use cases, industries, and technology combinations.</p></div>}<footer><button className="explore-btn" onClick={event=>{event.stopPropagation();void explore(idea)}}><GitBranch/>Explore</button><button className={`save-btn ${isSaved?"saved":""}`} onClick={event=>{event.stopPropagation();toggleSaved(idea.id)}}>{isSaved?"Saved":"Save"}</button></footer></article>})}</div>}
      </main>
      <aside className="saved-panel">
        <div className="saved-heading"><div><span>MY IDEAS</span><h2>Saved Ideas</h2></div><b>{saved.length}</b></div>
        <div className="saved-tools"><button onClick={()=>setSelectedSavedIds(saved.map(idea=>idea.id))} disabled={!saved.length}>Select All</button><button onClick={()=>setSelectedSavedIds([])} disabled={!selectedSavedIds.length}>Clear Selection</button></div>
        <div className="saved-list">{saved.length?saved.map(idea=><label className="saved-card" key={idea.id}><input type="checkbox" checked={selectedSavedIds.includes(idea.id)} onChange={()=>toggleSelected(idea.id)}/><span><b>{idea.title}</b><small>{idea.description}</small></span><button onClick={event=>{event.preventDefault();toggleSaved(idea.id);setSelectedSavedIds(current=>current.filter(id=>id!==idea.id))}} aria-label={`Remove ${idea.title}`}><X/></button></label>):<div className="saved-empty"><Lightbulb/><b>No saved ideas yet</b><p>Save an idea to keep it here while you explore.</p></div>}</div>
        <div className="saved-actions"><button onClick={()=>void combine()} disabled={selectedSaved.length<2||loading.merge}><GitMerge/>Combine</button><button onClick={()=>void review()} disabled={!selectedSaved.length||loading.critique}><Bot/>Review</button><button className="primary" onClick={()=>void develop()} disabled={selectedSaved.length!==1||loading.critique}><FileText/>Develop</button></div>
        <p className="selection-help">{selectedSaved.length?`${selectedSaved.length} selected`:`Select saved ideas to continue.`}</p>
        {selectedSaved.length===1&&<label className="human-note"><span>Your input (optional)</span><textarea value={humanNotes[selectedSaved[0].id]??""} onChange={event=>setHumanNotes(current=>({...current,[selectedSaved[0].id]:event.target.value}))} placeholder="Add context or a direction to consider…"/></label>}
        {combined&&<section className="action-result"><span>COMBINED IDEA</span><h3>{combined.title}</h3><p>{combined.description} The combination connects complementary strengths while keeping the original ideas unchanged.</p><div><button onClick={()=>void explore(combined)}>Explore</button><button onClick={()=>toggleSaved(combined.id)}>{selectedIds.includes(combined.id)?"Saved":"Save"}</button></div></section>}
        {reviewIds.length>0&&<section className="action-result review-result"><div className="mock-label">MOCK EVALUATION · AGENT BACKEND NOT CONNECTED</div><span>TRADEOFF ANALYSIS</span>{reviewIds.map(id=>{const idea=ideas[id];const result=critiques[id];if(!idea||!result)return null;const dimensions=[{name:"Technical Feasibility",label:"Needs Testing",text:result.evaluations[0].summary},{name:"Market Opportunity",label:"Strong",text:result.evaluations[1].summary},{name:"Cisco Strategic Fit",label:"Strong",text:result.evaluations[2].summary},{name:"Technology Horizon",label:"Uncertain",text:result.evaluations[3].summary}];return <article className="tradeoff-card" key={id}><h3>{idea.title}</h3><div className="evaluation-grid">{dimensions.map(dimension=><div key={dimension.name}><header><b>{dimension.name}</b><span className={`rating rating-${dimension.label.toLowerCase().replace(" ","-")}`}>{dimension.label}</span></header><p>{dimension.text}</p></div>)}</div>{result.conflicts[0]&&<div className="main-tradeoff"><span>MAIN TRADEOFF</span><h4>{result.conflicts[0].issue}</h4><p>{result.conflicts[0].perspectives[0].position} However, {result.conflicts[0].perspectives[1].position.toLowerCase()}</p></div>}<details className="agent-discussion"><summary>Agent Discussion</summary><div><b>Objection</b><p>{result.conflicts[0]?.perspectives[0].position}</p><b>Counterproposal</b><p>{result.conflicts[0]?.perspectives[1].position}</p><b>Change in recommendation</b><p>{result.conflicts[0]?.resolution}</p></div></details><button className="resolve-btn" onClick={()=>resolveTradeoff(idea)}><Sparkles/>Resolve Tradeoff</button>{revisedIds[id]?.length>0&&<div className="revised-list"><h4>Revised versions</h4>{revisedIds[id].map(revisedId=>{const revised=ideas[revisedId];if(!revised)return null;return <article key={revised.id}><h5>{revised.title}</h5><p>{revised.description}</p><div className="what-changed"><b>What Changed?</b><p><strong>Original:</strong> {idea.description}</p><p><strong>Revised:</strong> {revised.changes}</p></div><footer><button onClick={()=>void explore(revised)}>Explore</button><button onClick={()=>toggleSaved(revised.id)}>{selectedIds.includes(revised.id)?"Saved":"Save"}</button></footer></article>})}</div>}</article>})}</section>}
        {briefIdea&&<section className="action-result project-brief"><span>PROJECT BRIEF</span><h3>{briefIdea.title}</h3><div className="brief-fields"><b>Problem being solved</b><p>{briefIdea.description}</p><b>Proposed solution</b><p>A focused, testable version of the idea for one important workflow.</p><b>Target users</b><p>Teams and frontline users in {briefIdea.industry}.</p><b>Technologies needed</b><p>Web app, secure API, analytics layer, and domain data integrations.</p><b>Repositories or libraries</b><p>No libraries verified yet. Confirm choices during technical discovery.</p><b>Main technical risks</b><p>Integration complexity, data quality, privacy, and user adoption.</p><b>Smallest working prototype</b><p>One end-to-end workflow for a small pilot group with measurable success criteria.</p><b>Development plan</b><ol><li>Interview target users.</li><li>Map the core workflow.</li><li>Build a clickable prototype.</li><li>Connect one data source.</li><li>Run a two-week pilot.</li></ol><b>Feasibility experiment</b><p>Measure whether users finish the workflow faster and with fewer errors.</p></div><div className="brief-actions"><button onClick={()=>void navigator.clipboard.writeText(briefMarkdown)}>Copy as Markdown</button><button onClick={downloadBrief}>Download</button><button onClick={()=>void explore(briefIdea)}>Continue Exploring</button></div></section>}
      </aside>
    </div>
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
