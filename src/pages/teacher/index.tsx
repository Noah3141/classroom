import { Season } from "@prisma/client";
import {
    GetServerSideProps,
    InferGetServerSidePropsType,
    NextPage,
} from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext, useState } from "react";
import toast from "react-hot-toast";
import Button from "~/components/Button";
import Card from "~/components/Card";
import CardPanel from "~/components/CardPanel";
import LoadingPage from "~/components/LoadingPage";
import { CreateClassForm } from "~/server/api/routers/teacher";
import { api } from "~/utils/api";
import { dtfmt } from "~/utils/datetimeFormatter";

const ClassList = () => {
    const { data: classes, isLoading } = api.class.getByTeacherId.useQuery();

    if (isLoading) {
        return "Loading...";
    }
    if (!classes) {
        return <div>No classes</div>;
    }
    return (
        <div>
            <h1 className="mb-3">Classes</h1>
            <div className="flex max-h-[45vh] flex-col divide-y divide-stone-800 overflow-y-auto">
                {classes.map((classroom) => {
                    return (
                        <Link href={`/classroom/${classroom.id}`}>
                            <div className="flex flex-row justify-between rounded-md p-2  transition-all duration-200 ease-out hover:bg-stone-800">
                                <div className="">
                                    <span className="">{classroom.title}</span>
                                </div>
                                <div className="grid grid-cols-3">
                                    <span className="">{classroom.season}</span>
                                    <span>
                                        Students: {classroom._count.students}
                                    </span>
                                    <span className="text-end">
                                        Tests: {classroom._count.tests}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

const TestsList = () => {
    const { data: tests, isLoading } = api.teacher.getTests.useQuery();

    if (isLoading) {
        return "Loading...";
    }
    if (!tests) {
        return <div>No tests</div>;
    }
    return (
        <div>
            <h1>Tests</h1>
            <div className="my-3 flex max-h-[45vh] flex-col  divide-y divide-stone-800 overflow-y-auto">
                {tests.map((test) => {
                    return (
                        <Link href={`/teacher/tests/${test.id}`}>
                            <div className="flex flex-row justify-between rounded-md p-2 transition-all duration-200 ease-out hover:bg-stone-800">
                                <h1>{test.title}</h1>
                                <div className="grid grid-cols-2">
                                    <div className="col-span-1">
                                        questions: {test.length}
                                    </div>
                                    <div className="col-span-1 text-right">
                                        {dtfmt({
                                            at: test.lastSubmission,
                                            ifNull: "None yet",
                                        })}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

const CreateClassWizard = () => {
    const currentYear: number = new Date().getFullYear();

    const BlankState: CreateClassForm = {
        season: "Fall",
        title: null,
        year: currentYear,
    };
    const dataState = api.useUtils();
    const [expanded, setExpanded] = useState(false);
    const [form, setForm] = useState<CreateClassForm>(BlankState);

    const createClassToastId = "createClassToastId";
    const {
        mutate: createClass,
        status,
        reset,
    } = api.teacher.createClass.useMutation({
        onMutate: () => {
            toast.loading("Loading...", { id: createClassToastId });
        },
        onSuccess: () => {
            toast.success("Success!", { id: createClassToastId });
            void dataState.class.invalidate();
            setTimeout(() => {
                void reset();
            }, 1000);
            setForm(BlankState);
        },
        onError: (e) => {
            toast.error(e.message, { id: createClassToastId });
            setTimeout(() => {
                void reset();
            }, 1000);
        },
    });

    return (
        <div className="mt-6 flex flex-col">
            <div
                className={`flex flex-col rounded-md border-[1px]  transition-all duration-100 ${
                    expanded
                        ? `h-62 border-stone-700 p-6`
                        : ` h-6 overflow-hidden border-transparent`
                }`}
            >
                <div className={`flex flex-col gap-3`}>
                    <div className="flex w-full justify-between">
                        <h2>{expanded ? "Create a class" : ""}</h2>
                        <span
                            onClick={() => {
                                setExpanded((p) => !p);
                            }}
                            className="click-span self-end"
                        >
                            Create class {expanded ? `-` : `+`}
                        </span>
                    </div>
                    <div
                        className={`flex w-fit flex-col gap-3 ${
                            expanded ? "" : "hidden"
                        }`}
                    >
                        <input
                            placeholder="Intro to subject"
                            value={form.title ?? ""}
                            onChange={(e) => {
                                setForm((p) => ({
                                    ...p,
                                    title: e.target.value,
                                }));
                            }}
                            className="rounded-sm bg-stone-950 p-1 placeholder-stone-700 outline-none hover:cursor-pointer hover:bg-stone-800 focus:cursor-text focus:bg-stone-950 focus:ring-2 focus:ring-amber-600"
                            type="text"
                        />
                        <select
                            className="rounded-sm bg-stone-950 p-1 outline-none hover:cursor-pointer hover:bg-stone-800 focus:cursor-text focus:bg-stone-950 focus:ring-2 focus:ring-amber-600"
                            name=""
                            id=""
                            value={form.season}
                            onChange={(e) => {
                                setForm((p) => ({
                                    ...p,
                                    season: e.target.value as Season,
                                }));
                            }}
                        >
                            <option value={Season.Fall}>Fall</option>
                            <option value={Season.Spring}>Spring</option>
                            <option value={Season.Summer}>Summer</option>
                            <option value={Season.Winter}>Winter</option>
                        </select>
                        <input
                            type="number"
                            className="rounded-sm bg-stone-950 p-1 outline-none hover:cursor-pointer hover:bg-stone-800 focus:cursor-text focus:bg-stone-950 focus:ring-2 focus:ring-amber-600"
                            min={1997}
                            max={2100}
                            step={1}
                            value={form.year}
                            onChange={(e) => {
                                setForm((p) => ({
                                    ...p,
                                    year: parseInt(e.target.value),
                                }));
                            }}
                        />
                    </div>
                </div>
                <Button
                    status={status}
                    disabled={status !== "idle"}
                    onClick={() => {
                        createClass(form);
                    }}
                    className={`self-end ${expanded ? "" : "hidden"}`}
                >
                    Create Class
                </Button>
            </div>
        </div>
    );
};
const CreateTestWizard = () => {
    return (
        <Link className="self-end" href={`/create-test`}>
            <span className="click-span">Create Test {">"}</span>
        </Link>
    );
};

const TeacherPage = () => {
    const { data, status } = useSession();
    const router = useRouter();

    if (status == "loading") return <LoadingPage />;

    if (status != "authenticated") {
        void signIn("email");
        return;
    }

    if (!data.user.roles.some((role) => role == "Admin" || role == "Teacher")) {
        void router.push("/");
    }

    return (
        <CardPanel>
            <h1>Teacher Panel</h1>

            <div className="flex flex-col gap-6 xl:flex-row">
                <Card className="col-span-6 w-full flex-col">
                    <ClassList />
                    <CreateClassWizard />
                </Card>
                <Card className="col-span-6 w-full flex-col">
                    <TestsList />
                    <CreateTestWizard />
                </Card>
            </div>

            <div>
                <Card className="w-fit">
                    {data.user.name}
                    <Button
                        className="whitespace-nowrap"
                        onClick={() => {
                            void signOut();
                        }}
                    >
                        Sign Out
                    </Button>
                </Card>
            </div>
        </CardPanel>
    );
};

export default TeacherPage;
