import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useState } from "react";
import Button from "~/components/Button";
import Card from "~/components/Card";
import CardPanel from "~/components/CardPanel";
import LoadingPage from "~/components/LoadingPage";
import { GetClassrooms, api } from "~/utils/api";

const StudentPage = () => {
    const session = useSession();
    const router = useRouter();

    const { data: classrooms, isLoading: classroomsLoading } =
        api.student.getClasses.useQuery();

    const [selectedClassroomId, selectClassroom] = useState<null | string>(
        null,
    );

    if (session.status == "loading" || classroomsLoading)
        return <LoadingPage />;

    if (session.status != "authenticated") {
        void signIn("email");
        return;
    }

    return (
        <CardPanel>
            <div className="flex flex-col gap-6 xl:flex-row">
                <Card className="xl:w-4/12">
                    <div className="w-full">
                        <Classrooms
                            selectClassroom={selectClassroom}
                            selectedClassroomId={selectedClassroomId}
                            classrooms={classrooms}
                        />
                    </div>
                </Card>
                <Card className="xl:w-8/12">
                    <div className="w-full">
                        <SubmissionList
                            selectedClassroomId={selectedClassroomId}
                        />
                    </div>
                </Card>
            </div>
            <div className="flex flex-row justify-start">
                <Card className="w-fit">{session.data.user.email}</Card>
            </div>
            <Card className="flex w-fit flex-col items-center gap-3">
                <Button
                    className="whitespace-nowrap"
                    onClick={() => {
                        void signOut();
                    }}
                >
                    Sign Out
                </Button>
            </Card>
        </CardPanel>
    );
};

type ClassroomsProps = {
    selectClassroom: React.Dispatch<React.SetStateAction<string | null>>;
    selectedClassroomId: string | null;
    classrooms: GetClassrooms | undefined;
};

const Classrooms = ({
    selectClassroom,
    selectedClassroomId,
    classrooms,
}: ClassroomsProps) => {
    if (classrooms) {
        return (
            <div className="w-full">
                <h2 className="mb-3 flex flex-row justify-between">
                    <span>Classes</span>
                    {selectedClassroomId && (
                        <span
                            onClick={() => {
                                selectClassroom(null);
                            }}
                            className="click-span"
                        >
                            {"< All classes"}
                        </span>
                    )}
                </h2>
                <div className="relative flex max-h-[45vh] w-full border-collapse flex-col  overflow-y-auto">
                    {classrooms.map((classroom, i) => {
                        const isSelected = selectedClassroomId === classroom.id;
                        const bordered = i > 0;
                        return (
                            <>
                                {bordered && (
                                    <hr className="border-stone-800" />
                                )}

                                <div
                                    key={i}
                                    onClick={() => {
                                        selectClassroom(classroom.id);
                                    }}
                                    className={`flex w-full flex-row justify-between gap-3 rounded-md border-[1px] p-2 transition-[background] duration-200 ease-out hover:cursor-pointer  ${
                                        isSelected
                                            ? " z-10 border-amber-600 bg-stone-950 hover:bg-stone-800"
                                            : "border-transparent hover:bg-stone-800"
                                    }`}
                                >
                                    <div>
                                        {classroom.title} - {classroom.season}{" "}
                                        {classroom.schoolYear}
                                    </div>
                                    <div className="shrink-0">
                                        <div>
                                            Tests: {classroom._count.tests}
                                        </div>
                                    </div>
                                </div>
                            </>
                        );
                    })}
                </div>
            </div>
        );
    } else return "No classes";
};

export default StudentPage;

const SubmissionList = ({
    selectedClassroomId,
}: {
    selectedClassroomId: string | null;
}) => {
    const { data: submittedTests, isLoading: submittedTestsLoading } =
        api.student.getSubmittedTests.useQuery();

    if (submittedTestsLoading) {
        return "Loading...";
    }

    if (!submittedTests) {
        return "Submissions could not be found!";
    }

    const submissions = submittedTests
        .filter((submission) => {
            if (!!selectedClassroomId) {
                return submission.classId === selectedClassroomId;
            } else {
                return true;
            }
        })
        .map((submission, i, list) => {
            return (
                <div className="flex flex-row justify-between py-1">
                    <div className="w-full">{submission.test.title}</div>
                    <div className="grid w-full grid-cols-2 gap-3">
                        <div className="">
                            {submission.score
                                ? `${submission.score}%`
                                : "Not yet graded"}
                        </div>
                        <div className="">
                            {submission.class.title} - {submission.class.season}{" "}
                            {submission.class.schoolYear}
                        </div>
                    </div>
                </div>
            );
        });

    if (!submissions.length) {
        return `No submissions yet${
            selectedClassroomId ? " for this class" : ""
        }.`;
    }

    return (
        <div>
            <div>
                <h2 className="mb-3">Submitted tests</h2>
                <div className="flex flex-row justify-between">
                    <div className="w-full">Test</div>
                    <div className="grid w-full grid-cols-2 gap-3">
                        <div className="">Score</div>
                        <div className="">Class</div>
                    </div>
                </div>
                <div className="divide-y divide-stone-900">{submissions}</div>
            </div>
        </div>
    );
};
