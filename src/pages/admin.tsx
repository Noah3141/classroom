import React from "react";
import toast from "react-hot-toast";
import Button from "~/components/Button";
import CardPanel from "~/components/CardPanel";
import { api } from "~/utils/api";

const Admin = () => {
    const { mutate, status } = api.admin.generateFakeSubmission.useMutation({
        onMutate: () => {
            toast.loading("Loading...", { id: "generateFakeSubmission" });
        },
        onSuccess: () => {
            toast.success("Success!", { id: "generateFakeSubmission" });
        },
        onError: (e) => {
            toast.error(e.message, { id: "generateFakeSubmission" });
        },
    });

    return (
        <CardPanel>
            <div>
                <Button
                    onClick={() => {
                        mutate();
                    }}
                    status={status}
                >
                    Generate submission
                </Button>
            </div>
        </CardPanel>
    );
};

export default Admin;
