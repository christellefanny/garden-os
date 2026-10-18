"use client";

import {useState,type FormEvent} from "react";
import Dialog from "@/components/ui/Dialog";
import {loadCalendarOptions,localDay,type CalendarOptions} from "@/lib/growing-calendar";

export default function AddTaskButton({userId,onSaved}:{userId:string;onSaved:(options:CalendarOptions)=>void}){
  const [open,setOpen]=useState(false),[title,setTitle]=useState(""),[date,setDate]=useState(localDay),[notes,setNotes]=useState(""),[error,setError]=useState("");
  function save(event:FormEvent){
    event.preventDefault();
    if(!title.trim()){setError("Enter a task to remember.");return;}
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(`${date}T12:00:00`))){setError("Choose a valid due date.");return;}
    try{
      const key=`garden-os-calendar-${userId}`,raw=localStorage.getItem(key);
      if(raw){const saved=JSON.parse(raw);if(!saved||!saved.plants||!saved.tasks||(saved.reminders!==undefined&&!Array.isArray(saved.reminders))||!/^\d{2}-\d{2}$/.test(saved.lastFrost)||!/^\d{2}-\d{2}$/.test(saved.firstFrost))throw new Error("Unreadable calendar");}
      const current=loadCalendarOptions(userId);
      const next={...current,reminders:[...(current.reminders??[]),{id:`custom|${crypto.randomUUID()}`,plantId:"",title:title.trim(),date,notes:notes.trim()}]};
      localStorage.setItem(key,JSON.stringify(next));
      onSaved(next);window.dispatchEvent(new Event("garden-os-data-change"));setOpen(false);
    }catch{setError("Could not save this task. Your existing reminders are unchanged. Please try again.");}
  }
  return <>
    <button type="button" className="seasonal-button add-task-button" onClick={()=>{setTitle("");setNotes("");setDate(localDay());setError("");setOpen(true);}}>+ Add task</button>
    {open&&<Dialog title="Add a task" onClose={()=>setOpen(false)}><form onSubmit={save} className="personal-task-form">
      <p>{userId==="guest"?"Saved in this browser for your next visit. No account or plant needed.":"Save anything you want to remember. Tasks use your existing account synchronization."}</p>
      <label>Task<input required maxLength={200} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Order seeds, clean tools, plan next spring…" className="seasonal-input"/></label>
      <label>Due date<input required type="date" value={date} onChange={e=>setDate(e.target.value)} className="seasonal-input"/></label>
      <label>Notes (optional)<textarea maxLength={1000} rows={3} value={notes} onChange={e=>setNotes(e.target.value)} className="seasonal-input"/></label>
      {error&&<p role="alert" className="text-red-800">{error}</p>}
      <div className="personal-task-actions"><button type="button" className="seasonal-outline" onClick={()=>setOpen(false)}>Cancel</button><button type="submit" className="seasonal-button">Save task</button></div>
    </form></Dialog>}
  </>;
}
