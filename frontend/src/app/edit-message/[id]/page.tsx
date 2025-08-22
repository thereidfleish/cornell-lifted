"use client";

import { useEffect, useState } from "react";
import Loading from "@/components/Loading";
import SendMessagePage from "../../send-message/page";
import { CardData } from "../../../types/User";

export default function EditMessagePage({ params }: { params: { id: string } }) {
	const [cardData, setCardData] = useState<CardData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchCard() {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(`/api/get-card-json/${params.id}`);
				if (!res.ok) {
					throw new Error("Failed to fetch card data");
				}
				const data = await res.json();
				setCardData(data);
			} catch (err: any) {
				setError(err.message || "Unknown error");
			}
			setLoading(false);
		}
		fetchCard();
	}, [params.id]);

	if (loading) {
		return <div className="flex justify-center items-center h-96"><Loading /></div>;
	}
	if (error || !cardData) {
		return <div className="flex justify-center items-center h-96 text-red-700">{error || "Card not found."}</div>;
	}

	return <SendMessagePage editMode={true} cardData={cardData} />;
}
