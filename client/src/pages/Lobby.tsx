import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { sounds } from '../lib/sounds';

const API_BASE = '/api';

export default function Lobby() {
  const navigate = useNavigate();
  const { myId, myName, setMyName } = useGameStore();

  const [nameInput, setNameInput] = useState(myName);
  const [roomInput, setRoomInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    sounds.click();
    if (!nameInput.trim()) {
      setError('请先输入昵称');
      return;
    }
    setCreating(true);
    setError('');
    setMyName(nameInput.trim());

    try {
      const res = await fetch(`${API_BASE}/rooms`, { method: 'POST' });
      const data = await res.json();
      navigate(`/room/${data.roomId}`);
    } catch (e) {
      setError('创建房间失败，请重试');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    sounds.click();
    if (!nameInput.trim()) {
      setError('请先输入昵称');
      return;
    }
    if (!roomInput.trim()) {
      setError('请输入房间号');
      return;
    }
    setJoining(true);
    setError('');
    setMyName(nameInput.trim());

    try {
      const res = await fetch(`${API_BASE}/rooms/${roomInput.trim().toUpperCase()}`);
      if (!res.ok) {
        setError('房间不存在');
        return;
      }
      navigate(`/room/${roomInput.trim().toUpperCase()}`);
    } catch (e) {
      setError('加入房间失败，请重试');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#0f172a] via-[#1a1a2e] to-[#16213e]">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="text-7xl mb-3 drop-shadow-lg">♠♥</div>
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 mb-3">德州扑克</h1>
        <p className="text-gray-400 text-sm">与好友一起在线对战</p>
      </div>

      {/* Name input */}
      <div className="w-full max-w-xs mb-6">
        <label className="block text-sm text-gray-300 mb-2 font-medium">你的昵称</label>
        <input
          type="text"
          value={nameInput}
          onChange={e => setNameInput(e.target.value)}
          placeholder="输入昵称..."
          maxLength={12}
          className="w-full bg-slate-800/80 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
        />
      </div>

      {/* Create room */}
      <button
        onClick={handleCreateRoom}
        disabled={creating}
        className="w-full max-w-xs py-4 mb-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold text-xl disabled:opacity-50 transition-all active:scale-95 shadow-xl"
      >
        {creating ? '创建中...' : '创建房间'}
      </button>

      {/* Divider */}
      <div className="flex items-center w-full max-w-xs my-5">
        <div className="flex-1 h-px bg-slate-700" />
        <span className="px-4 text-slate-500 text-sm">或</span>
        <div className="flex-1 h-px bg-slate-700" />
      </div>

      {/* Join room */}
      <div className="w-full max-w-xs mb-2">
        <label className="block text-sm text-gray-300 mb-2 font-medium">房间号</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={roomInput}
            onChange={e => setRoomInput(e.target.value.toUpperCase())}
            placeholder="输入6位房间号"
            maxLength={6}
            className="flex-1 bg-slate-800/80 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all uppercase tracking-widest text-center font-mono text-lg"
          />
          <button
            onClick={handleJoinRoom}
            disabled={joining}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold disabled:opacity-50 transition-all active:scale-95 shadow-lg"
          >
            {joining ? '...' : '加入'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 text-red-400 text-sm bg-red-900/20 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Info */}
      <div className="mt-12 text-center text-slate-600 text-xs">
        <p>Powered by Cloudflare Workers + Durable Objects</p>
      </div>
    </div>
  );
}
