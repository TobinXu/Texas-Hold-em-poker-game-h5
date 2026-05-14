import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { sounds } from '../lib/sounds';

const API_BASE = '/api';

export default function Lobby() {
  const navigate = useNavigate();
  const { myId, setMyId, myName, setMyName } = useGameStore();

  const [nameInput, setNameInput] = useState(myName);
  const [roomInput, setRoomInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const handleSetName = () => {
    if (nameInput.trim()) {
      setMyName(nameInput.trim());
    }
  };

  const handleCreateRoom = async () => {
    sounds.click();
    if (!myName.trim()) {
      setError('请先输入昵称');
      return;
    }
    setCreating(true);
    setError('');

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
    if (!myName.trim()) {
      setError('请先输入昵称');
      return;
    }
    if (!roomInput.trim()) {
      setError('请输入房间号');
      return;
    }
    setJoining(true);
    setError('');

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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="text-6xl mb-2">♠♥</div>
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">德州扑克</h1>
        <p className="text-gray-400 text-sm">与好友一起在线对战</p>
      </div>

      {/* Name input */}
      <div className="w-full max-w-xs mb-6">
        <label className="block text-sm text-gray-400 mb-1">你的昵称</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onBlur={handleSetName}
            placeholder="输入昵称..."
            maxLength={12}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
          />
        </div>
      </div>

      {/* Create room */}
      <button
        onClick={handleCreateRoom}
        disabled={creating}
        className="w-full max-w-xs py-3 mb-4 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold text-lg disabled:opacity-50 transition-all active:scale-95"
      >
        {creating ? '创建中...' : '创建房间'}
      </button>

      {/* Divider */}
      <div className="flex items-center w-full max-w-xs my-4">
        <div className="flex-1 h-px bg-gray-700" />
        <span className="px-3 text-gray-500 text-sm">或</span>
        <div className="flex-1 h-px bg-gray-700" />
      </div>

      {/* Join room */}
      <div className="w-full max-w-xs">
        <label className="block text-sm text-gray-400 mb-1">房间号</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={roomInput}
            onChange={e => setRoomInput(e.target.value.toUpperCase())}
            placeholder="输入6位房间号"
            maxLength={6}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 uppercase tracking-widest text-center font-mono text-lg"
          />
          <button
            onClick={handleJoinRoom}
            disabled={joining}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold disabled:opacity-50 transition-colors active:scale-95"
          >
            {joining ? '...' : '加入'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 text-red-400 text-sm">{error}</div>
      )}

      {/* Info */}
      <div className="mt-10 text-center text-gray-600 text-xs">
        <p>Powered by Cloudflare Workers</p>
      </div>
    </div>
  );
}
