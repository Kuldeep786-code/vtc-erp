import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  PlusIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, 
  PaperClipIcon, DocumentTextIcon, CalculatorIcon 
} from '@heroicons/react/24/outline';

export default function SalesLeads() {
  const [leads, setLeads] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState('');
  const [formData, setFormData] = useState({
    customer_name: '', mobile_number: '', email_id: '', city: '', 
    building_type: '', no_of_floors: 0, lift_model: '', 
    base_price: 760000, capacity_increment: 0, floor_increment: 0,
    attachments: []
  });

  useEffect(() => { fetchLeads(); }, []);

  const fetchLeads = async () => {
    const { data } = await supabase.from('sales_leads').select('*').order('created_at', { ascending: false });
    if (data) setLeads(data);
  };

  const calculatePrice = () => {
    return Number(formData.base_price) + (Number(formData.no_of_floors) * 50000) + Number(formData.capacity_increment);
  };

  const handleExport = () => {
    const headers = Object.keys(leads[0] || {}).join(",");
    const rows = leads.map(l => Object.values(l).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'VTC_Sales_Leads.csv';
    a.click();
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setStatus("Uploading...");
    const uploadedUrls = [];
    for (const file of files) {
      const path = `leads/${Date.now()}_${file.name}`;
      const { data } = await supabase.storage.from('assets').upload(path, file);
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(path);
        uploadedUrls.push(publicUrl);
      }
    }
    setFormData({ ...formData, attachments: uploadedUrls });
    setStatus("Files ready!");
  };

  const saveLead = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('sales_leads').insert([{
      ...formData, total_price: calculatePrice(), status: 'new'
    }]);
    if (!error) { setShowForm(false); fetchLeads(); alert("Lead Saved Successfully!"); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-navy">Sales Lead Management</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="bg-white border px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 shadow-sm transition-all">
            <ArrowDownTrayIcon className="w-4 h-4" /> EXPORT CSV
          </button>
          <button onClick={() => setShowForm(!showForm)} className="bg-navy text-white px-6 py-2 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg hover:scale-105 transition-all">
            <PlusIcon className="w-4 h-4" /> {showForm ? 'CANCEL' : 'NEW LEAD'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={saveLead} className="bg-white p-8 rounded-3xl border-2 border-gray-100 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Name</label>
              <input type="text" value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} className="w-full border-2 border-gray-100 rounded-2xl p-4 focus:border-navy outline-none transition-all font-bold" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile Number</label>
              <input type="tel" value={formData.mobile_number} onChange={e => setFormData({...formData, mobile_number: e.target.value})} className="w-full border-2 border-gray-100 rounded-2xl p-4 focus:border-navy outline-none transition-all font-bold" required />
            </div>
            <div className="bg-navy/5 p-4 rounded-2xl border-2 border-navy/10 flex flex-col justify-center">
              <label className="text-[10px] font-black text-navy uppercase tracking-widest">Estimated Price</label>
              <div className="text-3xl font-black text-navy">₹ {calculatePrice().toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">Document Attachments (Excel/PDF/Word)</label>
            <input type="file" multiple onChange={handleFileUpload} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer bg-white hover:bg-gray-100 px-8 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 flex items-center justify-center gap-3 transition-all font-black shadow-sm">
              <ArrowUpTrayIcon className="w-6 h-6" /> CLICK TO UPLOAD FILES
            </label>
            <div className="mt-2 text-center text-xs text-navy font-black">{status}</div>
          </div>

          <button type="submit" className="w-full bg-navy text-white font-black py-5 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all text-lg">
            SAVE LEAD & LOCK QUOTATION
          </button>
        </form>
      )}

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-navy text-white text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="p-5">Customer</th>
              <th className="p-5">Floors</th>
              <th className="p-5">Quotation</th>
              <th className="p-5">Status</th>
              <th className="p-5">Docs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leads.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-all">
                <td className="p-5 font-black text-navy">{lead.customer_name}</td>
                <td className="p-5 font-bold text-gray-500">{lead.no_of_floors} Floors</td>
                <td className="p-5 font-black text-navy">₹ {lead.total_price?.toLocaleString('en-IN')}</td>
                <td className="p-5"><span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black">{lead.status}</span></td>
                <td className="p-5">
                  <div className="flex gap-2">
                    {lead.attachments?.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="text-navy hover:text-gold"><DocumentTextIcon className="w-5 h-5" /></a>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}