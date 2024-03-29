import React from "react";
import CardPanel from "./CardPanel";
import Link from "next/link";

const OopsiePage = ({ msg }: { msg?: string }) => {
    return (
        <CardPanel>
            <div className="absolute left-6 top-6 transition-all">
                <Link href={`/`}>
                    <span className="click-span ">{"<"} back</span>
                </Link>
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="mx-auto w-fit bg-stone-900 p-12 text-center text-amber-600">
                    {!!msg ? msg : `Something's wrong...`}
                </div>
                <div></div>
            </div>
        </CardPanel>
    );
};

export default OopsiePage;
