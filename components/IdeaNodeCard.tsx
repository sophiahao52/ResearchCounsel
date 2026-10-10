import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitMerge, Sparkles, Star } from "lucide-react";
import type { IdeaNode } from "@/lib/types/innovation";
import { useSwarm } from "@/lib/store";

export function IdeaNodeCard({ data, selected }: NodeProps) {
  const idea = data.idea as IdeaNode;
  const selectedIds = useSwarm((state)=>state.selectedIds);
  const patch = useSwarm((state)=>state.set);
  const toggle = () => patch({selectedIds:selectedIds.includes(idea.id)?selectedIds.filter((id)=>id!==idea.id):[...selectedIds,idea.id],rightOpen:true});
  return <div className={`idea-node kind-${idea.kind} ${selected ? "is-selected" : ""}`}>
    <Handle type="target" position={Position.Left} className="node-handle" />
    <div className="node-topline">
      <span className="node-kind">{idea.kind === "merged" ? <GitMerge size={12}/> : idea.kind === "improved" ? <Sparkles size={12}/> : <Star size={11}/>} {idea.kind}</span>
      <span className="node-generation">GEN {idea.generation}</span>
    </div>
    <h3>{idea.title}</h3>
    <p>{idea.description}</p>
    <div className="node-footer"><span>{idea.industry}</span><div>{idea.score && <b>{idea.score}</b>}<button className="node-select nodrag nowheel" title="Add or remove from multi-selection" aria-label={`Toggle ${idea.title}`} onPointerDown={(event)=>event.stopPropagation()} onClick={(event)=>{event.stopPropagation();toggle();}}>+</button></div></div>
    <Handle type="source" position={Position.Right} className="node-handle" />
  </div>;
}
