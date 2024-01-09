import { type ChoiceQuestion, type TextQuestion } from "@prisma/client";
import { InferMutationLikeData } from "@trpc/react-query/shared";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { Dispatch, SetStateAction, useState } from "react";
import toast from "react-hot-toast";
import Button from "~/components/Button";
import CardPanel from "~/components/CardPanel";
import LoadingPage from "~/components/LoadingPage";
import OopsiePage from "~/components/OopsiePage";
import { SubmitTestForm } from "~/server/api/routers/student";
import {
    ClassGottenById,
    SubmitTestRes,
    TestGottenById,
    api,
} from "~/utils/api";
import { alphabetize } from "~/utils/tools";

import { PiChecks } from "react-icons/pi";
import Link from "next/link";
import { z } from "zod";

const TakeTestPage = () => {
    const session = useSession();
    const router = useRouter();

    const testId = router.query.testId ? (router.query.testId as string) : null;
    const classId = router.query.classId
        ? (router.query.classId as string)
        : null;

    const { data: test, isLoading: testLoading } = api.test.getById.useQuery({
        testId: testId,
    });

    const { data: classroom, isLoading: classroomLoading } =
        api.class.getById.useQuery({
            classId: classId,
        });

    if (session.status == "loading" || testLoading || classroomLoading)
        return <LoadingPage />;

    if (session.status != "authenticated") {
        void signIn("email");
        return;
    }

    if (!test || !classroom) {
        return <OopsiePage />;
    }

    return (
        <CardPanel>
            <Test test={test} classroom={classroom} />
        </CardPanel>
    );
};

export default TakeTestPage;

type TestProps = {
    test: TestGottenById;
    classroom: ClassGottenById;
};

type TestForm = {
    classId: string;
    testId: string;
    textAnswers: {
        value?: string;
        questionId: string;
    }[];
    choiceAnswers: {
        value?: number;
        questionId: string;
    }[];
};

