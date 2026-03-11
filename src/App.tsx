/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Timer, 
  Hash, 
  Brain,
  Gamepad2,
  ChevronRight
} from 'lucide-react';

// --- Types ---

type CardData = {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
};

type Difficulty = {
  label: string;
  rows: number;
  cols: number;
  icon: string;
};

const DIFFICULTIES: Difficulty[] = [
  { label: '簡單', rows: 3, cols: 4, icon: '🌱' },
  { label: '中等', rows: 4, cols: 4, icon: '🧠' },
  { label: '困難', rows: 4, cols: 5, icon: '🔥' },
];

const CARD_VALUES = [
  '🍎', '🍌', '🍇', '🍓', '🍒', '🍍', '🥝', '🍉', 
  '🥑', '🥦', '🥕', '🌽', '🍄', '🍔', '🍕', '🍦',
  '🍩', '🍪', '🍫', '🍭', '🎨', '🎭', '🎸', '🎮'
];

// --- Components ---

const Card = ({ card, onClick }: { card: CardData; onClick: () => void }) => {
  return (
    <div 
      className="relative aspect-[3/4] cursor-pointer perspective-1000"
      onClick={onClick}
    >
      <motion.div
        className="w-full h-full relative preserve-3d transition-transform duration-500"
        initial={false}
        animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
      >
        {/* Front Side (Back of Card) */}
        <div className="absolute inset-0 w-full h-full backface-hidden bg-zinc-800 border-2 border-zinc-700 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
          <div className="w-full h-full opacity-10 flex flex-wrap gap-1 p-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <Brain key={i} size={16} />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
                <Gamepad2 className="text-zinc-500" size={24} />
             </div>
          </div>
        </div>

        {/* Back Side (Value of Card) */}
        <div 
          className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 border-2 rounded-xl flex items-center justify-center shadow-xl text-4xl sm:text-5xl
            ${card.isMatched ? 'bg-emerald-500/20 border-emerald-500' : 'bg-white border-zinc-200'}
          `}
        >
          <span className={card.isMatched ? 'opacity-50 grayscale-[0.5]' : ''}>
            {card.value}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTIES[1]);
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isWon, setIsWon] = useState(false);

  // Initialize Game
  const initGame = useCallback((diff: Difficulty) => {
    const totalCards = diff.rows * diff.cols;
    const pairsCount = totalCards / 2;
    const selectedValues = [...CARD_VALUES].sort(() => Math.random() - 0.5).slice(0, pairsCount);
    const gameValues = [...selectedValues, ...selectedValues].sort(() => Math.random() - 0.5);

    const newCards = gameValues.map((value, index) => ({
      id: index,
      value,
      isFlipped: false,
      isMatched: false,
    }));

    setCards(newCards);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setSeconds(0);
    setIsActive(false);
    setIsWon(false);
  }, []);

  useEffect(() => {
    initGame(difficulty);
  }, [difficulty, initGame]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && !isWon) {
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isWon]);

  const handleCardClick = (index: number) => {
    // Prevent clicking if already flipped, matched, or two cards are already flipped
    if (
      cards[index].isFlipped || 
      cards[index].isMatched || 
      flippedIndices.length === 2 ||
      isWon
    ) return;

    if (!isActive) setIsActive(true);

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      const [firstIndex, secondIndex] = newFlipped;

      if (newCards[firstIndex].value === newCards[secondIndex].value) {
        // Match found
        setTimeout(() => {
          const matchedCards = [...newCards];
          matchedCards[firstIndex].isMatched = true;
          matchedCards[secondIndex].isMatched = true;
          setCards(matchedCards);
          setFlippedIndices([]);
          setMatches(prev => {
            const nextMatches = prev + 1;
            if (nextMatches === (difficulty.rows * difficulty.cols) / 2) {
              setIsWon(true);
            }
            return nextMatches;
          });
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[firstIndex].isFlipped = false;
          resetCards[secondIndex].isFlipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 sm:p-8 selection:bg-emerald-500 selection:text-white">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-emerald-500 mb-2">
              <Brain size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">記憶挑戰</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tighter uppercase italic">
              記憶<br />大師
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff.label}
                onClick={() => setDifficulty(diff)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2
                  ${difficulty.label === diff.label 
                    ? 'bg-emerald-500 text-zinc-950 scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'}
                `}
              >
                <span>{diff.icon}</span>
                {diff.label}
              </button>
            ))}
          </div>
        </header>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">
              <Timer size={14} />
              時間
            </div>
            <div className="text-2xl font-mono font-bold text-emerald-400">
              {formatTime(seconds)}
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">
              <Hash size={14} />
              步數
            </div>
            <div className="text-2xl font-mono font-bold text-emerald-400">
              {moves}
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">
              <Trophy size={14} />
              配對
            </div>
            <div className="text-2xl font-mono font-bold text-emerald-400">
              {matches} / {(difficulty.rows * difficulty.cols) / 2}
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div 
          className="grid gap-3 sm:gap-4 mb-12"
          style={{ 
            gridTemplateColumns: `repeat(${difficulty.cols}, minmax(0, 1fr))` 
          }}
        >
          {cards.map((card, index) => (
            <Card 
              key={card.id} 
              card={card} 
              onClick={() => handleCardClick(index)} 
            />
          ))}
        </div>

        {/* Footer Controls */}
        <div className="flex justify-center">
          <button
            onClick={() => initGame(difficulty)}
            className="group flex items-center gap-3 bg-zinc-100 text-zinc-950 px-8 py-4 rounded-full font-black uppercase tracking-tighter hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
          >
            <RotateCcw size={20} className="group-hover:rotate-[-45deg] transition-transform" />
            重置遊戲
          </button>
        </div>

        {/* Win Modal */}
        <AnimatePresence>
          {isWon && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 p-8 sm:p-12 rounded-[2rem] max-w-md w-full text-center shadow-2xl"
              >
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                  <Trophy size={48} className="text-zinc-950" />
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter italic mb-2">
                  太棒了！
                </h2>
                <p className="text-zinc-400 mb-8">
                  你在 <span className="text-emerald-400 font-bold">{formatTime(seconds)}</span> 內完成了所有配對，總共用了 <span className="text-emerald-400 font-bold">{moves}</span> 步。
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-zinc-800/50 p-4 rounded-2xl">
                    <div className="text-xs text-zinc-500 uppercase font-bold mb-1">時間</div>
                    <div className="text-xl font-mono font-bold">{formatTime(seconds)}</div>
                  </div>
                  <div className="bg-zinc-800/50 p-4 rounded-2xl">
                    <div className="text-xs text-zinc-500 uppercase font-bold mb-1">步數</div>
                    <div className="text-xl font-mono font-bold">{moves}</div>
                  </div>
                </div>

                <button
                  onClick={() => initGame(difficulty)}
                  className="w-full flex items-center justify-center gap-3 bg-emerald-500 text-zinc-950 py-4 rounded-full font-black uppercase tracking-tighter hover:bg-emerald-400 transition-all"
                >
                  再玩一次
                  <ChevronRight size={20} />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Background Decoration */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
