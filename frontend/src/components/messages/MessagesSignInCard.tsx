import React from "react";

type MessagesSignInCardProps = {
    title: string;
    description: string;
    titleClassName?: string;
    showIcon?: boolean;
};

export default function MessagesSignInCard({
    title,
    description,
    titleClassName = "text-2xl",
    showIcon = true,
}: MessagesSignInCardProps) {
    return (
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-8 text-center">
            {showIcon && <div className="text-4xl mb-4">🔑</div>}
            <h4 className={`${titleClassName} font-bold text-cornell-blue mb-2`}>{title}</h4>
            <p className="mb-4">{description}</p>
            <a href="https://api.cornelllifted.com/login?next=/messages" className="bg-cornell-red text-white rounded-full px-6 py-3 font-semibold shadow inline-block">Sign In with Cornell NetID</a>
        </div>
    );
}