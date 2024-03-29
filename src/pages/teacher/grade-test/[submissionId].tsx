import { ChoiceAnswer, ChoiceQuestion, TextQuestion } from "@prisma/client";
import { InferGetServerSidePropsType } from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Tooltip } from "react-tooltip";
import Button from "~/components/Button";
import Card from "~/components/Card";
import CardPanel from "~/components/CardPanel";
import LoadingPage from "~/components/LoadingPage";
import OopsiePage from "~/components/OopsiePage";
import { db } from "~/server/db";
import { SubmissionWithTestAndStats, api } from "~/utils/api";
import { alphabetize } from "~/utils/tools";
import {
    ChoiceQuestionWithStats,
    type ChoiceWithStats,
} from "~/server/api/utils/dataCombinations";

const GradeTestPage = () => {
    const { status } = useSession();
    const router = useRouter();

    const urlSubmissionId = (router.query.submissionId as string) ?? null;

    const { data, isLoading: dataLoading } =
        api.submission.getWithTestAndStats.useQuery({
            submissionId: urlSubmissionId,
        });

    const dataState = api.useUtils();
    const updateGradeToast = "UpdateGradeToastId";
    const { mutate: updateSubmissionGrade, status: gradeUpdateLoading } =
        api.submission.grade.useMutation({
            onMutate: () => {
                toast.loading("Loading...", { id: updateGradeToast });
            },
            onSuccess: () => {
                void dataState.test.invalidate();

                toast.success("Success!", { id: updateGradeToast });
            },
            onError: (e) => {
                toast.error(e.message, { id: updateGradeToast });
            },
        });

    if (status == "loading" || dataLoading) return <LoadingPage />;

    if (status != "authenticated") {
        void signIn("email");
        return;
    }
    if (!data) {
        return <OopsiePage />;
    }

    return (
        <CardPanel>
            <div className="absolute left-6 top-6 transition-all">
                <Link href={`/teacher`}>
                    <span className="click-span ">{"<"} back</span>
                </Link>
            </div>
            <div className="mx-auto flex w-full max-w-6xl flex-col">
                <h1 className="mb-3 text-center text-xl">
                    {data.submission.class.title} -{" "}
                    {data.submission.class.season}{" "}
                    {data.submission.class.schoolYear}
                </h1>
                <h2 className="mb-12 text-center text-lg">{data.test.title}</h2>
                <div>
                    <ChoiceQuestions data={data} />
                </div>
                <div>
                    <TextQuestions data={data} />
                </div>
                <div>
                    <GradeReadout data={data} />
                </div>
            </div>
        </CardPanel>
    );
};

export default GradeTestPage;

