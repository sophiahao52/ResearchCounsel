"use client";

import dynamic from "next/dynamic";
const InnovationApp = dynamic(() => import("@/components/InnovationApp"), { ssr: false });
export default function Page() { return <InnovationApp />; }
