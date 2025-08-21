import Image from "next/image";
import React, { useEffect, useState } from "react";

const loadingMessages = [
  "Inflating balloons...",
  "Untangling string lights...",
  "Staking cards in the Arts Quad grass...",
  "Chasing runaway pinwheels...",
  "Hanging cards on string lights...",
  "Blowing up a balloon animal...",
  "Trying not to pop a balloon...",
  "Spinning pinwheels for good luck...",
  "Making sure every balloon floats...",
  "Counting how many balloons fit in a backpack...",
  "Waving pinwheels at passersby...",
  // Cornell-themed messages
  "Waiting for the chimes to play...",
  "Trying to find a sunny spot on Libe Slope...",
  "Looking for a free table at CTB...",
  "Checking if the clocktower is still standing...",
  "Wondering if Touchdown needs a balloon...",
  "Hoping for a snow day in April...",
  "Trying not to get lost in Ives Hall...",
  "Dreaming of ice cream at the Dairy Bar...",
  "Wishing for a balloon ride over Cayuga Lake...",
  // Snarky Cornell messages
  "Waiting for the TCAT to actually show up...",
  "Wondering if the slope is steeper today...",
  "Contemplating a major change for the fifth time this semester...",
  "Wondering if the clocktower is judging me...",
  "Hoping the Dairy Bar is open (spoiler: it's not)...",
  "Looking for a seat in Mann Library (good luck)...",
  "Trying to avoid eye contact with the campus tour...",
  "Waiting for the sun to come out (any day now)...",
  "Waiting for the banger Okenshields playlist...",
  "Wishing for a snow day in August...",
  "Trying to get a balloon past the wind tunnel between buildings...",
  "Wondering if the clocktower is just a really big balloon...",
  "Waiting for the next construction detour...",
  "Sorting my dirty silverware at Morrison...",
  "Wondering how many different variations of loading messages there are..."
];

export default function Loading() {
  // Use the current time to select the message globally
  const now = Date.now();
  const tenSecondBlock = Math.floor(now / 10000); // 10,000 ms = 10 seconds
  const messageIdx = tenSecondBlock % loadingMessages.length;
  const message = loadingMessages[messageIdx];

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-5">
      <div className="loading-pulse">
        <Image
          src="/images/loading.png"
          alt="Loading"
          width={64}
          height={64}
          priority
        />
      </div>
      <span className="mt-4 text-cornell-blue text-lg font-semibold text-center">
        Loading...
        <span className="block text-base text-gray-500 mt-2 text-center">{message}</span>
      </span>
      <style jsx>{`
        .loading-pulse {
          display: inline-block;
          animation: pulse-grow 1.2s infinite cubic-bezier(.4,0,.6,1);
        }
        @keyframes pulse-grow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
