import React, { type ReactNode } from "react";

const Card = ({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) => {
    return (
        <div
            className={`mx-auto flex h-fit  max-w-full rounded-lg bg-stone-900 p-6 shadow-lg shadow-[#00000030] ${className}`}
        >
            {children}
        </div>
    );
};

export default Card;
