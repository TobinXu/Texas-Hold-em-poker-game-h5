import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { sounds } from '../lib/sounds';

const API_BASE = '/api';

export default function Lobby() {
  const navigate = useNavigate();
  const { myName, setMyName } = useGameStore();

  const [nameInput, setNameInput] = useState(myName);
  const [roomInput, setRoomInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    sounds.click();
    if (!nameInput.trim()) { setError('请输入昵称'); return; }
    setCreating(true); setError(''); setMyName(nameInput.trim());
    try {
      const res = await fetch(`${API_BASE}/rooms`, { method: 'POST' });
      const data = await res.json();
      navigate(`/room/${data.roomId}`);
    } catch { setError('创建失败，请重试'); }
    finally { setCreating(false); }
  };

  const handleJoinRoom = async () => {
    sounds.click();
    if (!nameInput.trim()) { setError('请输入昵称'); return; }
    if (!roomInput.trim()) { setError('请输入房间号'); return; }
    setJoining(true); setError(''); setMyName(nameInput.trim());
    try {
      const res = await fetch(`${API_BASE}/rooms/${roomInput.trim().toUpperCase()}`);
      if (!res.ok) { setError('房间不存在'); return; }
      navigate(`/room/${roomInput.trim().toUpperCase()}`);
    } catch { setError('加入失败，请重试'); }
    finally { setJoining(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5"
      style={{ background: 'linear-gradient(180deg, #1e1e1e 0%, #2a2a2a 50%, #1e1e1e 100%)' }}
    >
      <div className="w-full max-w-[300px]">
        <div className="mb-8 text-center">
          <div className="text-3xl mb-2">♠️</div>
          <h1 className="text-2xl font-black text-white mb-1">德州扑克</h1>
          <p className="text-gray-500 text-xs">与好友一起在线对战</p>
        </div>

        <div className="mb-4">
          <label className="block text-[10px] text-gray-500 mb-1 font-medium uppercase">昵称</label>
          <input
            type="text"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            placeholder="输入昵称..."
            maxLength={12}
            className="w-full px-4 py-3 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm outline-none focus:border-yellow-500/30 transition-colors"
          />
        </div>

        <button
          onClick={handleCreateRoom}
          disabled={creating}
          className="w-full py-3 rounded-lg bg-gradient-to-b from-yellow-500 to-yellow-600 text-black font-bold text-sm disabled:opacity-40 active:scale-[0.97] transition-transform"
        >
          {creating ? '创建中...' : '创建房间'}
        </button>

        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="px-3 text-gray-600 text-xs">或</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        <div className="mb-2">
          <label className="block text-[10px] text-gray-500 mb-1 font-medium uppercase">房间号</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={roomInput}
              onChange={e => setRoomInput(e.target.value.toUpperCase())}
              placeholder="输入6位房间号"
              maxLength={6}
              className="flex-1 px-4 py-3 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm outline-none text-center font-mono tracking-[0.2em] uppercase focus:border-yellow-500/30 transition-colors"
            />
            <button
              onClick={handleJoinRoom}
              disabled={joining}
              className="px-5 py-3 rounded-lg bg-gradient-to-b from-blue-500 to-blue-600 text-white font-bold text-sm disabled:opacity-40 active:scale-95 transition-transform"
            >
              {joining ? '...' : '加入'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 px-4 py-2 rounded-lg text-red-300 text-xs text-center bg-red-500/5 border border-red-500/10">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
