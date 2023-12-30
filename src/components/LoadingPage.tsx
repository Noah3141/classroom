import React from "react";
import CardPanel from "./CardPanel";

const LoadingPage = () => {
    return (
        <CardPanel>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="mx-auto w-fit bg-stone-900 p-12 text-amber-600">
                    Loading...
                </div>
            </div>
        </CardPanel>
    );
};

export default LoadingPage;
