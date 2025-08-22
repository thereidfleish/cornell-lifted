"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";
import { CardData } from "../../../types/User";
import SendMessageForm from "@/app/send-message/SendMessageForm";

export default function EditMessagePage() {
	const params = useParams();
	const id = params?.id as string;
	const [cardData, setCardData] = useState<CardData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchCard() {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(`/api/get-card-json/${id}`);
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
		if (id) fetchCard();
	}, [id]);

	if (loading) {
		return <div className="flex justify-center items-center h-96"><Loading /></div>;
	}
	if (error || !cardData) {
		return <div className="flex justify-center items-center h-96 text-red-700">{error || "Card not found."}</div>;
	}

	return <SendMessageForm editMode={true} cardData={cardData} />;
}