const Test = ({ test, classroom }: TestProps) => {
    const BlankTest: TestForm = {
        testId: test.id,
        classId: classroom.id,
        choiceAnswers: test.choiceQuestions.map((q: ChoiceQuestion) => ({
            questionId: q.id,
            value: undefined,
        })),
        textAnswers: test.textQuestions.map((q: TextQuestion) => ({
            questionId: q.id,
            value: undefined,
        })),
    };

    const [submitted, setSubmitted] = useState(false);
    const submitTestToast = "SubmitTestToastId";
    const dataState = api.useUtils();
    const { mutate: submitTest, status: statusSubmittingTest } =
        api.student.submitTest.useMutation({
            onMutate: () => {
                toast.loading("Loading...", { id: submitTestToast });
            },
            onSuccess: (res: SubmitTestRes) => {
                toast.success("Success!", { id: submitTestToast });
                setSubmitted(true);
                void dataState.test.invalidate();
            },
            onError: (e) => {
                if (e.message.includes("already submitted")) {
                    setSubmitted(true);
                }
                toast.error(e.message, { id: submitTestToast });
            },
        });

    const [form, setForm] = useState<TestForm>(BlankTest);

    return (
        <div className="col-span-full mx-auto h-full w-full max-w-[1000px]">
            <h1 className="mb-12 text-center text-lg">
                {test.title} - {classroom.title}
            </h1>
            <form className="flex flex-col gap-12">
                <div>
                    <h2 className="mb-6">Multiple choice questions</h2>
                    <div className="flex flex-col gap-12">
                        {test.choiceQuestions.map((cq, cqi) => {
                            return (
                                <ChoiceQuestion
                                    question={cq}
                                    iter={cqi}
                                    form={form}
                                    setForm={setForm}
                                />
                            );
                        })}
                    </div>
                </div>
                <div>
                    <h2 className="mb-6">Response questions</h2>
                    <div className="flex flex-col gap-6">
                        {test.textQuestions.map((tq, tqi) => {
                            return (
                                <TextQuestion
                                    question={tq}
                                    iter={tqi}
                                    form={form}
                                    setForm={setForm}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className="relative mb-6 flex flex-row items-center justify-center">
                    {submitted && (
                        <Link href={`/student`}>
                            <span className="click-span absolute left-0">
                                {"< Go home"}
                            </span>
                        </Link>
                    )}
                    <Button
                        status={statusSubmittingTest}
                        onClick={(e) => {
                            e.preventDefault();
                            try {
                                const validatedForm = validateForm(form);
                                submitTest(validatedForm);
                            } catch (err) {
                                if (err instanceof Error) {
                                    toast.error(
                                        "Don't forget to answer all questions!",
                                    );
                                    const input = document.getElementById(
                                        err.message,
                                    );
                                    if (!input) {
                                        throw new Error(err.message);
                                    }
                                    input.scrollIntoView();
                                    const highlights = [
                                        "ring-1",
                                        "ring-red-500",
                                        "ring-offset-4",
                                    ];
                                    input.classList.add(...highlights);
                                    input.onfocus = (e) => {
                                        input.classList.remove(...highlights);
                                    };
                                } else {
                                    throw err;
                                }
                            }
                        }}
                    >
                        Submit Test
                    </Button>
                </div>
            </form>
        </div>
    );
};

function validateForm(form: TestForm): SubmitTestForm {
    const choiceAnswers = form.choiceAnswers.map((ca, cai) => {
        try {
            const validAnswer = z
                .object({ value: z.number(), questionId: z.string() })
                .parse(ca);
            return validAnswer;
        } catch {
            const e = new Error(ca.questionId);
            throw e;
        }
    });

    const textAnswers = form.textAnswers.map((ta, tai) => {
        try {
            const validAnswer = z
                .object({
                    value: z.string(),
                    questionId: z.string(),
                })
                .parse(ta);
            return validAnswer;
        } catch {
            const e = new Error(ta.questionId);
            throw e;
        }
    });

    const validatedForm: SubmitTestForm = {
        ...form,
        choiceAnswers: choiceAnswers,
        textAnswers: textAnswers,
    };

    return validatedForm;
}

type ChoiceQuestionProps = {
    question: ChoiceQuestion;
    iter: number;
    form: TestForm;
    setForm: Dispatch<SetStateAction<TestForm>>;
};
const ChoiceQuestion = (props: ChoiceQuestionProps) => {
    const questionInQuestion = props.form.choiceAnswers.at(props.iter);

    if (!questionInQuestion) {
        throw new Error("How did this happen");
    }

    return (
        <div className="rounded-sm" id={`question-${props.iter}`}>
            <h3 className="mb-3">
                {props.iter + 1}. {props.question.prompt}
            </h3>
            <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">
                {props.question.choices.map((c, ci) => {
                    const selected = questionInQuestion.value == ci;

                    return (
                        <label
                            className={`rounded-sm p-1 ring-amber-600 hover:bg-stone-900 ${
                                selected ? "z-10 ring-1" : ""
                            }`}
                            htmlFor={`${props.question.id}-${ci}`}
                        >
                            <input
                                onChange={(e) => {
                                    props.setForm((p) => {
                                        const newQuestion = {
                                            ...questionInQuestion,
                                            value: parseInt(e.target.value),
                                        };

                                        const newList = [...p.choiceAnswers];

                                        newList[props.iter] = newQuestion;

                                        return {
                                            ...p,
                                            choiceAnswers: newList,
                                        };
                                    });
                                }}
                                name={`${props.question.id}`}
                                className="hidden"
                                id={`${props.question.id}-${ci}`}
                                type="radio"
                                value={ci}
                            />
                            <span>
                                {alphabetize(ci)}. {c}
                            </span>
                        </label>
                    );
                })}
            </div>
        </div>
    );
};

type TextQuestionProps = {
    question: TextQuestion;
    iter: number;
    form: TestForm;
    setForm: Dispatch<SetStateAction<TestForm>>;
};
const TextQuestion = (props: TextQuestionProps) => {
    //
    const questionInQuestion = props.form.textAnswers.at(props.iter);

    if (!questionInQuestion) {
        throw new Error("How did this happen");
    }

    switch (props.question.type) {
        case "Phrase":
            return (
                <div>
                    <h1>{props.question.prompt}</h1>
                    <div>
                        <input
                            placeholder="Enter response here"
                            onChange={(e) => {
                                props.setForm((p) => {
                                    const newList = [...p.textAnswers];

                                    newList[props.iter] = {
                                        ...questionInQuestion,
                                        value: e.target.value,
                                    };

                                    return {
                                        ...p,
                                        textAnswers: newList,
                                    };
                                });
                            }}
                            className="test-input"
                            id={`tq-${props.iter}`}
                            type="text"
                        />
                    </div>
                </div>
            );
        case "ShortAnswer":
            return (
                <div>
                    <h1>{props.question.prompt}</h1>
                    <div>
                        <textarea
                            placeholder="Enter response here"
                            name=""
                            id={`tq-${props.iter}`}
                            onChange={(e) => {
                                props.setForm((p) => {
                                    const newList = [...p.textAnswers];

                                    newList[props.iter] = {
                                        ...questionInQuestion,
                                        value: e.target.value,
                                    };

                                    return {
                                        ...p,
                                        textAnswers: newList,
                                    };
                                });
                            }}
                            value={props.form.textAnswers.at(props.iter)?.value}
                            className="test-input h-36 resize-none p-2"
                        />
                    </div>
                </div>
            );
        case "Essay":
            return (
                <div>
                    <h1>{props.question.prompt}</h1>
                    <div>
                        <textarea
                            placeholder="Enter response here"
                            onChange={(e) => {
                                props.setForm((p) => {
                                    const newList = [...p.textAnswers];

                                    newList[props.iter] = {
                                        ...questionInQuestion,
                                        value: e.target.value,
                                    };

                                    return {
                                        ...p,
                                        textAnswers: newList,
                                    };
                                });
                            }}
                            name=""
                            id={`tq-${props.iter}`}
                            className="test-input h-[1000px] min-h-96"
                        ></textarea>
                    </div>
                </div>
            );
    }
};
