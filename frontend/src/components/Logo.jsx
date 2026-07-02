import { useState } from 'react';

// Renders /logo.png (place the restaurant logo at frontend/public/logo.png).
// Falls back to a plain monogram badge if the file hasn't been added yet.
export default function Logo({ className = 'h-9 w-9', fallbackTextClassName = 'text-lg' }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-primary-600 font-bold text-white ${className} ${fallbackTextClassName}`}
      >
        P
      </div>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="Le Coin des Pêcheurs"
      className={`shrink-0 object-contain ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
