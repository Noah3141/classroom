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
import { api } from "~/utils/api";
import { type SubmissionWithFullTest } from "~/utils/api";
import { alphabetize } from "~/utils/tools";

const GradeTestPage = () => {
    const { data, status } = useSession();
    const router = useRouter();

    const urlSubmissionId = (router.query.submissionId as string) ?? null;

    const { data: submission, isLoading: testLoading } =
        api.submission.getWithTest.useQuery({
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

    if (status == "loading" || testLoading) return <LoadingPage />;

    if (status != "authenticated") {
        void signIn("email");
        return;
    }
    if (!submission) {
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
                    {submission.class.title} - {submission.class.season}{" "}
                    {submission.class.schoolYear}
                </h1>
                <h2 className="mb-12 text-center text-lg">
                    {submission.test.title}
                </h2>
                <div>
                    <ChoiceQuestions submission={submission} />
                </div>
                <div>
                    <TextQuestions submission={submission} />
                </div>
                <div>
                    <GradeReadout submission={submission} />
                </div>
            </div>
        </CardPanel>
    );
};

export default GradeTestPage;

const TextQuestions = ({
    submission,
}: {
    submission: SubmissionWithFullTest;
}) => {
    if (!submission.test.textQuestions.length) {
        return <></>;
    }
    return (
        <div className="mt-12">
            <h3 className="mb-6">Response questions</h3>
            <div>
                {submission.test.textQuestions.map((tq, tqi) => {
                    return (
                        <div key={tqi}>
                            <h4 className="mb-3">{tq.prompt}</h4>
                            <div className="rounded-md border border-amber-600 p-3">
                                {
                                    submission.textAnswers.find(
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

const ChoiceQuestions = ({
    submission,
}: {
    submission: SubmissionWithFullTest;
}) => {
    const [detailsExpanded, setDetailsExpanded] = useState<string | null>(null);

    if (!submission.test.choiceQuestions.length) {
        return <></>;
    }
    return (
        <div>
            <h3 className="mb-6">Choice questions</h3>
            <div className="flex flex-col gap-6 ps-8 md:px-6">
                {submission.test.choiceQuestions.map((cq, cqi) => {
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
                            <div className="grid grid-cols-1 gap-y-2 md:grid-cols-2 md:gap-3">
                                {cq.choices.map((c, ci) => {
                                    const isSubmissionsAnswer: boolean =
                                        submission.choiceAnswers[cqi]!.value ===
                                        ci;

                                    const correctAnswer =
                                        cq.correctAnswer == ci;

                                    const iconSide =
                                        ci % 2 == 0 ? "left" : "right";

                                    return (
                                        <span
                                            key={ci}
                                            className={`relative  rounded-sm border-[1px] p-1 ${
                                                isSubmissionsAnswer
                                                    ? "border-amber-600"
                                                    : "border-transparent"
                                            }
                                            ${
                                                correctAnswer
                                                    ? "bg-[#8dfa2e25]"
                                                    : ""
                                            }
                                            ${
                                                isSubmissionsAnswer &&
                                                !correctAnswer
                                                    ? "bg-[#ff4d3130]"
                                                    : ""
                                            }
                                            `}
                                            id={`${cq.id}-${ci}`}
                                        >
                                            {(isSubmissionsAnswer ||
                                                correctAnswer) && (
                                                <Tooltip
                                                    anchorSelect={`#${cq.id}-${ci}`}
                                                >
                                                    <span className="text-amber-600">
                                                        <div>
                                                            {correctAnswer &&
                                                                "Correct answer"}
                                                        </div>
                                                        <div>
                                                            {isSubmissionsAnswer &&
                                                                "Student answer"}
                                                        </div>
                                                    </span>
                                                </Tooltip>
                                            )}
                                            <span>
                                                {alphabetize(ci)}. {c}
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
                                                <AnswerStats
                                                    ci={ci}
                                                    questionId={cq.id}
                                                    submission={submission}
                                                />
                                            </span>
                                        </span>
                                    );
                                })}
                            </div>
                            <div
                                className={`flex flex-col justify-between transition-all duration-300 ${
                                    expanded
                                        ? "h-96 overflow-y-auto"
                                        : "h-0 overflow-y-hidden"
                                }`}
                            >
                                <div className="h-full border-y border-amber-600 bg-stone-950 md:m-3 md:rounded-md md:border-x">
                                    <NormalDist
                                        question={cq}
                                        questionId={cq.id}
                                        submission={submission}
                                    />
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

const NormalDist = ({
    submission,
    questionId,
    question,
}: {
    questionId: string;
    question: ChoiceQuestion;
    submission: SubmissionWithFullTest;
}) => {
    // const answers = submission.choiceAnswers
    //     .filter((answer) => answer.questionId == question.id)
    //     .sort((a, b) => b.frequency - a.frequency);

    // console.log(answers);
    // const gaussian: ChoiceAnswer[] = [];
    // let side = true;
    // while (answers.length) {
    //     const nextHighest = answers.pop();
    //     if (!nextHighest) {
    //         return;
    //     }
    //     side ? gaussian.push(nextHighest) : gaussian.unshift(nextHighest);
    //     side = !side;
    // }
    const answersForThisQuestion = submission.allSubmissions
        .map((submission) => {
            return submission.choiceAnswers.filter(
                (ca) => ca.questionId == questionId,
            );
        })
        .flat(1);

    type ChoiceStat = {
        value: number;
        prompt: string;
        frequency: number;
    };

    const choices = question.choices.map((choice, ci, choicesList) => {
        let chosenCount = 0;
        answersForThisQuestion.map((answer) => {
            if (answer.value == ci) {
                chosenCount += 1;
            }
        });
        const labeledChoice = {
            value: ci,
            prompt: choice,
            frequency: chosenCount / answersForThisQuestion.length,
        };
        if (question.prompt.startsWith("What is the capital")) {
            console.log(labeledChoice);
        }

        return labeledChoice;
    });
    if (question.prompt.startsWith("What is the capital")) {
        console.log("Choices: ", choices);
    }

    choices.sort((a, b) => a.frequency - b.frequency);

    const gaussian: ChoiceStat[] = [];
    let side = true;
    while (choices.length) {
        const nextHighest = choices.pop();
        if (!nextHighest) {
            return;
        }
        side ? gaussian.push(nextHighest) : gaussian.unshift(nextHighest);
        side = !side;
    }

    return (
        <div className="flex h-full w-full flex-row justify-between gap-3 p-6">
            {gaussian.map((answer, i) => {
                return (
                    <div
                        key={i}
                        className="mx-auto flex flex-col items-center "
                    >
                        <div className="flex h-full flex-col  justify-end border-b border-t border-amber-500">
                            <Bar percentage={answer.frequency * 100} />
                        </div>
                        <div className="h-6 ">{alphabetize(answer.value)}</div>
                        <div className="h-6">
                            {(answer.frequency * 100).toFixed(2)}%
                        </div>
                    </div>
                );
            })}
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

const AnswerStats = ({
    submission,
    questionId,
    ci,
}: {
    questionId: string;
    ci: number;
    submission: SubmissionWithFullTest;
}) => {
    const answersForThisQuestion = submission.allSubmissions
        .map((submission) => {
            return submission.choiceAnswers.filter(
                (ca) => ca.questionId == questionId,
            );
        })
        .flat(1);

    let chosenCount = 0;
    answersForThisQuestion.forEach((answer) => {
        if (answer.value == ci) {
            chosenCount += 1;
        }
    });
    const frequencyChosen = chosenCount / answersForThisQuestion.length;

    return <div>{`${(frequencyChosen * 100).toFixed(0)}%` ?? ""}</div>;
};

const GradeReadout = ({
    submission,
}: {
    submission: SubmissionWithFullTest;
}) => {
    return <div></div>;
};