const TextQuestions = ({ data }: { data: SubmissionWithTestAndStats }) => {
    if (!data.test.textQuestions.length) {
        return <></>;
    }
    return (
        <div className="mt-12">
            <h3 className="mb-6">Response questions</h3>
            <div>
                {data.test.textQuestions.map((tq, tqi) => {
                    return (
                        <div key={tqi}>
                            <h4 className="mb-3">{tq.prompt}</h4>
                            <div className="rounded-md border border-amber-600 p-3">
                                {
                                    data.submission.textAnswers.find(
                                        (a) => tq.id == a.questionId,
                                    )?.value
                                }
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ChoiceQuestions = ({ data }: { data: SubmissionWithTestAndStats }) => {
    const [detailsExpanded, setDetailsExpanded] = useState<string | null>(null);

    if (!data.test.choiceQuestions.length) {
        return <></>;
    }
    return (
        <div>
            <h3 className="mb-6">Choice questions</h3>
            <div className="flex flex-col gap-6 ps-8 md:px-6">
                {data.test.choiceQuestions.map((cq, cqi) => {
                    const expanded: boolean = detailsExpanded == cq.id;

                    return (
                        <div
                            onClick={() => {
                                setDetailsExpanded(cq.id);
                            }}
                            className={`cursor-pointer rounded-md border  duration-200 hover:border-amber-600 hover:bg-stone-900 md:p-2 ${
                                expanded
                                    ? "border-amber-600"
                                    : "border-transparent"
                            }`}
                            id={`question-${cqi}`}
                            key={cqi}
                        >
                            <h4 className="mb-3">
                                {cqi + 1}. {cq.prompt}
                            </h4>
                            <ChoiceAnswerList
                                choiceQuestionIndex={cqi}
                                choiceQuestion={cq}
                                choiceAnswers={data.submission.choiceAnswers}
                            />
                            <div
                                className={`flex flex-col justify-between transition-all duration-300 ${
                                    expanded
                                        ? "h-96 overflow-y-auto"
                                        : "h-0 overflow-y-hidden"
                                }`}
                            >
                                <div className="h-full border-y border-amber-600 bg-stone-950 md:m-3 md:rounded-md md:border-x">
                                    <NormalDist question={{ ...cq }} />
                                </div>
                                <div className="flex flex-row justify-end px-3">
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDetailsExpanded(null);
                                        }}
                                        className="click-span"
                                    >
                                        Collapse
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ChoiceAnswerList = ({
    choiceQuestion,
    choiceAnswers,
    choiceQuestionIndex,
}: {
    choiceAnswers: ChoiceAnswer[];
    choiceQuestion: ChoiceQuestionWithStats;
    choiceQuestionIndex: number;
}) => {
    return (
        <div className="grid grid-cols-1 gap-y-2 md:grid-cols-2 md:gap-3">
            {choiceQuestion.choices.map((c, ci) => {
                const isSubmissionsAnswer: boolean =
                    choiceAnswers[choiceQuestionIndex]!.value === ci;

                const correctAnswer = choiceQuestion.correctAnswer == ci;

                const iconSide = ci % 2 == 0 ? "left" : "right";

                return (
                    <span
                        key={ci}
                        className={`relative  rounded-sm border-[1px] p-1 ${
                            isSubmissionsAnswer
                                ? "border-amber-600"
                                : "border-transparent"
                        }
                    ${correctAnswer ? "bg-[#8dfa2e25]" : ""}
                    ${
                        isSubmissionsAnswer && !correctAnswer
                            ? "bg-[#ff4d3130]"
                            : ""
                    }
                    `}
                        id={`${choiceQuestion.id}-${ci}`}
                    >
                        {(isSubmissionsAnswer || correctAnswer) && (
                            <Tooltip
                                anchorSelect={`#${choiceQuestion.id}-${ci}`}
                            >
                                <span className="text-amber-600">
                                    <div>
                                        {correctAnswer && "Correct answer"}
                                    </div>
                                    <div>
                                        {isSubmissionsAnswer &&
                                            "Student answer"}
                                    </div>
                                </span>
                            </Tooltip>
                        )}
                        <span>
                            {alphabetize(ci)}. {c.text}
                        </span>
                        <span
                            className={`absolute ${
                                iconSide == "left" &&
                                "-left-4 -translate-x-full"
                            }
                        ${
                            iconSide == "right" &&
                            "-left-4 -translate-x-full md:-right-4 md:translate-x-full"
                        }
                        `}
                        >
                            <div>
                                {`${(c.frequencyChosen * 100).toFixed(0)}%` ??
                                    ""}
                            </div>
                        </span>
                    </span>
                );
            })}
        </div>
    );
};

const NormalDist = ({ question }: { question: ChoiceQuestionWithStats }) => {
    const [arrangement, setArrangement] = useState<
        "gaussian" | "alphabetical" | "frequency"
    >("alphabetical");

    const choices = [...question.choices];
    choices.sort((a, b) => a.frequencyChosen - b.frequencyChosen);

    let displayChoices: ChoiceWithStats[] = [];

    switch (arrangement) {
        case "gaussian":
            let side = true;
            while (choices.length) {
                const nextHighest = choices.pop();
                if (!nextHighest) {
                    return;
                }
                side
                    ? displayChoices.push(nextHighest)
                    : displayChoices.unshift(nextHighest);
                side = !side;
            }
            break;

        case "alphabetical":
            displayChoices = choices;
            displayChoices.sort(
                (choiceA, choiceB) => choiceA.value - choiceB.value,
            );
            break;
        case "frequency":
            displayChoices = choices;
            displayChoices.sort(
                (choiceA, choiceB) =>
                    choiceB.frequencyChosen - choiceA.frequencyChosen,
            );
            break;
    }

    return (
        <div className="flex h-full flex-row">
            <div className="flex h-full  flex-col justify-center gap-6  p-6 ">
                <Button
                    onClick={() => {
                        setArrangement("alphabetical");
                    }}
                    selected={arrangement == "alphabetical"}
                >
                    Original
                </Button>
                <Button
                    onClick={() => {
                        setArrangement("gaussian");
                    }}
                    selected={arrangement == "gaussian"}
                >
                    Gaussian
                </Button>
                <Button
                    onClick={() => {
                        setArrangement("frequency");
                    }}
                    selected={arrangement == "frequency"}
                >
                    Frequency
                </Button>
            </div>
            <div className="flex h-full w-full flex-row justify-between gap-3  p-6">
                {displayChoices.map((answer, i) => {
                    return (
                        <div
                            key={i}
                            id={`${question.id}-answer-${i}`}
                            className="mx-auto flex flex-col items-center "
                        >
                            <div className="flex h-full flex-col  justify-end border-b-2 border-t border-amber-700 py-[1px]">
                                <Bar
                                    percentage={answer.frequencyChosen * 100}
                                />
                            </div>
                            <div className="h-6 ">
                                {alphabetize(answer.value)}
                            </div>
                            <div className="h-6">
                                {(answer.frequencyChosen * 100).toFixed(2)}%
                            </div>
                            <Tooltip
                                place="bottom"
                                opacity={100}
                                anchorSelect={`#${question.id}-answer-${i}`}
                            >
                                <span className="text-amber-600">
                                    {answer.text}
                                </span>
                            </Tooltip>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
const Bar = ({ percentage }: { percentage: number }) => {
    return (
        <div
            style={{ height: `${percentage}%` }}
            className={`w-4 bg-amber-500 `}
        ></div>
    );
};

// const processState = ({
//     submission,
//     questionId,
// }: {
//     questionId: string;
//     submission: SubmissionWithFullTest;
// }) => {};

const GradeReadout = ({ data }: { data: SubmissionWithTestAndStats }) => {
    return <div></div>;
};
