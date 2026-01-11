import React, { useState, useEffect } from 'react';
import axios from 'axios';

const defaultSettings = {
  examTimeLimit: 60,
  allowRetake: true,
  maxRetake: 2,
  randomizeQuestions: true,
  enableAntiCheat: false,
  emailServer: '',
  enableTabWarning: false,
};

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [status, setStatus] = useState('');

  useEffect(() => {
    axios.get('/api/settings').then(res => setSettings({ ...defaultSettings, ...res.data }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setSettings(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) : value,
      }));
    }
  };

  const handleSave = async () => {
    try {
      await axios.post('/api/settings', settings);
      setStatus('Đã lưu cài đặt!');
    } catch (err: any) {
      setStatus('Lưu cài đặt thất bại: ' + (err?.message || err));
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Cài đặt hệ thống</h1>
      <div className="mb-4">
        <label className="block mb-2 font-semibold">Thời gian làm bài (phút)</label>
        <input type="number" name="examTimeLimit" className="w-full border rounded px-3 py-2" value={settings.examTimeLimit} onChange={handleChange} min={1} />
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-semibold">Cho phép thi lại</label>
        <select name="allowRetake" className="w-full border rounded px-3 py-2" value={settings.allowRetake ? 'yes' : 'no'} onChange={e => setSettings(s => ({ ...s, allowRetake: e.target.value === 'yes' }))}>
          <option value="yes">Có</option>
          <option value="no">Không</option>
        </select>
      </div>
      {settings.allowRetake && (
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Số lần thi lại tối đa</label>
          <input type="number" name="maxRetake" className="w-full border rounded px-3 py-2" value={settings.maxRetake} onChange={handleChange} min={1} />
        </div>
      )}
      <div className="mb-4">
        <label className="block mb-2 font-semibold">Random câu hỏi trong đề</label>
        <input type="checkbox" name="randomizeQuestions" checked={settings.randomizeQuestions} onChange={handleChange} />
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-semibold">Bật chống gian lận (anti-cheat)</label>
        <input type="checkbox" name="enableAntiCheat" checked={settings.enableAntiCheat} onChange={handleChange} />
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-semibold">Bật cảnh báo chuyển tab</label>
        <input type="checkbox" name="enableTabWarning" checked={settings.enableTabWarning} onChange={handleChange} />
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-semibold">Email server (SMTP)</label>
        <input type="text" name="emailServer" className="w-full border rounded px-3 py-2" value={settings.emailServer} onChange={handleChange} />
      </div>
      <button className="px-4 py-2 bg-sky-600 text-white rounded" onClick={handleSave}>Lưu cài đặt</button>
      {status && <div className="mt-4 text-green-600 font-semibold">{status}</div>}
    </div>
  );
};

export default SystemSettings; 