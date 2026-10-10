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
const examples = ["Discover emerging AI technologies", "What can edge AI be used for?", "Explore new applications of quantum sensing", "Generate climate-tech startup ideas"];
const kindLabels = { root: "Seed", variation: "Variation", merged: "Merged", improved: "Improved" };

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
  return <main className="welcome"><div className="ambient one"/><div className="ambient two"/><div className="demo-pill"><span/> DEMO DATA · NO API KEY REQUIRED</div><div className="hero-icon"><BrainCircuit/></div><h1>Start with your focus.<br/><em>Build what matters.</em></h1><p className="hero-sub">Tell us the technology, problem, or opportunity you want to explore. Your first ideas will stay focused on that input.</p>
    <div className="prompt-card"><div className="prompt-row"><Search size={22}/><textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void submit();}}} placeholder="What topic should this exploration focus on?" aria-label="Exploration prompt"/><button onClick={submit} disabled={!prompt.trim()||loading.discover}>{loading.discover?<LoaderCircle className="spin"/>:<><Sparkles/>Create initial ideas</>}</button></div><div className="prompt-meta"><span><Command size={13}/> Press Enter to begin</span><span>Ideas remain scoped to your prompt</span></div></div>
    <div className="examples"><span>TRY AN EXAMPLE</span><div>{examples.map((example)=><button key={example} onClick={()=>setPrompt(example)}>{example}<ChevronRight/></button>)}</div></div>
    <div className="value-row"><div><GitBranch/><span><b>Explore</b>Branch ideas visually</span></div><div><GitMerge/><span><b>Combine</b>Merge the strongest paths</span></div><div><Bot/><span><b>Evaluate</b>Four expert perspectives</span></div></div>
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
  const {ideas,selectedIds,critiques,expandedIds,loading,addIdeas,set:patch}=useSwarm();
  const [generation,setGeneration]=useState("all");
  const [industry,setIndustry]=useState("all");
  const [sort,setSort]=useState("newest");
  const [focusedId,setFocusedId]=useState<string|undefined>();
  const [humanNotes,setHumanNotes]=useState<Record<string,string>>({});
  const [deliverableType,setDeliverableType]=useState("Research report");
  const [deliverables,setDeliverables]=useState<Record<string,{type:string;summary:string;recommendation:string;humanInput?:string}>>({});
  const allIdeas=Object.values(ideas);
  const roots=allIdeas.filter(idea=>idea.kind==="root"&&idea.parentIds.length===0).sort((a,b)=>new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime());
  const [activeRootId,setActiveRootId]=useState<string|undefined>(()=>roots[0]?.id);
  const activeRoot=ideas[activeRootId??""]??roots[0];
  const belongsToPage=(idea:StoredIdea,rootId:string,visited=new Set<string>()):boolean=>{
    if(idea.id===rootId)return true;
    if(visited.has(idea.id))return false;
    visited.add(idea.id);
    return idea.parentIds.some(parentId=>ideas[parentId]&&belongsToPage(ideas[parentId],rootId,visited));
  };
  const pageIdeas=activeRoot?allIdeas.filter(idea=>belongsToPage(idea,activeRoot.id)):allIdeas;
  const activePageIndex=Math.max(0,roots.findIndex(root=>root.id===activeRoot?.id));
  const industries=Array.from(new Set(pageIdeas.map(idea=>idea.industry))).sort();
  const focused=focusedId?ideas[focusedId]:undefined;
  const critique=focused?critiques[focused.id]:undefined;
  const visible=pageIdeas.filter(idea=>(generation==="all"||idea.generation===Number(generation))&&(industry==="all"||idea.industry===industry)).sort((a,b)=>sort==="score"?(b.score??0)-(a.score??0):sort==="generation"?b.generation-a.generation:new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  const shortlist=selectedIds.map(id=>ideas[id]).filter(Boolean);
  const setLoading=(key:keyof typeof loading,value:boolean)=>patch({loading:{...useSwarm.getState().loading,[key]:value}});
  const toggle=(id:string)=>patch({selectedIds:selectedIds.includes(id)?selectedIds.filter(current=>current!==id):[...selectedIds,id]});
  const expand=async(idea:StoredIdea)=>{if(expandedIds.includes(idea.id))return patch({error:"This idea already has ten variations."});if(allIdeas.length>=60)return patch({error:"Demo limit of 60 ideas reached."});setLoading("expand",true);try{const children=await innovationApi.expandIdea(idea,Math.min(10,60-allIdeas.length));addIdeas(children.map((child,index)=>({...child,position:{x:idea.position.x+360,y:idea.position.y+index*140}})));patch({expandedIds:[...expandedIds,idea.id],error:undefined});}catch{patch({error:"Could not expand this idea."});}finally{setLoading("expand",false);}};
  const merge=async()=>{if(shortlist.length<2)return;setLoading("merge",true);try{const merged=await innovationApi.mergeIdeas(shortlist);addIdeas([{...merged,position:{x:0,y:0}}]);patch({selectedIds:[merged.id],error:undefined});setFocusedId(merged.id);}catch{patch({error:"Could not merge these ideas."});}finally{setLoading("merge",false);}};
  const critiqueIdea=async(idea:StoredIdea)=>{setFocusedId(idea.id);if(critiques[idea.id])return;setLoading("critique",true);try{const result=await innovationApi.critiqueIdea(idea);patch({critiques:{...critiques,[idea.id]:result},error:undefined});}catch{patch({error:"Agent critique is unavailable."});}finally{setLoading("critique",false);}};
  const improve=async()=>{if(!focused)return;setLoading("improve",true);try{const improved=await innovationApi.improveIdea(focused,critiques[focused.id]);const note=humanNotes[focused.id]?.trim();const revised={...improved,changes:note?`${improved.changes??""} Human perspective incorporated: ${note}`:improved.changes,position:{x:0,y:0}};addIdeas([revised]);setFocusedId(improved.id);patch({error:undefined});}catch{patch({error:"Could not improve this idea."});}finally{setLoading("improve",false);}};
  const changePage=(rootId:string)=>{setActiveRootId(rootId);setFocusedId(rootId);setGeneration("all");setIndustry("all");};
  const generateDeliverable=()=>{if(!focused||!critique)return;const note=humanNotes[focused.id]?.trim();setDeliverables(current=>({...current,[focused.id]:{type:deliverableType,summary:`${focused.title} is a focused opportunity with an illustrative overall agent score of ${(critique.evaluations.reduce((sum,item)=>sum+item.score,0)/critique.evaluations.length).toFixed(1)}/10. ${critique.overallSummary}`,recommendation:critique.conflicts[0]?.resolution??critique.evaluations[0]?.recommendations[0]??"Validate the concept with a small evidence-driven pilot.",humanInput:note||undefined}}));};
  return <div className="list-workspace">
    <section className="idea-library">
      <div className="library-title"><div><span>INITIAL IDEA {activePageIndex+1} OF {roots.length}</span><h1>{activeRoot?.title??"Ideas from your prompt"}</h1><p>This page contains only this initial idea and the variations created from it.</p></div><div className="idea-count"><b>{pageIdeas.length}</b><span>Ideas on page</span></div></div>
      <div className="idea-pages"><button onClick={()=>changePage(roots[Math.max(0,activePageIndex-1)]?.id)} disabled={activePageIndex===0} aria-label="Previous initial idea"><ChevronLeft/></button><label><span>INITIAL IDEA PAGE</span><select value={activeRoot?.id??""} onChange={event=>changePage(event.target.value)}>{roots.map((root,index)=><option key={root.id} value={root.id}>{index+1}. {root.title}</option>)}</select></label><span className="page-position">{activePageIndex+1} / {roots.length}</span><button onClick={()=>changePage(roots[Math.min(roots.length-1,activePageIndex+1)]?.id)} disabled={activePageIndex===roots.length-1} aria-label="Next initial idea"><ChevronRight/></button></div>
      <div className="list-controls"><label><span>Generation</span><select value={generation} onChange={e=>setGeneration(e.target.value)}><option value="all">All generations</option>{Array.from(new Set(pageIdeas.map(i=>i.generation))).sort().map(gen=><option key={gen} value={gen}>Generation {gen}</option>)}</select></label><label><span>Industry</span><select value={industry} onChange={e=>setIndustry(e.target.value)}><option value="all">All industries</option>{industries.map(item=><option key={item}>{item}</option>)}</select></label><label><span>Sort by</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Newest first</option><option value="score">Highest score</option><option value="generation">Latest generation</option></select></label></div>
      <div className="idea-list-head"><span>IDEA</span><span>GEN</span><span>SCORE</span><span>ACTIONS</span></div>
      <div className="idea-list">{visible.map((idea,index)=>{const shortlisted=selectedIds.includes(idea.id);return <article className={`idea-row row-${idea.kind} ${focusedId===idea.id?"focused":""}`} key={idea.id}><button className={`shortlist-check ${shortlisted?"checked":""}`} onClick={()=>toggle(idea.id)} aria-label={`${shortlisted?"Remove":"Add"} ${idea.title} ${shortlisted?"from":"to"} shortlist`}>{shortlisted?"✓":"+"}</button><div className="idea-copy" onClick={()=>setFocusedId(idea.id)}><div><span className="idea-sequence">{String(index+1).padStart(2,"0")}</span><b>{idea.title}</b><small>{idea.industry}</small></div><p>{idea.description}</p></div><span className="list-generation">G{idea.generation}</span><span className="list-score">{idea.score??"—"}</span><div className="row-actions"><button className="action-inspect" onClick={()=>setFocusedId(idea.id)} title="View this idea without adding it to the shortlist"><Search/>Inspect</button><button className="action-critique" onClick={()=>void critiqueIdea(idea)} title="Evaluate with four specialist agents"><Bot/>Critique</button><button className="action-expand" onClick={()=>void expand(idea)} disabled={expandedIds.includes(idea.id)||loading.expand} title="Generate ten focused variations"><GitBranch/>{expandedIds.includes(idea.id)?"Expanded":"Expand ×10"}</button></div></article>})}{!visible.length&&<div className="empty-filter"><Search/><b>No ideas match these filters</b><button onClick={()=>{setGeneration("all");setIndustry("all")}}>Clear filters</button></div>}</div>
    </section>
    <aside className="shortlist-panel">
      <div className="shortlist-head"><div><span>MERGE SHORTLIST</span><h2>Good ideas</h2></div><b>{shortlist.length}</b></div>
      <p className="shortlist-help">Add two or more promising ideas. We’ll preserve each original when you merge.</p>
      <div className="shortlist-items">{shortlist.length?shortlist.map((idea,index)=><div className="shortlist-item" key={idea.id}><span>{index+1}</span><button onClick={()=>setFocusedId(idea.id)}><b>{idea.title}</b><small>{idea.industry} · G{idea.generation}</small></button><button className="remove-idea" onClick={()=>toggle(idea.id)} aria-label={`Remove ${idea.title}`}><X/></button></div>):<div className="shortlist-empty"><GitMerge/><b>Your shortlist is empty</b><p>Use the + button beside any idea to prepare a merge.</p></div>}</div>
      <button className="merge-cta" onClick={()=>void merge()} disabled={shortlist.length<2||loading.merge}>{loading.merge?<LoaderCircle className="spin"/>:<GitMerge/>}{shortlist.length<2?`Select ${2-shortlist.length} more idea${2-shortlist.length===1?"":"s"}`:`Merge ${shortlist.length} ideas`}</button>
      <div className="focus-divider"><span>INSPECTED IDEA</span></div>
      {!focused?<div className="focus-empty"><Target/><p>Choose Inspect to see an idea’s details without adding it to your shortlist.</p></div>:<div className="focus-card"><div className={`idea-badge badge-${focused.kind}`}><span>{focused.kind}</span><i>Generation {focused.generation}</i></div><h3>{focused.title}</h3><p>{focused.description}</p><div className="focus-metrics"><span><small>Score</small><b>{focused.score??"—"}</b></span><span><small>Parents</small><b>{focused.parentIds.length}</b></span></div><label className="human-input"><span>YOUR PERSPECTIVE</span><textarea value={humanNotes[focused.id]??""} onChange={event=>setHumanNotes(current=>({...current,[focused.id]:event.target.value}))} placeholder="Add context, concerns, evidence, or a direction for the council to consider…"/><small>Included in improvements and generated deliverables.</small></label>{loading.critique?<div className="analyzing"><LoaderCircle className="spin"/><b>Agents are evaluating with your context…</b></div>:critique?<><p className="overall">{critique.overallSummary}</p><div className="score-chips">{critique.evaluations.map(agent=><span key={agent.agentId}>{agent.agentName.split(" ")[0]} <b>{agent.score}</b></span>)}</div>{critique.conflicts[0]&&<div className="compact-debate"><Zap/><div><b>{critique.conflicts[0].issue}</b><p>{critique.conflicts[0].resolution}</p></div></div>}<button className="improve-btn" onClick={()=>void improve()} disabled={loading.improve}><Sparkles/>Improve with council feedback</button><div className="deliverable-builder"><span>CREATE A DELIVERABLE</span><div><select value={deliverableType} onChange={event=>setDeliverableType(event.target.value)}><option>Research report</option><option>Executive brief</option><option>Experiment plan</option><option>Decision memo</option></select><button onClick={generateDeliverable}><FileText/>Generate</button></div></div>{deliverables[focused.id]&&<article className="deliverable-card"><header><FileText/><div><span>GENERATED {deliverables[focused.id].type.toUpperCase()}</span><b>{focused.title}</b></div></header><h4>Executive summary</h4><p>{deliverables[focused.id].summary}</p><h4>Recommended next move</h4><p>{deliverables[focused.id].recommendation}</p>{deliverables[focused.id].humanInput&&<div><b>Human perspective included</b><p>{deliverables[focused.id].humanInput}</p></div>}</article>}</>:<button className="critique-cta" onClick={()=>void critiqueIdea(focused)}><Bot/>Run four-agent critique</button>}</div>}
    </aside>
    {useSwarm.getState().error&&<div className="toast"><Zap/> {useSwarm.getState().error}<button onClick={()=>patch({error:undefined})}><X/></button></div>}
  </div>;
}

function CanvasMode(){return <div className="canvas-mode"><CanvasHeader/><IdeasListWorkspace/></div>}

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
  return <ReactFlowProvider><div className="app-shell"><AppSidebar/>{mode==="empty"?<EmptyState/>:mode==="discover"?<DiscoveryResults/>:<CanvasMode/>}</div></ReactFlowProvider>
}
