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
import { api } from "~/utils/api";
import CopyToClipboard from "react-copy-to-clipboard";
import { HiOutlineClipboardCopy, HiClipboardCheck } from "react-icons/hi";

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

    const [testLink, setTestLink] = useState<string | null>(null);
    const linkTag = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        setTestLink(linkTag.current?.href ?? null);
    }, [selectedTestId, linkTag]);

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
            <Card className="col-span-4 w-full">
                <div className="whitespace-nowrap">
                    {classroom.title} - {classroom.season}{" "}
                    {classroom.schoolYear}
                </div>
            </Card>
            <Card className="col-span-8 w-full">
                Link to join class: <span>{`/join-class/${classroom.id}`}</span>
            </Card>
            <Card className="col-span-8 w-full ">
                <div>
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
                                    className="rounded-sm bg-stone-900 hover:bg-stone-800"
                                    value={test.id}
                                >
                                    {test.title}
                                </option>
                            );
                        })}
                    </select>
                    <div className="mt-6">
                        {selectedTestId ? (
                            <div className="flex flex-row items-center gap-3">
                                <Link
                                    ref={linkTag}
                                    className="text-ellipsis hover:text-amber-700"
                                    href={`/take-test/${selectedTestId}/${classId}`}
                                >
                                    {testLink}
                                </Link>
                                <CopyToClipboard
                                    onCopy={() => {
                                        if (testLink) {
                                            toast("Copied to clipboard!", {
                                                icon: (
                                                    <span className="text-amber-600">
                                                        <HiClipboardCheck
                                                            size={20}
                                                        />
                                                    </span>
                                                ),
                                            });
                                        } else {
                                            toast.error(
                                                "Something's broken..",
                                                { id: "copy-link-broke" },
                                            );
                                        }
                                    }}
                                    text={testLink ?? ""}
                                >
                                    <span className="rounded-md bg-amber-600 p-1 text-stone-900 hover:bg-amber-700 hover:text-stone-800">
                                        <HiOutlineClipboardCopy size={24} />
                                    </span>
                                </CopyToClipboard>
                            </div>
                        ) : (
                            "Select a test"
                        )}
                    </div>
                </div>
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
