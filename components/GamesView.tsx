'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, 
  RotateCcw, 
  Trophy, 
  ArrowLeft, 
  Sparkles, 
  Users, 
  Play, 
  HelpCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { ThemeColor } from '../lib/types';

interface GamesViewProps {
  themeColor: ThemeColor;
}

type SubView = 'hub' | 'setup' | 'playing';

interface Score {
  player1: number;
  player2: number;
  draws: number;
}

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

export const GamesView: React.FC<GamesViewProps> = ({ themeColor }) => {
  const [subView, setSubView] = useState<SubView>('hub');
  
  // Players configuration
  const [player1Name, setPlayer1Name] = useState('Jogador 1');
  const [player2Name, setPlayer2Name] = useState('Jogador 2');

  // Tic-Tac-Toe Game State
  const [board, setBoard] = useState<Array<null | 'O' | 'X'>>(Array(9).fill(null));
  const [turn, setTurn] = useState<'O' | 'X'>('O');
  const [winner, setWinner] = useState<null | 'O' | 'X' | 'draw'>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  
  // Session scoreboard
  const [score, setScore] = useState<Score>({
    player1: 0,
    player2: 0,
    draws: 0
  });

  const p1Display = player1Name.trim() || 'Jogador 1';
  const p2Display = player2Name.trim() || 'Jogador 2';

  const handleStartGame = () => {
    setBoard(Array(9).fill(null));
    setTurn('O');
    setWinner(null);
    setWinningLine(null);
    setSubView('playing');
  };

  const handleCellClick = (index: number) => {
    // If cell is already taken or match is finished, do nothing
    if (board[index] !== null || winner !== null) return;

    const newBoard = [...board];
    newBoard[index] = turn;
    setBoard(newBoard);

    // Check for win
    let roundWon = false;
    let winningCombo: number[] | null = null;

    for (let i = 0; i < WINNING_COMBINATIONS.length; i++) {
      const [a, b, c] = WINNING_COMBINATIONS[i];
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        roundWon = true;
        winningCombo = [a, b, c];
        break;
      }
    }

    if (roundWon && winningCombo) {
      setWinner(turn);
      setWinningLine(winningCombo);
      if (turn === 'O') {
        setScore(prev => ({ ...prev, player1: prev.player1 + 1 }));
      } else {
        setScore(prev => ({ ...prev, player2: prev.player2 + 1 }));
      }
      return;
    }

    // Check for draw (all cells filled without winner)
    const isDraw = newBoard.every(cell => cell !== null);
    if (isDraw) {
      setWinner('draw');
      setScore(prev => ({ ...prev, draws: prev.draws + 1 }));
      return;
    }

    // Toggle turn
    setTurn(turn === 'O' ? 'X' : 'O');
  };

  const handlePlayAgain = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningLine(null);
    // Player 1 (⭕) starts next round
    setTurn('O');
  };

  const handleResetScore = () => {
    setScore({ player1: 0, player2: 0, draws: 0 });
  };

  const handleExitGame = () => {
    setSubView('hub');
  };

  return (
    <div className="pt-20 pb-32 px-4 max-w-md mx-auto min-h-screen">
      <AnimatePresence mode="wait">
        {/* VIEW 1: HUB / LISTA DE JOGOS */}
        {subView === 'hub' && (
          <motion.div
            key="hub"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-5"
          >
            {/* Header banner */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-6 rounded-3xl shadow-xl shadow-indigo-950/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-indigo-200 mb-3 border border-white/10">
                  <Gamepad2 size={14} /> Passatempo no Celular
                </div>
                <h2 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-2">
                  🎮 Hora de se divertir!
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Aproveite momentos livres ou de espera na fila do mercado para jogar com amigos no mesmo aparelho. 100% offline e sem login!
                </p>
              </div>
            </div>

            {/* Game selection section */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Escolha um jogo:
                </h3>
              </div>

              {/* Game 1: Jogo da Velha Card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-black shadow-inner">
                      ⭕❌
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900">
                        Jogo da Velha
                      </h4>
                      <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Users size={12} /> 2 jogadores no mesmo celular
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Disponível
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  O clássico duelo 3x3 para dois jogadores. Descubra quem é o mestre da estratégia enquanto aguarda suas compras!
                </p>

                <button
                  id="btn-play-tictactoe"
                  onClick={() => setSubView('setup')}
                  className={`w-full h-12 ${themeColor.bg} text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-sm ${themeColor.hover} active:scale-98 transition-all`}
                >
                  <Play size={18} fill="currentColor" /> JOGAR
                </button>
              </div>

              {/* Teaser for future games (prepared structure) */}
              <div className="mt-3 p-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 flex items-center gap-3 text-slate-400">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600">Novos jogos em breve</p>
                  <p className="text-[11px] text-slate-400">Mais opções rápidas para duas pessoas no mesmo celular.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: SETUP / CONFIGURAÇÃO DOS NOMES */}
        {subView === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-5"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSubView('hub')}
                className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 active:scale-95 transition-transform"
                title="Voltar aos Jogos"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-black text-slate-900">⭕❌ Jogo da Velha</h2>
                <p className="text-xs text-slate-400">Modo para duas pessoas no mesmo celular</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Quem vai jogar?</h3>
                  <p className="text-xs text-slate-400">Defina os nomes ou use os padrões</p>
                </div>
              </div>

              {/* Jogador 1 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <span className="text-base text-blue-500 font-black">⭕</span> Jogador 1 (Inicia o jogo)
                </label>
                <input
                  type="text"
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  placeholder="Jogador 1"
                  maxLength={18}
                  className={`w-full h-12 px-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 text-sm focus:ring-2 ${themeColor.ring} transition-all`}
                />
              </div>

              {/* Jogador 2 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <span className="text-base text-rose-500 font-black">❌</span> Jogador 2
                </label>
                <input
                  type="text"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  placeholder="Jogador 2"
                  maxLength={18}
                  className={`w-full h-12 px-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 text-sm focus:ring-2 ${themeColor.ring} transition-all`}
                />
              </div>

              <div className="bg-slate-50 rounded-2xl p-3 text-[11px] text-slate-500 flex items-start gap-2 leading-relaxed">
                <HelpCircle size={15} className="shrink-0 text-slate-400 mt-0.5" />
                <span>
                  O Jogador 1 sempre começa com ⭕ e o Jogador 2 com ❌. Basta tocar alternadamente no tabuleiro.
                </span>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  id="btn-start-game"
                  onClick={handleStartGame}
                  className={`w-full h-12 ${themeColor.bg} text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-sm ${themeColor.hover} active:scale-98 transition-all`}
                >
                  <Play size={18} fill="currentColor" /> COMEÇAR JOGO
                </button>
                <button
                  onClick={() => setSubView('hub')}
                  className="w-full h-11 bg-slate-100 text-slate-600 font-bold rounded-2xl active:scale-98 transition-all text-xs"
                >
                  Voltar
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: PLAYING / TABULEIRO DO JOGO */}
        {subView === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="flex flex-col gap-4"
          >
            {/* Top header with Exit */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExitGame}
                  className="w-9 h-9 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 active:scale-95 transition-transform"
                  title="Sair do jogo"
                >
                  <ArrowLeft size={18} />
                </button>
                <span className="font-black text-slate-900 text-base">Jogo da Velha</span>
              </div>

              <button
                onClick={handleResetScore}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <RotateCcw size={13} /> ZERAR PLACAR
              </button>
            </div>

            {/* Scoreboard (Placar) */}
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Trophy size={13} className="text-amber-500" /> Placar da Sessão
                </span>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                  Empates: {score.draws}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Player 1 Score */}
                <div className={`p-3 rounded-2xl border transition-all ${turn === 'O' && !winner ? 'bg-blue-50/70 border-blue-200 ring-2 ring-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-base font-black text-blue-500">⭕</span>
                      <span className="text-xs font-bold text-slate-700 truncate">{p1Display}</span>
                    </div>
                    <span className="text-xl font-black text-slate-900 ml-2">{score.player1}</span>
                  </div>
                </div>

                {/* Player 2 Score */}
                <div className={`p-3 rounded-2xl border transition-all ${turn === 'X' && !winner ? 'bg-rose-50/70 border-rose-200 ring-2 ring-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-base font-black text-rose-500">❌</span>
                      <span className="text-xs font-bold text-slate-700 truncate">{p2Display}</span>
                    </div>
                    <span className="text-xl font-black text-slate-900 ml-2">{score.player2}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status / Turn Indicator */}
            <div className="text-center">
              {winner === null && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-100 shadow-sm text-sm font-black text-slate-800">
                  {turn === 'O' ? (
                    <>
                      <span className="text-blue-500 text-lg animate-pulse">⭕</span>
                      <span>Vez de <strong className="text-blue-600">{p1Display}</strong></span>
                    </>
                  ) : (
                    <>
                      <span className="text-rose-500 text-lg animate-pulse">❌</span>
                      <span>Vez de <strong className="text-rose-600">{p2Display}</strong></span>
                    </>
                  )}
                </div>
              )}

              {winner === 'O' && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm text-sm font-black text-emerald-800"
                >
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>🎉 {p1Display} venceu!</span>
                </motion.div>
              )}

              {winner === 'X' && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm text-sm font-black text-emerald-800"
                >
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>🎉 {p2Display} venceu!</span>
                </motion.div>
              )}

              {winner === 'draw' && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm text-sm font-black text-amber-800"
                >
                  <XCircle size={18} className="text-amber-600" />
                  <span>🤝 Deu velha!</span>
                </motion.div>
              )}
            </div>

            {/* 3x3 Tic-Tac-Toe Board */}
            <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-100 shadow-md">
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 aspect-square w-full max-w-[340px] mx-auto bg-slate-100 p-2.5 sm:p-3 rounded-2xl">
                {board.map((cell, idx) => {
                  const isWinningCell = winningLine?.includes(idx);
                  return (
                    <button
                      key={idx}
                      id={`cell-${idx}`}
                      onClick={() => handleCellClick(idx)}
                      disabled={cell !== null || winner !== null}
                      aria-label={`Casa ${idx + 1}`}
                      className={`relative flex items-center justify-center rounded-2xl font-black transition-all select-none
                        ${cell === null && winner === null ? 'bg-white hover:bg-slate-50 active:scale-95 shadow-sm' : ''}
                        ${cell !== null && !isWinningCell ? 'bg-white shadow-sm' : ''}
                        ${isWinningCell ? 'bg-gradient-to-br from-amber-200 to-amber-300 border-2 border-amber-400 shadow-lg scale-[1.03] z-10' : 'border border-slate-200/50'}
                        ${cell === null && winner !== null ? 'bg-slate-50/70 opacity-40' : ''}
                      `}
                    >
                      {cell === 'O' && (
                        <motion.span
                          initial={{ scale: 0, rotate: -30 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                          className={`text-4xl sm:text-5xl font-black ${isWinningCell ? 'text-amber-900' : 'text-blue-600'}`}
                        >
                          ⭕
                        </motion.span>
                      )}
                      {cell === 'X' && (
                        <motion.span
                          initial={{ scale: 0, rotate: 30 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                          className={`text-4xl sm:text-5xl font-black ${isWinningCell ? 'text-amber-900' : 'text-rose-600'}`}
                        >
                          ❌
                        </motion.span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions on match conclusion (Win or Draw) */}
            {winner !== null ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2 pt-1"
              >
                <button
                  id="btn-play-again"
                  onClick={handlePlayAgain}
                  className={`w-full h-12 ${themeColor.bg} text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-md ${themeColor.hover} active:scale-98 transition-all`}
                >
                  <RotateCcw size={18} /> JOGAR NOVAMENTE
                </button>
                <button
                  id="btn-exit-game"
                  onClick={handleExitGame}
                  className="w-full h-11 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl active:scale-98 transition-all text-xs hover:bg-slate-50"
                >
                  SAIR DO JOGO
                </button>
              </motion.div>
            ) : (
              /* During match quick reset */
              <div className="flex justify-center pt-1">
                <button
                  onClick={handlePlayAgain}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 py-1 px-3"
                >
                  <RotateCcw size={12} /> Reiniciar rodada atual
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
