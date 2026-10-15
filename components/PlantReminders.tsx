"use client";
import {useState} from "react";
import type {VaultPlant} from "@/components/PlantVault";
import {localDay, type CalendarOptions} from "@/lib/growing-calendar";
export default function PlantReminders({plant,options,onSave}: {plant:VaultPlant;options:CalendarOptions;onSave:(next:CalendarOptions)=>boolean}) {
  const [title,setTitle]=useState(""),[date,setDate]=useState(""),[message,setMessage]=useState("");
  const reminders=(options.reminders || []).filter(r=>r.plantId===plant.id);
  function add() {
    if(!title.trim() || !date || date<localDay()) {setMessage("Enter a reminder and choose today or a future date.");return;}
    if(onSave({...options,reminders:[...(options.reminders||[]),{id:`custom|${crypto.randomUUID()}`,plantId:plant.id,title:title.trim(),date}]})) {
      setTitle("");setDate("");setMessage("Reminder saved. Phone delivery requires reminders enabled on this device.");
    }
  }
  return <section className="seasonal-outline mt-5 rounded-2xl border p-4">
    <h4 className="seasonal-heading font-bold">Plant reminders</h4>
    <p className="seasonal-muted mt-2 text-xs">Choose a date for the morning phone digest. Enable phone reminders in Growing Calendar once per device to receive it. Saved in this browser.</p>
    <label className="mt-3 block text-sm font-bold">Remind me to<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={200} placeholder="Check germination, repot, plant bulbs…" className="seasonal-input mt-1 w-full rounded-xl border p-3"/></label>
    <label className="mt-3 block text-sm font-bold">Reminder date<input type="date" value={date} onChange={e=>setDate(e.target.value)} className="seasonal-input mt-1 w-full rounded-xl border p-3"/></label>
    <button type="button" onClick={add} className="seasonal-button mt-3 rounded-xl px-4 py-3 font-bold text-white">Add reminder</button>
    {message && <p role="status" className="mt-2 text-sm">{message}</p>}
    <ul className="mt-3 space-y-2">{reminders.map(r=><li key={r.id} className="rounded-xl bg-black/5 p-3 text-sm"><p className="break-words font-bold">{r.title}</p><p>{options.tasks[r.id]?.date || r.date}{options.tasks[r.id]?.status?` · ${options.tasks[r.id].status}`:""}</p><button type="button" className="seasonal-link mt-1 min-h-11 underline" aria-label={`Remove reminder ${r.title}`} onClick={()=>onSave({...options,reminders:(options.reminders||[]).filter(x=>x.id!==r.id)})}>Remove reminder</button></li>)}</ul>
  </section>;
}
