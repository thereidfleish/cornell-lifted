"use client";
import React, { useEffect, useState } from "react";
import { useGlobal } from "@/utils/GlobalContext";
import AddCandidateForm from "./AddCandidateForm";
import TapResponsesTable from "./TapResponsesTable";
import TapAcceptanceForm from "./TapAcceptanceForm";
import Loading from "@/components/Loading";
import { useSparkleConfetti } from "./useSparkleConfetti";
import { ProgressiveMessages } from "./ProgressiveMessages";

const CirclePage: React.FC = () => {
	const { user: globalUser, loading: globalLoading } = useGlobal();
	const isAdmin = globalUser?.user?.is_admin;
	const hasWritePerms = globalUser?.user?.admin_write_perm;
	const isAuthenticated = globalUser?.authenticated;
	const [user, setUser] = useState<any>(null);
	const [userError, setUserError] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);
	
	// Use the sparkle confetti hook
	const { 
		buttonRef, 
		createSparkleConfetti, 
		showSecretMessage, 
		unlockedMessages, 
		progressiveMessages 
	} = useSparkleConfetti();

	const handleRefresh = () => {
		setRefreshKey(k => k + 1);
	};

	useEffect(() => {
		// Fetch user data if authenticated (including admins)
		if (isAuthenticated) {
			setLoading(true);
			fetch("/api/circle/get-user")
				.then(async res => {
					setLoading(false);
					if (res.status === 401) {
						setUserError("You do not have access to this page.");
						setUser(null);
					} else if (res.ok) {
						const data = await res.json();
						setUser(data);
					} else {
						setUserError("Error loading user info.");
						setUser(null);
					}
				})
				.catch(() => {
					setLoading(false);
					setUserError("Error loading user info.");
				});
		}
	}, [isAuthenticated]);

	// Helper function to render user content based on user state
	const renderUserContent = () => {
		if (loading) {
			return <Loading />;
		}
		
		if (user && user.netid && (user.accept_tap === null || user.accept_tap === undefined)) {
			return <TapAcceptanceForm tapName={user.tap_name} />;
		}
		
		if (user && user.accept_tap === 1) {
			return (
				<p className="text-center text-white">
					Welcome to the Circle, {user.tap_name?.split(" ")[0]}! We're so excited for you to join us. 
					Keep an eye on your email for further information, coming soon...<br /><br />
					If you have any questions in the meantime, please reach out to whoever tapped you or wrote you a letter.
				</p>
			);
		}
		
		if (user && user.accept_tap === 0) {
			return (
				<p className="text-center text-white">
					We're sorry you rejected the tap. Please return the parcel to whoever tapped you and maintain the society's secrecy.<br /><br />
					If you have any questions, please reach out to whoever tapped you or wrote you a letter.
				</p>
			);
		}
		
		// No user access - but don't show this message for admins
		if (!isAdmin) {
			return (
				<div className="text-center">
					<div className="text-white text-lg py-8">You do not have access to this page.</div>
				</div>
			);
		}
		
		// For admins with no user data, return null (no message)
		return null;
	};

	 return (
		 <div className="min-h-screen bg-neutral-800 p-4" style={{ fontFamily: "'IM Fell English SC', serif", fontWeight: 400, fontStyle: "normal" }}>
			 <main>
				 {/* Show loading while checking global auth */}
				 {globalLoading ? (
					 <Loading />
				 ) : !isAuthenticated ? (
					 /* Show sign in button if not authenticated */
					 <div className="text-center">
						 <div className="text-white text-lg py-4 mb-4">Please sign in to access this page.</div>
						 
						 {/* Simple sign-in button */}
						 <div className="mb-6">
							 <a 
								 href={`https://api.cornelllifted.com/login?next=${encodeURIComponent("/circle")}`} 
								 className="px-6 py-3 rounded-lg bg-gray-900 text-white font-semibold inline-block transition-all duration-300 hover:bg-gray-800"
							 >
								 Sign In with Cornell NetID
							 </a>
						 </div>
					 </div>
				 ) : isAdmin ? (
					 /* Admin users see appropriate interface based on write permissions */
					 <>
						 {hasWritePerms && <AddCandidateForm onRefresh={handleRefresh} />}
						 <TapResponsesTable 
							 refreshKey={refreshKey} 
							 showDeleteButton={!!hasWritePerms} 
							 onRefresh={handleRefresh} 
						 />
						 {renderUserContent()}
					 </>
				 ) : (
					 /* Authenticated non-admin users */
					 renderUserContent()
				 )}

				 {/* Single Easter egg circle button - shows when not authenticated OR no access */}
				 {(!isAuthenticated || (isAuthenticated && !isAdmin && (!user || (!user.netid || user.accept_tap !== null)))) && (
					 <div className="text-center">
						 <div className="mb-4 relative">
							 <button
								 ref={buttonRef}
								 className="relative text-6xl transition-transform duration-200 hover:scale-110 active:scale-95 cursor-pointer bg-transparent border-none group"
								 onMouseEnter={createSparkleConfetti}
								 onClick={createSparkleConfetti}
								 title="🤔"
							 >
								 <span className="relative z-10">⭕</span>
							 </button>
							 {/* Background sparkles that continuously animate - moved outside button to avoid clipping */}
							 <div className="absolute inset-0 pointer-events-none overflow-visible">
								 <div className="sparkle-up absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-sm z-20">✦</div>
								 <div className="sparkle-up-right absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs z-20" style={{animationDelay: '0.5s'}}>✧</div>
								 <div className="sparkle-right absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-sm z-20" style={{animationDelay: '1s'}}>✦</div>
								 <div className="sparkle-down-right absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs z-20" style={{animationDelay: '1.5s'}}>✧</div>
								 <div className="sparkle-down absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-sm z-20" style={{animationDelay: '2s'}}>✦</div>
								 <div className="sparkle-down-left absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs z-20" style={{animationDelay: '2.5s'}}>✧</div>
								 <div className="sparkle-left absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-sm z-20" style={{animationDelay: '3s'}}>✦</div>
								 <div className="sparkle-up-left absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs z-20" style={{animationDelay: '3.5s'}}>✧</div>
							 </div>
						 </div>

						 {/* Progressive secret messages */}
						 <ProgressiveMessages 
							 showSecretMessage={showSecretMessage}
							 unlockedMessages={unlockedMessages}
							 progressiveMessages={progressiveMessages}
						 />
					 </div>
				 )}
			 </main>
			 <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&display=swap" />
			 <style>{`
				html, body, * {
					font-family: 'IM Fell English SC', serif !important;
					font-weight: 400 !important;
					font-style: normal !important;
				}
				
				@keyframes sparkle-up {
					0% { transform: translate(-50%, -50%); opacity: 1; }
					100% { transform: translate(-50%, -1200%); opacity: 0; }
				}
				@keyframes sparkle-up-right {
					0% { transform: translate(-50%, -50%); opacity: 1; }
					100% { transform: translate(1200%, -1200%); opacity: 0; }
				}
				@keyframes sparkle-right {
					0% { transform: translate(-50%, -50%); opacity: 1; }
					100% { transform: translate(1500%, -50%); opacity: 0; }
				}
				@keyframes sparkle-down-right {
					0% { transform: translate(-50%, -50%); opacity: 1; }
					100% { transform: translate(1200%, 1200%); opacity: 0; }
				}
				@keyframes sparkle-down {
					0% { transform: translate(-50%, -50%); opacity: 1; }
					100% { transform: translate(-50%, 1200%); opacity: 0; }
				}
				@keyframes sparkle-down-left {
					0% { transform: translate(-50%, -50%); opacity: 1; }
					100% { transform: translate(-1200%, 1200%); opacity: 0; }
				}
				@keyframes sparkle-left {
					0% { transform: translate(-50%, -50%); opacity: 1; }
					100% { transform: translate(-1500%, -50%); opacity: 0; }
				}
				@keyframes sparkle-up-left {
					0% { transform: translate(-50%, -50%); opacity: 1; }
					100% { transform: translate(-1200%, -1200%); opacity: 0; }
				}
				
				.sparkle-up { animation: sparkle-up 2s infinite; }
				.sparkle-up-right { animation: sparkle-up-right 2s infinite; }
				.sparkle-right { animation: sparkle-right 2s infinite; }
				.sparkle-down-right { animation: sparkle-down-right 2s infinite; }
				.sparkle-down { animation: sparkle-down 2s infinite; }
				.sparkle-down-left { animation: sparkle-down-left 2s infinite; }
				.sparkle-left { animation: sparkle-left 2s infinite; }
				.sparkle-up-left { animation: sparkle-up-left 2s infinite; }
			 `}</style>
		 </div>
	 );
};

export default CirclePage;
