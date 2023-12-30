import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import toast from "react-hot-toast";
import { Tooltip } from "react-tooltip";
import Button from "~/components/Button";
import Card from "~/components/Card";
import CardPanel from "~/components/CardPanel";
import LoadingPage from "~/components/LoadingPage";
import OopsiePage from "~/components/OopsiePage";
import { api } from "~/utils/api";

const ClassPage = () => {
    const router = useRouter();
    const session = useSession();

    const classId = (router.query.classId as string) ?? null;

    const { data: classroom, isLoading: classroomLoading } =
        api.class.getById.useQuery({ classId });

    const removeClassToastId = "RemoveClassToastId";
    const dataState = api.useContext();
    const { mutate: removeClassroom, status: statusRemoving } =
        api.teacher.removeClass.useMutation({
            onMutate: () => {
                toast.loading("Loading...", { id: removeClassToastId });
            },
            onSuccess: () => {
                void dataState.class.invalidate();
                void router.push("/teacher");
                toast.success("Success!", { id: removeClassToastId });
            },
            onError: (e) => {
                toast.error(e.message, { id: removeClassToastId });
            },
        });

    if (session.status == "loading" || classroomLoading) return <LoadingPage />;

    if (session.status != "authenticated") {
        void signIn("email");
        return;
    }

    if (!classroom) return <OopsiePage />;

    return (
        <CardPanel>
            <Card className="col-span-4 w-full">
                <div className="whitespace-nowrap">
                    {classroom.title} - {classroom.season}{" "}
                    {classroom.schoolYear}
                </div>
            </Card>
            <Card className="col-span-8 w-full">
                Link to join class: <span>{`/join-class/${classroom.id}`}</span>
            </Card>
            <Card className="col-span-2 flex w-full justify-center">
                <Link href={`/teacher`}>
                    <Button>Teacher panel</Button>
                </Link>
            </Card>
            <Card className="col-span-2 flex h-full w-full flex-row items-center justify-center">
                <span id="remove-class-1" className="click-span">
                    Remove class
                </span>
                <Tooltip
                    place="bottom"
                    clickable
                    anchorSelect="#remove-class-1"
                    delayHide={1500}
                    delayShow={200}
                >
                    <span id="remove-class-2" className="click-span">
                        Are you sure?
                    </span>
                </Tooltip>
                <Tooltip
                    place="bottom"
                    clickable
                    isOpen={statusRemoving == "loading" ? true : undefined}
                    anchorSelect="#remove-class-2"
                    delayHide={0}
                    delayShow={200}
                >
                    <span
                        onClick={() => {
                            removeClassroom({
                                classId,
                            });
                        }}
                        className="click-span"
                    >
                        {statusRemoving == "loading"
                            ? "Removing..."
                            : "> Remove <"}
                    </span>
                </Tooltip>
            </Card>
        </CardPanel>
    );
};

export default ClassPage;
