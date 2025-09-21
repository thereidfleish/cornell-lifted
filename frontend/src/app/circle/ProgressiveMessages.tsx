import React from 'react';

interface ProgressiveMessagesProps {
	showSecretMessage: boolean;
	unlockedMessages: number[];
	progressiveMessages: string[];
}

export const ProgressiveMessages: React.FC<ProgressiveMessagesProps> = ({
	showSecretMessage,
	unlockedMessages,
	progressiveMessages
}) => {
	if (!showSecretMessage || unlockedMessages.length === 0) {
		return null;
	}

	return (
		<div className="mt-4 space-y-2">
			{unlockedMessages.map((messageIndex) => (
				<div key={messageIndex} className="text-center">
					<p className="text-white text-sm italic opacity-80 transition-all duration-500">
						{messageIndex === 9 ? (
							// Special handling for the last message with email link
							<>
								hmm...what could this be? have any thoughts? let us know at{' '}
								<a 
									href="mailto:circle@cornell.edu" 
									className="text-blue-300 hover:text-blue-200 underline"
								>
									circle@cornell.edu
								</a>{' '}
								:) (also screenshot this page and email it too)
							</>
						) : (
							progressiveMessages[messageIndex]
						)}
					</p>
				</div>
			))}
		</div>
	);
};
