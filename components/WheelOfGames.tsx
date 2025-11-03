'use client';

import { useEffect, useRef, useState } from 'react';

interface Game {
  _id: string;
  name: string;
}

interface WheelOfGamesProps {
  games: Game[];
  onSpinComplete?: (winner: Game) => void;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
];

export default function WheelOfGames({ games, onSpinComplete }: WheelOfGamesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Game | null>(null);

  useEffect(() => {
    drawWheel();
  }, [games, rotation]);

  function drawWheel() {
    const canvas = canvasRef.current;
    if (!canvas || games.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const segmentAngle = (2 * Math.PI) / games.length;

    // Draw segments
    games.forEach((game, index) => {
      const startAngle = index * segmentAngle;
      const endAngle = startAngle + segmentAngle;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[index % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;
      ctx.fillText(game.name, radius - 20, 5);
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function spin() {
    if (isSpinning || games.length < 2) return;

    setIsSpinning(true);
    setWinner(null);

    // Calculate random rotation (5-8 full rotations + random position)
    const fullRotations = 5 + Math.random() * 3;
    const randomDegrees = Math.random() * 360;
    const totalRotation = rotation + fullRotations * 360 + randomDegrees;

    setRotation(totalRotation);

    // Calculate winner after animation (3 seconds)
    setTimeout(() => {
      const normalizedRotation = totalRotation % 360;
      const segmentAngle = 360 / games.length;

      // Arrow points at top (270° in canvas coordinates)
      // Segments are drawn starting at 0° (right side) going counter-clockwise
      // When wheel rotates clockwise by normalizedRotation degrees,
      // we need to find which segment is now at the top (270°)

      // After clockwise rotation, the segment originally at (270 - rotation) is now at 270°
      let originalAngle = (270 - normalizedRotation) % 360;
      if (originalAngle < 0) originalAngle += 360;

      const winnerIndex = Math.floor(originalAngle / segmentAngle) % games.length;

      const winningGame = games[winnerIndex];
      setWinner(winningGame);
      setIsSpinning(false);

      if (onSpinComplete) {
        onSpinComplete(winningGame);
      }
    }, 3000);
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative">
        {/* Fixed Arrow at Top - Does NOT rotate */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[20px] border-t-red-600 drop-shadow-lg"></div>
        </div>

        {/* Spinning Wheel Canvas */}
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="transition-transform duration-[3000ms] ease-out"
          style={{
            transform: `rotate(${rotation}deg)`,
          }}
        />
      </div>

      <button
        onClick={spin}
        disabled={isSpinning || games.length < 2}
        className={`px-8 py-4 text-xl font-bold rounded-lg transition-all duration-200 ${
          isSpinning || games.length < 2
            ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-50'
            : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 hover:scale-105 active:scale-95 shadow-lg'
        } text-white`}
      >
        {isSpinning ? '🎲 Spinning...' : '🎲 SPIN WHEEL'}
      </button>

      {winner && !isSpinning && (
        <div className="text-center animate-fadeIn bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-600 rounded-lg p-6 min-w-[300px]">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            🎉 Winner!
          </p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {winner.name}
          </p>
        </div>
      )}

      {games.length < 2 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select at least 2 games to spin the wheel
        </p>
      )}
    </div>
  );
}
