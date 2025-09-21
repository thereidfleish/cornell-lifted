import React, { useRef, useCallback, useState } from 'react';

export const useSparkleConfetti = () => {
	const [hoverCount, setHoverCount] = useState(0);
	const [showSecretMessage, setShowSecretMessage] = useState(false);
	const [cycleCount, setCycleCount] = useState(0);
	const [unlockedMessages, setUnlockedMessages] = useState<number[]>([]);
	const buttonRef = useRef<HTMLButtonElement>(null);

	// Different emoji sets that cycle through on hover
	const emojiSets = [
		['✦', '✧'], // Default sparkles
		['🔵', '⭕'], // Circle
		['🐏'], // Ram
		['🍎', '🥕', '🌽', '🥬'], // Anabel's Grocery
		['🍪'], // Half-Baked
		['✨', '💫'], // Winter Lights/BCI
		['☕'], // Exams/Winter Lifted Hot Chocolate
		['💌'], // Lifted Message
		['🌸', '🌺', '🌻', '🌷'], // Lifted Flower
		['🎡', '🎈'], // Lifted Pinwheel and Balloon
		['💕'], // Perfect Match
		['👨‍🌾', '🚜', '🌾'] // Farmer's Market at Cornell
	];

	// Progressive messages that unlock after each full cycle
	const progressiveMessages = [
		"i see we've peaked your interest",
		"nice try, nothing more to see here", 
		"wow, such dedication!",
		"i see how it is...",
		"don't you have homework to do or smth?",
		"your computer must be cooked by now",
		"i'm having way too much fun rn coding this up (also thx claude code)",
		"ok, we're done here",
		"i knew it...you'd never leave...",
		"hmm...what could this be? have any thoughts? let us know at circle@cornell.edu :) (also screenshot this page and email it too)"
	];

	// Sparkle confetti effect
	const createSparkleConfetti = useCallback((event?: React.MouseEvent<HTMLButtonElement>) => {
		// Get the button element from the event or try to find one from refs
		const targetButton = event?.currentTarget || buttonRef.current;
		if (!targetButton) return;
		
		// Increment hover count and cycle through emoji sets
		const newHoverCount = (hoverCount + 1) % (emojiSets.length * 10);
		setHoverCount(newHoverCount);
		
		// Check if we completed a full cycle (back to 0)
		if (newHoverCount === 0 && hoverCount > 0) {
			const newCycleCount = cycleCount + 1;
			setCycleCount(newCycleCount);
			
			// Unlock a new message if we haven't reached the limit
			if (newCycleCount <= progressiveMessages.length && !unlockedMessages.includes(newCycleCount - 1)) {
				setUnlockedMessages(prev => [...prev, newCycleCount - 1]);
				setShowSecretMessage(true);
			}
		}
		
		// Get current emoji set based on hover count (changes every 10 hovers)
		const setIndex = Math.floor(newHoverCount / 10) % emojiSets.length;
		const currentEmojiSet = emojiSets[setIndex];

		const rect = targetButton.getBoundingClientRect();
		const sparkleCount = 15;
		
		for (let i = 0; i < sparkleCount; i++) {
			const sparkle = document.createElement('div');
			// Use random emoji from current set
			sparkle.innerHTML = currentEmojiSet[Math.floor(Math.random() * currentEmojiSet.length)];
			sparkle.style.position = 'fixed';
			sparkle.style.left = (rect.left + rect.width / 2) + 'px';
			sparkle.style.top = (rect.top + rect.height / 2) + 'px';
			sparkle.style.color = 'white';
			sparkle.style.fontSize = (Math.random() * 8 + 8) + 'px';
			sparkle.style.pointerEvents = 'none';
			sparkle.style.zIndex = '9999';
			sparkle.style.userSelect = 'none';
			
			document.body.appendChild(sparkle);
			
			// Random physics - full 360 degree spread with upward bias
			const angle = Math.random() * Math.PI * 2; // Full 360 degrees
			const velocity = Math.random() * 150 + 100; // Random initial velocity
			const gravity = 500; // Gravity force
			const lifetime = 2000; // 2 seconds
			
			let vx = Math.cos(angle) * velocity;
			let vy = Math.sin(angle) * velocity;
			
			// Add extra upward boost to make sparkles more likely to go up initially
			vy -= 150;
			let x = 0;
			let y = 0;
			let opacity = 1;
			
			const startTime = Date.now();
			
			const animate = () => {
				const elapsed = Date.now() - startTime;
				const t = elapsed / 1000; // time in seconds
				
				// Update position with physics
				x += vx * 0.016; // 60fps
				y += vy * 0.016;
				vy += gravity * 0.016; // Apply gravity
				
				// Update opacity (fade out over time)
				opacity = Math.max(0, 1 - (elapsed / lifetime));
				
				// Apply transforms
				sparkle.style.transform = `translate(${x}px, ${y}px) rotate(${elapsed * 0.5}deg)`;
				sparkle.style.opacity = opacity.toString();
				
				if (elapsed < lifetime && opacity > 0) {
					requestAnimationFrame(animate);
				} else {
					sparkle.remove();
				}
			};
			
			// Start with a small delay for staggered effect
			setTimeout(() => requestAnimationFrame(animate), i * 30);
		}
	}, [hoverCount, emojiSets, cycleCount, unlockedMessages, progressiveMessages]);

	return {
		buttonRef,
		createSparkleConfetti,
		showSecretMessage,
		unlockedMessages,
		progressiveMessages
	};
};
