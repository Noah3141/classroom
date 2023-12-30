import React, { ReactNode } from "react";

type ButtonProps = {
    children: ReactNode;
    className?: string;
    status?: "error" | "idle" | "loading" | "success";
} & React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
>;
const Button = ({ className, status, children, ...props }: ButtonProps) => {
    if (!status) {
        status = "idle";
    }
    return (
        <button
            className={`relative w-fit rounded-md p-3  transition-all
            ${status == "loading" && "text-transparent"} 
            ${status == "success" && "bg-green-500 text-transparent"}
            ${status == "error" && "bg-red-600 text-transparent"} 
            ${
                status == "idle" &&
                "bg-amber-600 text-stone-950 hover:bg-amber-700"
            } 
            ${className}
            `}
            {...props}
        >
            {children}
            <div
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
            ${status == "loading" && "text-stone-950 hover:cursor-wait"} 
            ${status == "success" && "text-stone-950 hover:cursor-default"}
            ${status == "error" && "text-stone-950 hover:cursor-default"} 
            ${status == "idle" && " text-transparent"} 
            `}
            >
                {status == "idle"
                    ? ""
                    : status == "loading"
                      ? "Loading..."
                      : status == "success"
                        ? "Success!"
                        : status == "error"
                          ? "Uh-oh!"
                          : "How has this state occurred"}
            </div>
        </button>
    );
};

export default Button;
