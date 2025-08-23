"use client";
import React, { useEffect, useState } from "react";
import { useGlobal } from "@/utils/GlobalContext";
import AddCandidateFormAndResponses from "./AddCandidateFormAndResponses";
import TapAcceptanceForm from "./TapAcceptanceForm";

const CirclePage: React.FC = () => {
	const { user: globalUser } = useGlobal();
	const isAdmin = globalUser?.user?.is_admin;
	const [user, setUser] = useState<any>(null);
	const [userError, setUserError] = useState<string>("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!isAdmin) {
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
	}, [isAdmin]);

	 return (
		 <div className="min-h-screen bg-neutral-800 p-4" style={{ fontFamily: "'IM Fell English SC', serif", fontWeight: 400, fontStyle: "normal" }}>
			 <main>
						 {isAdmin && <AddCandidateFormAndResponses />}
						 {loading ? (
							 <div className="text-center text-white text-lg py-8">Loading...</div>
						 ) : userError ? (
							 <div className="text-center text-white text-lg py-8">{userError}</div>
						 ) : user ? (
							 (user.netid && (user.accept_tap === null || user.accept_tap === undefined)) ? (
								 <TapAcceptanceForm tapName={user.tap_name} />
									 ) : user.accept_tap === 1 ? (
										 <p className="text-center text-white">Welcome to the Circle, {user.tap_name?.split(" ")[0]}! We're so excited for you to join us. Keep an eye on your email for further information, coming soon...<br /><br />If you have any questions in the meantime, please reach out to whoever tapped you or wrote you a letter.</p>
									 ) : user.accept_tap === 0 ? (
										 <p className="text-center text-white">We're sorry you rejected the tap. Please return the parcel to whoever tapped you and maintain the society's secrecy.<br /><br />If you have any questions, please reach out to whoever tapped you or wrote you a letter.</p>
									 ) : null
						 ) : (
							 <div className="text-center">
								 <a href={`/login?next=${encodeURIComponent("/circle")}`} className="px-4 py-2 rounded bg-gray-900 text-white font-semibold mb-3 inline-block">Sign In with Cornell NetID</a>
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
			 `}</style>
		 </div>
	 );
};

export default CirclePage;
