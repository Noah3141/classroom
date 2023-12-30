import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React from "react";
import toast from "react-hot-toast";
import Button from "~/components/Button";
import Card from "~/components/Card";
import CardPanel from "~/components/CardPanel";
import LoadingPage from "~/components/LoadingPage";
import OopsiePage from "~/components/OopsiePage";
import { api } from "~/utils/api";

const JoinClassPage = () => {
    const router = useRouter();
    const { data: session, status } = useSession();

    const classId = (router.query.classId as string) ?? null;

    const { data: classroom, isLoading: classroomLoading } =
        api.class.getById.useQuery({ classId });

    const dataState = api.useContext();
    const joinClassToast = "JoinClassToastId";
    const { mutate: joinClass, isLoading: joiningLoading } =
        api.student.joinClass.useMutation({
            onMutate: () => {
                toast.loading("Loading...", { id: joinClassToast });
            },
            onSuccess: () => {
                toast.success("Success!", { id: joinClassToast });
                void dataState.class.invalidate();
                void router.push("/student");
            },
            onError: (e) => {
                toast.error(e.message, { id: joinClassToast });
            },
        });

    if (status == "loading" || classroomLoading) return <LoadingPage />;

    if (status != "authenticated") {
        void signIn("email");
        return;
    }

    if (!classroom) return <OopsiePage />;
    return (
        <CardPanel>
            <div className="col-span-full flex h-[30vh] flex-row items-center justify-center">
                <Card className="flex-col items-center gap-3">
                    <span>
                        {classroom.title} - {classroom.season}{" "}
                        {classroom.schoolYear}
                    </span>
                    <Button
                        onClick={() => {
                            if (!session.user.roles.includes("Student")) {
                                toast.error(
                                    "You must be a student to join a class!",
                                    { id: "MustBeStudentToJoinClass" },
                                );
                                return;
                            }
                            joinClass({
                                classId: classroom.id,
                            });
                        }}
                    >
                        Join Class
                    </Button>
                </Card>
            </div>
        </CardPanel>
    );
};

export default JoinClassPage;
