import {useEffect,useState} from 'react'
import{createPortal}from'react-dom'

const API='/api/finance'

export default function FinanceExportLinks(){
 const[host,setHost]=useState(null)
 useEffect(()=>{let stop=false,t;const sync=()=>{if(stop)return;const toolbar=[...document.querySelectorAll('.fop-toolbar')].find(x=>x.querySelector('h3')?.textContent.trim()==='Reports');setHost(toolbar?.querySelector('.fop-actions')||null);t=setTimeout(sync,300)};sync();return()=>{stop=true;clearTimeout(t)}},[])
 if(!host)return null
 return createPortal(<>
  <a className="fop-button" href={`${API}/exports/executive.pdf`} target="_blank" rel="noreferrer">Executive PDF</a>
  <a className="fop-button" href={`${API}/exports/collections.xlsx`}>Collections XLSX</a>
 </>,host)
}
