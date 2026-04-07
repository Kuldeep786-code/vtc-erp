import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  PlusIcon, ArrowDownTrayIcon, ChatBubbleLeftRightIcon, 
  CalendarIcon, ExclamationTriangleIcon, CheckCircleIcon 
} from '@heroicons/react/24/outline';

export default function AMCManagement() {
  const [amcs, setAmcs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    customer_name: '', contact_number: '', contract_no: '',
    amc_start_date: new Date().toISOString().split('T')[0],
    total_amount: 0, amount_received: 0
  });

  useEffect(() => { fetchAMCs(); }, []);

  const fetchAMCs = async () => {
    setLoading(true);
    const { data } = await supabase.from('customers_amc').select('*').order('amc_end_date', { ascending: true });
    if (data) setAmcs(data);
    setLoading(false);
  };

  const calculateEndDate = (startDate) => {
    const d = new Date(startDate);
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  const sendWhatsApp = (amc) => {
    const companyPhone = "9540942190";
    const msg = `*VTC Lifts & Escalators AMC Reminder*\n\nDear ${amc.customer_name},\nYour AMC (No: ${amc.contract_no}) is expiring on *${amc.amc_end_date}*.\n\nPlease renew to ensure uninterrupted service. Contact: ${companyPhone}`;
    window.open(`https://wa.me/91${amc.contact_number}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const saveAMC = async (e) => {
    e.preventDefault();
    const endDate = calculateEndDate(formData.amc_start_date);
    const { error } = await supabase.from('customers_amc').insert([{
      ...formData, amc_end_date: endDate, status: 'Active'
    }]);
    if (!error) { setShowForm(false); fetchAMCs(); alert("AMC Contract Saved!"); }
  };

  const getStatusStyle = (endDate) => {
    const diff = (new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return "bg-red-100 text-red-700 border-red-200";
    if (diff < 30) return "bg-yellow-100 text-yellow-700 border-yellow-200 animate-pulse";
    return "bg-green-100 text-green-700 border-green-200";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-navy">AMC & Service Contracts</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Maintenance Management System</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-navy text-white px-6 py-2 rounded-xl font-black flex items-center gap-2 shadow-lg hover:scale-105 transition-all">
          <PlusIcon className="w-5 h-5" /> {showForm ? 'CLOSE' : 'NEW CONTRACT'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={saveAMC} className="bg-white p-8 rounded-3xl border-2 border-gray-100 shadow-2xl space-y-6 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Customer Name</label>
              <input type="text" value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} className="w-full border-2 rounded-xl p-3 font-bold" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Contract Number</label>
              <input type="text" value={formData.contract_no} onChange={e => setFormData({...formData, contract_no: e.target.value})} className="w-full border-2 rounded-xl p-3 font-bold" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Contact Number</label>
              <input type="tel" value={formData.contact_number} onChange={e => setFormData({...formData, contact_number: e.target.value})} className="w-full border-2 rounded-xl p-3 font-bold" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Start Date</label>
              <input type="date" value={formData.amc_start_date} onChange={e => setFormData({...formData, amc_start_date: e.target.value})} className="w-full border-2 rounded-xl p-3 font-bold" />
            </div>
            <div className="bg-gold/5 p-3 rounded-xl border border-gold/20">
              <label className="text-[10px] font-black text-gold uppercase">Auto-Expiry Date</label>
              <div className="text-lg font-black text-navy">{calculateEndDate(formData.amc_start_date)}</div>
            </div>
          </div>
          <button type="submit" className="w-full bg-gold text-white font-black py-4 rounded-2xl shadow-xl hover:bg-yellow-600 transition-all">
            ACTIVATE CONTRACT
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-full"><CheckCircleIcon className="w-6 h-6 text-green-600" /></div>
          <div><div className="text-2xl font-black text-navy">{amcs.length}</div><div className="text-xs font-bold text-gray-400">TOTAL AMCS</div></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-full animate-pulse"><ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" /></div>
          <div><div className="text-2xl font-black text-yellow-600">{amcs.filter(a => (new Date(a.amc_end_date) - new Date()) / 86400000 < 30).length}</div><div className="text-xs font-bold text-gray-400">EXPIRING SOON</div></div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-navy text-white text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="p-5">Customer / Contract</th>
                <th className="p-5">Start Date</th>
                <th className="p-5">End Date</th>
                <th className="p-5">Balance</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {amcs.map(amc => (
                <tr key={amc.id} className="hover:bg-gray-50 transition-all">
                  <td className="p-5">
                    <div className="font-black text-navy">{amc.customer_name}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">{amc.contract_no}</div>
                  </td>
                  <td className="p-5 text-sm font-bold text-gray-500">{amc.amc_start_date}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-black border ${getStatusStyle(amc.amc_end_date)}`}>
                      {amc.amc_end_date}
                    </span>
                  </td>
                  <td className="p-5 font-black text-navy">₹ {amc.balance?.toLocaleString('en-IN')}</td>
                  <td className="p-5 text-right">
                    <button onClick={() => sendWhatsApp(amc)} className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-all" title="WhatsApp Reminder">
                      <ChatBubbleLeftRightIcon className="w-6 h-6" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}