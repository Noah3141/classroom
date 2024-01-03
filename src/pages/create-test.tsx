import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useState } from "react";
import toast from "react-hot-toast";
import Button from "~/components/Button";
import CardPanel from "~/components/CardPanel";
import LoadingPage from "~/components/LoadingPage";
import {
    type CreateTestForm,
    type ChoiceQuestion,
    type TextQuestion,
} from "~/server/api/routers/test";
import { api } from "~/utils/api";
import { Tooltip } from "react-tooltip";
import Link from "next/link";
import { alphabetize } from "~/utils/tools";

const tqParse = (type: "Phrase" | "ShortAnswer" | "Essay"): string => {
    switch (type) {
        case "Essay":
            return "Essay";
        case "Phrase":
            return "Phrase";
        case "ShortAnswer":
            return "Short answer";
        default:
            return "Text question";
    }
};

const defaultCq: ChoiceQuestion = {
    choices: ["", "", "", ""],
    correctAnswer: 0,
    prompt: "",
};

const blankForm = {
    title: null,
    choiceQuestions: [],
    textQuestions: [],
};

const CreateTestPage = () => {
    const { data, status } = useSession();
    const router = useRouter();

    const testId = router.query.testId ? (router.query.testId as string) : null;

    const { data: initialTest } = api.test.getById.useQuery({ testId: testId });

    const [form, setForm] = useState<CreateTestForm>(initialTest ?? blankForm);

    const dataState = api.useContext();
    const submitTestToast = "submitTestToast";
    const { mutate: submitTestForm, status: submitTestStatus } =
        api.test.create.useMutation({
            onMutate: () => {
                toast.loading("Loading...", { id: submitTestToast });
            },
            onSuccess: () => {
                toast.success("Success!", { id: submitTestToast });
                void dataState.class.invalidate();
                setForm(blankForm);
                void router.push("/teacher");
            },
            onError: (e) => {
                toast.error(e.message, { id: submitTestToast });
            },
        });

    if (status == "loading" || submitTestStatus == "loading")
        return <LoadingPage />;

    if (status != "authenticated") {
        void signIn("email");
        return;
    }

    return (
        <CardPanel>
            <div className="absolute left-6 top-6 transition-all">
                <Link href={`/teacher`}>
                    <span className="click-span ">{"<"} back</span>
                </Link>
            </div>
            <form className="col-span-12 mx-auto mt-6 w-full max-w-[1000px] transition-all xl:mt-0">
                <label htmlFor="test-title">
                    Title:
                    <input
                        className="test-input p-2 text-lg"
                        placeholder="Test title"
                        id="test-title"
                        required
                        type="text"
                        onChange={(e) => {
                            setForm((p) => ({
                                ...p,
                                title: e.target.value,
                            }));
                        }}
                        value={form.title ?? ""}
                    />
                </label>
                <div className="mt-12">
                    <h2 className="cursor-default underline">
                        Multiple choice questions
                    </h2>
                    <div className="mt-6 flex flex-col gap-12">
                        {form.choiceQuestions.map(
                            (cq: ChoiceQuestion, iQuestion: number) => {
                                return (
                                    <div className="flex flex-col">
                                        <div>
                                            <div className="flex flex-row items-start gap-3">
                                                <span className="flex h-8 w-4 items-center text-lg underline">
                                                    {iQuestion + 1}.
                                                </span>
                                                <div className="flex w-full flex-col">
                                                    <input
                                                        id={`question-${iQuestion}`}
                                                        className="test-input"
                                                        type="text"
                                                        required
                                                        placeholder="Your question here"
                                                        onChange={(e) => {
                                                            setForm(
                                                                (
                                                                    p: CreateTestForm,
                                                                ): CreateTestForm => {
                                                                    const newQuestions =
                                                                        [
                                                                            ...p.choiceQuestions,
                                                                        ];

                                                                    newQuestions[
                                                                        iQuestion
                                                                    ] = {
                                                                        ...cq,
                                                                        prompt: e
                                                                            .target
                                                                            .value,
                                                                    };

                                                                    return {
                                                                        ...p,
                                                                        choiceQuestions:
                                                                            newQuestions,
                                                                    };
                                                                },
                                                            );
                                                        }}
                                                        value={cq.prompt}
                                                    />
                                                    <Tooltip
                                                        clickable
                                                        delayHide={0}
                                                        delayShow={100}
                                                        anchorSelect={`#question-${iQuestion}`}
                                                        place="right"
                                                    >
                                                        <span
                                                            onClick={() => {
                                                                setForm((p) => {
                                                                    const choiceQuestions =
                                                                        p.choiceQuestions;
                                                                    choiceQuestions.splice(
                                                                        iQuestion,
                                                                        1,
                                                                    );

                                                                    return {
                                                                        ...p,
                                                                        choiceQuestions,
                                                                    };
                                                                });
                                                            }}
                                                            className="click-span self-end"
                                                        >
                                                            - Remove question
                                                        </span>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <div className="flex flex-col gap-3">
                                                {cq.choices.map(
                                                    (choice, iChoice) => {
                                                        const correct =
                                                            iChoice ===
                                                            cq.correctAnswer;

                                                        return (
                                                            <div className="flex flex-row items-start gap-3">
                                                                <span
                                                                    id={`correct-${iQuestion}-${iChoice}`}
                                                                    onClick={() => {
                                                                        setForm(
                                                                            (
                                                                                p,
                                                                            ) => {
                                                                                const prev =
                                                                                    form.choiceQuestions;
                                                                                const newChoiceQuestions =
                                                                                    [
                                                                                        ...prev,
                                                                                    ];

                                                                                newChoiceQuestions[
                                                                                    iQuestion
                                                                                ] =
                                                                                    {
                                                                                        ...(newChoiceQuestions[
                                                                                            iQuestion
                                                                                        ] ??
                                                                                            defaultCq),
                                                                                        correctAnswer:
                                                                                            iChoice,
                                                                                    };

                                                                                return {
                                                                                    ...p,
                                                                                    choiceQuestions:
                                                                                        newChoiceQuestions,
                                                                                };
                                                                            },
                                                                        );
                                                                    }}
                                                                    className={` relative flex h-8 w-4 cursor-pointer items-center ${
                                                                        correct &&
                                                                        "correct-choice"
                                                                    }`}
                                                                >
                                                                    {alphabetize(
                                                                        iChoice,
                                                                    )}
                                                                    .
                                                                </span>
                                                                <Tooltip
                                                                    delayHide={
                                                                        0
                                                                    }
                                                                    delayShow={
                                                                        500
                                                                    }
                                                                    place="left"
                                                                    anchorSelect={`#correct-${iQuestion}-${iChoice}`}
                                                                >
                                                                    {correct
                                                                        ? "Labeled as correct!"
                                                                        : "Click to set as correct answer"}
                                                                </Tooltip>
                                                                <div className="flex w-full flex-col">
                                                                    <input
                                                                        required
                                                                        id={`question-${iQuestion}-choice-${iChoice}`}
                                                                        placeholder={`Answer ${
                                                                            iChoice +
                                                                            1
                                                                        }`}
                                                                        onChange={(
                                                                            e,
                                                                        ) => {
                                                                            setForm(
                                                                                (
                                                                                    p: CreateTestForm,
                                                                                ): CreateTestForm => {
                                                                                    const prev =
                                                                                        p
                                                                                            .choiceQuestions[
                                                                                            iQuestion
                                                                                        ]
                                                                                            ?.choices;
                                                                                    if (
                                                                                        !prev
                                                                                    ) {
                                                                                        throw new Error(
                                                                                            "No corresponding choice",
                                                                                        );
                                                                                    }
                                                                                    const choices =
                                                                                        [
                                                                                            ...prev,
                                                                                        ];

                                                                                    choices[
                                                                                        iChoice
                                                                                    ] =
                                                                                        e.target.value;

                                                                                    p.choiceQuestions[
                                                                                        iQuestion
                                                                                    ] =
                                                                                        {
                                                                                            ...cq,
                                                                                            choices:
                                                                                                choices,
                                                                                        };
                                                                                    return {
                                                                                        ...p,
                                                                                        choiceQuestions:
                                                                                            p.choiceQuestions,
                                                                                    };
                                                                                },
                                                                            );
                                                                        }}
                                                                        value={
                                                                            choice
                                                                        }
                                                                        className="test-input"
                                                                        type="text"
                                                                    />
                                                                    <Tooltip
                                                                        clickable
                                                                        delayHide={
                                                                            0
                                                                        }
                                                                        delayShow={
                                                                            100
                                                                        }
                                                                        anchorSelect={`#question-${iQuestion}-choice-${iChoice}`}
                                                                        place="right"
                                                                    >
                                                                        <span
                                                                            onClick={() => {
                                                                                if (
                                                                                    cq
                                                                                        .choices
                                                                                        .length <=
                                                                                    2
                                                                                ) {
                                                                                    toast.error(
                                                                                        "Less than 2 options not allowed!",
                                                                                    );
                                                                                    return;
                                                                                }

                                                                                const prev =
                                                                                    [
                                                                                        ...cq.choices,
                                                                                    ];
                                                                                prev.splice(
                                                                                    iChoice,
                                                                                    1,
                                                                                );
                                                                                form.choiceQuestions[
                                                                                    iQuestion
                                                                                ] =
                                                                                    {
                                                                                        ...cq,
                                                                                        choices:
                                                                                            prev,
                                                                                    };
                                                                                setForm(
                                                                                    (
                                                                                        p: CreateTestForm,
                                                                                    ): CreateTestForm => ({
                                                                                        ...p,
                                                                                        choiceQuestions:
                                                                                            form.choiceQuestions,
                                                                                    }),
                                                                                );
                                                                            }}
                                                                            className="click-span shrink-0 self-end text-nowrap"
                                                                        >
                                                                            -
                                                                            Remove
                                                                            option
                                                                        </span>
                                                                    </Tooltip>
                                                                </div>
                                                            </div>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-row gap-6 self-end">
                                            <span
                                                onClick={() => {
                                                    if (
                                                        cq.choices.length >= 6
                                                    ) {
                                                        toast.error(
                                                            "More than 6 options not currently permitted!",
                                                        );
                                                        return;
                                                    }
                                                    setForm(
                                                        (
                                                            p: CreateTestForm,
                                                        ): CreateTestForm => {
                                                            const prev: ChoiceQuestion[] =
                                                                p.choiceQuestions;

                                                            const newQuestions =
                                                                [...prev];

                                                            newQuestions[
                                                                iQuestion
                                                            ] = {
                                                                ...cq,
                                                                choices: [
                                                                    ...cq.choices,
                                                                    "",
                                                                ],
                                                            };

                                                            return {
                                                                ...p,
                                                                choiceQuestions:
                                                                    newQuestions,
                                                            };
                                                        },
                                                    );
                                                }}
                                                className="click-span"
                                            >
                                                Add option +
                                            </span>
                                        </div>
                                    </div>
                                );
                            },
                        )}
                        <div className="mt-3 flex flex-row justify-center">
                            <span
                                onClick={() => {
                                    setForm(
                                        (
                                            p: CreateTestForm,
                                        ): CreateTestForm => ({
                                            ...p,
                                            choiceQuestions: [
                                                ...p.choiceQuestions,
                                                defaultCq,
                                            ],
                                        }),
                                    );
                                }}
                                className="click-span"
                            >
                                Add multiple choice question +
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                    <h2 className="cursor-default underline">
                        Response questions
                    </h2>
                    <div className="mt-6 flex flex-col gap-3">
                        {form.textQuestions
                            // .sort((tq) => )
                            .map((tq, i) => {
                                return (
                                    <div>
                                        <Tooltip
                                            delayHide={0}
                                            delayShow={100}
                                            place="right"
                                            anchorSelect={`#tq-${i}`}
                                        >
                                            <span className="text-amber-600">
                                                {tqParse(tq.type)}
                                            </span>
                                        </Tooltip>
                                        <div className="flex flex-row items-start gap-3">
                                            <span className="flex h-8 w-4 items-center text-lg underline">
                                                {i + 1}.
                                            </span>
                                            <input
                                                id={`tq-${i}`}
                                                type="text"
                                                required
                                                placeholder={`${tqParse(
                                                    tq.type,
                                                )}`}
                                                className="test-input"
                                                onChange={(e) => {
                                                    setForm(
                                                        (p: CreateTestForm) => {
                                                            const prev: TextQuestion[] =
                                                                [
                                                                    ...p.textQuestions,
                                                                ];

                                                            prev[i] = {
                                                                ...tq,
                                                                prompt: e.target
                                                                    .value,
                                                            };

                                                            return {
                                                                ...p,
                                                                textQuestions:
                                                                    prev,
                                                            };
                                                        },
                                                    );
                                                }}
                                                value={tq.prompt}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                    <div className="mt-12 flex flex-row justify-center gap-3">
                        <span
                            id="add-sa"
                            onClick={() => {
                                setForm(
                                    (p: CreateTestForm): CreateTestForm => ({
                                        ...p,
                                        textQuestions: [
                                            ...p.textQuestions,
                                            {
                                                prompt: "",
                                                type: "Phrase",
                                            },
                                        ],
                                    }),
                                );
                            }}
                            className="click-span"
                        >
                            Add short response question +
                        </span>{" "}
                        <Tooltip
                            clickable
                            className="translate-y-1"
                            delayHide={0}
                            delayShow={100}
                            anchorSelect={`#add-sa`}
                            place="bottom"
                        >
                            <span className="text-amber-600">
                                Provides students a single line text box
                            </span>
                        </Tooltip>
                        <span
                            id="add-la"
                            onClick={() => {
                                setForm(
                                    (p: CreateTestForm): CreateTestForm => ({
                                        ...p,
                                        textQuestions: [
                                            ...p.textQuestions,
                                            {
                                                prompt: "",
                                                type: "ShortAnswer",
                                            },
                                        ],
                                    }),
                                );
                            }}
                            className="click-span"
                        >
                            Add long response question +
                        </span>
                        <Tooltip
                            clickable
                            className="translate-y-1"
                            delayHide={0}
                            delayShow={100}
                            anchorSelect={`#add-la`}
                            place="bottom"
                        >
                            <span className="text-amber-600">
                                Provides students a paragraph sized text box
                            </span>
                        </Tooltip>
                        <span
                            id="add-essay"
                            onClick={() => {
                                setForm(
                                    (p: CreateTestForm): CreateTestForm => ({
                                        ...p,
                                        textQuestions: [
                                            ...p.textQuestions,
                                            {
                                                prompt: "",
                                                type: "Essay",
                                            },
                                        ],
                                    }),
                                );
                            }}
                            className="click-span"
                        >
                            Add essay question +
                        </span>
                        <Tooltip
                            clickable
                            className="translate-y-1 "
                            delayHide={0}
                            delayShow={100}
                            anchorSelect={`#add-essay`}
                            place="bottom"
                        >
                            <span className="text-amber-600">
                                Provides students an essay response field
                            </span>
                        </Tooltip>
                    </div>
                </div>
                <div className="mt-24 flex flex-col">
                    <Button
                        onClick={(e) => {
                            e.preventDefault();

                            const [id, missing] = formMissingField(form);
                            if (missing) {
                                toast.error("Please fill out all fields!");
                                const input = document.getElementById(id);
                                if (!input) {
                                    throw new Error(id);
                                }
                                input.scrollIntoView();
                                const highlights = [
                                    "outline-2",
                                    "outline-red-500",
                                ];
                                input.classList.add(...highlights);
                                input.onfocus = (e) => {
                                    input.classList.remove(...highlights);
                                };
                            } else {
                                submitTestForm(form);
                            }
                        }}
                        className="self-center"
                    >
                        Create Test
                    </Button>
                </div>
            </form>
        </CardPanel>
    );
};

export default CreateTestPage;

function formMissingField(
    form: CreateTestForm,
): [string, true] | [null, false] {
    let missingId: [null, false] | [string, true] = [null, false];

    if (form.title === "" || !form.title) {
        missingId = ["test-title", true];
        return missingId;
    }

    form.choiceQuestions.forEach((cq, icq) => {
        if (cq.prompt === "") {
            missingId = [`question-${icq}`, true];
        }
        cq.choices.map((c, ic) => {
            if (c === "") {
                missingId = [`question-${icq}-choice-${ic}`, true];
            }
        });
    });

    form.textQuestions.forEach((tq, tqi) => {
        if (tq.prompt === "") {
            missingId = [`tq-${tqi}`, true];
        }
    });

    return missingId;
}
