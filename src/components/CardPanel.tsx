import React, { ReactNode } from "react";

const dev = process.env.NODE_ENV;

const CardPanel = ({ children }: { children: ReactNode }) => {
    return (
        <div className="flex min-h-screen w-full flex-col place-content-start gap-6 bg-stone-950 p-3 font-mono text-amber-600 transition-all md:p-12    xl:grid-cols-12">
            {children}
        </div>
    );
};

export default CardPanel;
