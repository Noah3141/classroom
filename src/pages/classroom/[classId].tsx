import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Tooltip } from "react-tooltip";
import Button from "~/components/Button";
import Card from "~/components/Card";
import CardPanel from "~/components/CardPanel";
import LoadingPage from "~/components/LoadingPage";
import OopsiePage from "~/components/OopsiePage";
import { ClassSubmissions, api } from "~/utils/api";
import CopyToClipboard from "react-copy-to-clipboard";
import { HiOutlineClipboardCopy, HiClipboardCheck } from "react-icons/hi";
import { dtfmt } from "~/utils/datetimeFormatter";

const ClassPage = () => {
    const router = useRouter();
    const session = useSession();

    const classId = router.query.classId
        ? (router.query.classId as string)
        : null;

    const { data: tests, isLoading: testsLoading } =
        api.teacher.getTests.useQuery();

    const [selectedTestId, selectTest] = useState<string | null>(null);

    const { data: classroom, isLoading: classroomLoading } =
        api.class.getById.useQuery({ classId: classId });

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

    if (session.status == "loading" || classroomLoading || testsLoading)
        return <LoadingPage />;

    if (session.status != "authenticated") {
        void signIn("email");
        return;
    }

    if (!classroom || !tests) return <OopsiePage />;

    return (
        <CardPanel>
            <div className="flex w-full flex-col items-center gap-6 xl:flex-row">
                <div className="flex flex-col items-center gap-6 md:flex-row">
                    <Card className=" h-full ">
                        <Link href={`/teacher`}>
                            <Button>Teacher panel</Button>
                        </Link>
                    </Card>
                    <Card className="h-full">
                        <div className="whitespace-nowrap">
                            {classroom.title} - {classroom.season}{" "}
                            {classroom.schoolYear}
                        </div>
                    </Card>
                    <Card className=" flex h-full flex-row items-center justify-center">
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
                            isOpen={
                                statusRemoving == "loading" ? true : undefined
                            }
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
                </div>
                <Card className=" h-full ">
                    <div className="flex w-full flex-row items-center justify-center gap-3">
                        <span className="cursor-default">
                            Link to join class:
                        </span>
                        <JoinClassLinker
                            linkUrl={`${window.location.origin}/join-class/${classId}`}
                        />
                    </div>
                </Card>
                <Card className=" h-full ">
                    <div className="flex w-full flex-row items-center justify-between">
                        Student link for test:{" "}
                        <select
                            onChange={(e) => {
                                selectTest(e.target.value);
                            }}
                            className="mx-1 rounded-sm border-[1px] border-amber-600 bg-stone-900 px-3 outline-none "
                            name="test-options"
                            id="test-options"
                        >
                            <option value={undefined}></option>
                            {tests.map((test) => {
                                return (
                                    <option
                                        id={`option-${test.id}`}
                                        className="relative rounded-sm bg-stone-900 hover:bg-stone-800"
                                        value={test.id}
                                    >
                                        {test.title}
                                    </option>
                                );
                            })}
                        </select>
                        <div className="ms-3">
                            {selectedTestId ? (
                                <div className="flex flex-row items-center gap-3">
                                    <span className="text-ellipsis hover:text-amber-700"></span>
                                    <TakeTestLinker
                                        linkUrl={`${window.location.origin}/take-test/${selectedTestId}/${classId}`}
                                    />
                                </div>
                            ) : (
                                "Select a test"
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            <Card className=" w-full">
                <SubmissionsList classroomId={classroom.id} />
            </Card>
        </CardPanel>
    );
};

const TakeTestLinker = ({ linkUrl }: { linkUrl: string | undefined }) => {
    if (!linkUrl?.length) {
        return <></>;
    }

    return (
        <CopyToClipboard
            onCopy={() => {
                toast("Copied to clipboard!", {
                    icon: (
                        <span className="click-button text-amber-600">
                            <HiClipboardCheck size={20} />
                        </span>
                    ),
                });
            }}
            text={linkUrl}
        >
            <span
                onMouseDown={(e) => {
                    e.currentTarget.classList.add("translate-y-[3px]");
                }}
                onMouseUp={(e) => {
                    e.currentTarget.classList.remove("translate-y-[3px]");
                }}
                className="ms-2 rounded-md bg-amber-600 p-1 text-stone-900 transition-all duration-100 hover:bg-amber-700 hover:text-stone-800"
            >
                <HiOutlineClipboardCopy size={24} />
            </span>
        </CopyToClipboard>
    );
};

const JoinClassLinker = ({ linkUrl }: { linkUrl: string | undefined }) => {
    if (!linkUrl) {
        return <></>;
    }

    return (
        <CopyToClipboard
            onCopy={(e) => {
                toast("Copied to clipboard!", {
                    icon: (
                        <span className="click-button text-amber-600">
                            <HiClipboardCheck size={20} />
                        </span>
                    ),
                });
            }}
            text={linkUrl}
        >
            <span
                onMouseDown={(e) => {
                    e.currentTarget.classList.add("translate-y-[3px]");
                }}
                onMouseUp={(e) => {
                    e.currentTarget.classList.remove("translate-y-[3px]");
                }}
                className="ms-2 rounded-md bg-amber-600 p-1 text-stone-900 transition-all duration-100 hover:bg-amber-700 hover:text-stone-800"
            >
                <HiOutlineClipboardCopy size={24} />
            </span>
        </CopyToClipboard>
    );
};

export default ClassPage;

type SubmissionsListProps = {
    classroomId: string;
};

const SubmissionsList = (props: SubmissionsListProps) => {
    const { data: submissions } = api.class.getSubmissions.useQuery({
        classId: props.classroomId,
    });

    if (!submissions) return "Loading...";

    return (
        <div className="flex w-full flex-col">
            <h1 className="mb-3">Submissions</h1>
            <div className="mb-1 flex flex-row justify-between gap-3">
                <div className="w-full">Email</div>
                <div className="grid w-full grid-cols-3 text-right">
                    <div>Test</div>
                    <div>Score</div>
                    <div>Date </div>
                </div>
            </div>
            <div className="w-full divide-y divide-stone-800">
                {submissions.map((submission, i: number) => {
                    return (
                        <div
                            key={i}
                            className="flex flex-row justify-between gap-3 py-1"
                        >
                            <div className="w-full">
                                {submission.testTaker.email}
                            </div>
                            <div className="grid w-full grid-cols-3 text-right">
                                <div>{submission.test.title}</div>
                                <div>
                                    {submission.score ? (
                                        `${submission.score}%`
                                    ) : (
                                        <Link
                                            href={`/teacher/grade-test/${submission.id}`}
                                        >
                                            <Button>Score</Button>
                                        </Link>
                                    )}
                                </div>
                                <div>
                                    {dtfmt({
                                        at: submission.submissionDate,
                                        ifNull: "Not found",
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
