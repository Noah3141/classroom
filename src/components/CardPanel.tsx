import React, { ReactNode } from "react";

const CardPanel = ({ children }: { children: ReactNode }) => {
    return (
        <div className="grid min-h-screen w-full grid-cols-1 place-content-start gap-6 bg-stone-950 p-3 font-mono text-amber-600 transition-all md:grid-cols-2 md:p-12 xl:grid-cols-12">
            {children}
        </div>
    );
};

export default CardPanel;
