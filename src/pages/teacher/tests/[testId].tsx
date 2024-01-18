import { ChoiceQuestion, TextQuestion } from "@prisma/client";
import { InferGetServerSidePropsType } from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { Tooltip } from "react-tooltip";
import Button from "~/components/Button";
import Card from "~/components/Card";
import CardPanel from "~/components/CardPanel";
import LoadingPage from "~/components/LoadingPage";
import OopsiePage from "~/components/OopsiePage";
import { db } from "~/server/db";
import { api } from "~/utils/api";
import { dtfmt } from "~/utils/datetimeFormatter";
import { alphabetize } from "~/utils/tools";

const TestPanelPage = () => {
    const { data, status } = useSession();
    const router = useRouter();

    const urlTestId = (router.query.testId as string) ?? null;

    const { data: test, isLoading: testLoading } = api.test.getById.useQuery({
        testId: urlTestId,
    });

    const { data: classrooms, isLoading: classesLoading } =
        api.class.getByTeacherId.useQuery();

    const dataState = api.useContext();
    const removeTestToastId = "RemoveTestToastId";
    const { mutate: removeTest, status: statusRemoving } =
        api.test.remove.useMutation({
            onMutate: () => {
                toast.loading("Loading...", { id: removeTestToastId });
            },
            onSuccess: () => {
                void dataState.test.invalidate();
                void router.push("/teacher");
                toast.success("Success!", { id: removeTestToastId });
            },
            onError: (e) => {
                toast.error(e.message, { id: removeTestToastId });
            },
        });

    const [filterByClass, setFilterByClass] = useState<boolean | null>(null);

    const [classroom, setClassroom] = useState(
        test?.submissions.at(0)?.classId ?? null,
    );

    if (status == "loading" || testLoading) return <LoadingPage />;

    if (status != "authenticated") {
        void signIn("email");
        return;
    }
    if (!test) {
        return <OopsiePage />;
    }

    const SubmissionsList = test.submissions.length ? (
        test.submissions.map((submission) => {
            if (filterByClass && submission.classId !== classroom) return <></>;

            return (
                <div className="flex flex-row justify-between gap-3">
                    <div className="w-1/2">{submission.testTaker.email}</div>
                    <div className="grid w-full grid-cols-2 text-right">
                        <div>{submission.score ?? "Not yet graded"}</div>
                        <div>{dtfmt({ at: submission.submissionDate })}</div>
                    </div>
                    <div></div>
                </div>
            );
        })
    ) : (
        <div>No submissions yet</div>
    );

    const ChoiceQuestions = test.choiceQuestions.length ? (
        test.choiceQuestions.map((cq: ChoiceQuestion, i) => {
            return (
                <div className="flex flex-col gap-1 p-1">
                    <div className="flex flex-row gap-3">
                        <span>{i + 1}.</span> <div>{cq.prompt}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 p-2">
                        {cq.choices.map((choice, i) => {
                            const correct = i === cq.correctAnswer;

                            return (
                                <div className="relative col-span-1">
                                    {correct && (
                                        <div className="absolute -left-4">
                                            {">"}
                                        </div>
                                    )}
                                    {alphabetize(i)}. {choice}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        })
    ) : (
        <div>None</div>
    );

    const TextQuestions = test.textQuestions.length ? (
        test.textQuestions.map((tq: TextQuestion, i) => {
            return (
                <div className="flex flex-row gap-3 p-1">
                    <span>{i + 1}. </span>
                    <div>{tq.prompt}</div>
                </div>
            );
        })
    ) : (
        <div>None</div>
    );

    const ClassroomOptions = classrooms?.map((classroom) => {
        return (
            <option value={classroom.id}>
                {classroom.title} - {classroom.season} {classroom.schoolYear}
            </option>
        );
    });

    return (
        <CardPanel>
            <div className="flex flex-col gap-6 lg:flex-row">
                <Card className="flex w-1/2 flex-col">
                    <h1>{test.title}</h1>
                    <div className="flex flex-row gap-3">
                        {classesLoading ? (
                            ""
                        ) : (
                            <div>
                                <span>Class: </span>
                                <select
                                    onChange={(e) => {
                                        setClassroom(e.target.value);
                                    }}
                                    className="rounded-sm bg-stone-950 p-1 outline-none hover:cursor-pointer hover:bg-stone-800 focus:cursor-text focus:bg-stone-950 focus:ring-2 focus:ring-amber-600"
                                    name=""
                                    id=""
                                >
                                    <option value={undefined}></option>
                                    {ClassroomOptions}
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="mt-6">
                        <div>Submissions:</div>
                        <div className="divide flex flex-col divide-stone-700">
                            {SubmissionsList}
                        </div>
                    </div>
                </Card>
                <div className="flex w-6/12 flex-col gap-6 xl:flex-row">
                    <Card className="w-full">
                        <div className="flex w-full flex-col gap-12">
                            <div className="w-full">
                                <h1>Multiple choice questions</h1>
                                <div className="mt-6 w-full divide-y divide-stone-800">
                                    {ChoiceQuestions}
                                </div>
                            </div>
                            <div>
                                <h1>Response questions</h1>
                                <div className="mt-6 w-full divide-y divide-stone-800">
                                    {TextQuestions}
                                </div>
                            </div>
                        </div>
                    </Card>
                    <div className="flex w-full flex-col gap-6 md:flex-row lg:w-1/6 xl:flex-col">
                        <Card className="justify-center">
                            <Button
                                onClick={() => {
                                    if (!urlTestId) {
                                        toast.error(
                                            "The current page isn't doing well... Try coming back later!",
                                        );
                                        return;
                                    }
                                    void router.push(
                                        `/create-test?testId=${urlTestId}`,
                                    );
                                }}
                                id="copy-to-draft"
                            >
                                Copy to Draft
                            </Button>
                            <Tooltip anchorSelect="#copy-to-draft">
                                <span className="text-amber-600">
                                    Create a new test, starting from a copy of
                                    this one
                                </span>
                            </Tooltip>
                        </Card>
                        <Card className="col-span-1 flex justify-center">
                            <Link href={`/teacher`}>
                                <Button>Teacher panel</Button>
                            </Link>
                        </Card>
                        <Card className=" flex-row-reverse items-center justify-center gap-3">
                            <span>{data.user.name}</span>
                            <Button
                                className="whitespace-nowrap"
                                onClick={() => {
                                    void signOut();
                                }}
                            >
                                Sign Out
                            </Button>
                        </Card>
                        <Card className="col-span-2 flex  w-full flex-row items-center justify-center">
                            <span id="remove-test-1" className="click-span">
                                Remove test
                            </span>
                            <Tooltip
                                place="bottom"
                                clickable
                                anchorSelect="#remove-test-1"
                                delayHide={1500}
                                delayShow={200}
                            >
                                <span id="remove-test-2" className="click-span">
                                    Are you sure?
                                </span>
                            </Tooltip>
                            <Tooltip
                                place="bottom"
                                clickable
                                isOpen={
                                    statusRemoving == "loading"
                                        ? true
                                        : undefined
                                }
                                anchorSelect="#remove-test-2"
                                delayHide={0}
                                delayShow={200}
                            >
                                <span
                                    onClick={() => {
                                        removeTest({
                                            testId: test.id,
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
                </div>
            </div>
        </CardPanel>
    );
};

export default TestPanelPage;
